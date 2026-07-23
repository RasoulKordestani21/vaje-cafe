"use client";

import React, { useState, useEffect, useCallback } from "react";

import { X, Plus, Trash2 } from "lucide-react";
import { adminFetchInit } from "@/services/dbService";
import { useToast } from "@/components/ui/toast";

// Removed unused import: formatToman

interface Product {
  id: string;

  name: string;

  type: "raw_material" | "packed_product";

  category: string;

  unit: string;

  currentStock: number;
}

interface Ingredient {
  id?: string;

  productId: string;
  
  rawMaterialId?: string; // Added to support API response format

  productName?: string;

  productType?: string;

  productUnit?: string;

  quantity: number;

  unit: string;
}

interface IngredientModalProps {
  isOpen: boolean;

  onClose: () => void;

  menuItemId: string;

  existingIngredients?: Ingredient[];

  onSave: (ingredients: Ingredient[]) => void;

  isDark: boolean;
}

export const IngredientModal: React.FC<IngredientModalProps> = ({
  isOpen,

  onClose,

  menuItemId,

  existingIngredients = [],

  onSave,

  isDark
}) => {
  const { success, error: showError, warning } = useToast();
  const [ingredients, setIngredients] =
    useState<Ingredient[]>(Array.isArray(existingIngredients) ? existingIngredients : []);
  const [originalIngredients, setOriginalIngredients] = useState<Ingredient[]>(
    []
  );

  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState("");

  const [quantity, setQuantity] = useState("");

  const [unit, setUnit] = useState("");

  // Define fetch functions before useEffect
  // Fetch products - only raw_material type for ingredients
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products?type=raw_material", adminFetchInit());

      if (res.ok) {
        const products = await res.json();
        // Products API returns array directly
        const mappedProducts = products.map((p: any) => ({
          id: p.id,
          name: p.name,
          type: p.type || "raw_material" as const,
          category: p.category,
          unit: p.unit,
          currentStock: p.currentStock || 0
        }));
        setProducts(mappedProducts);
      } else {
        console.error("Failed to fetch products:", res.status, res.statusText);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  }, []);

  const fetchExistingIngredients = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/menu-items/${menuItemId}/ingredients`,
        adminFetchInit()
      );

      if (res.ok) {
        const response = await res.json();
        // API returns { success: true, data: [...] }
        const ingredientsData = response.data || [];
        
        // Transform API response to component format
        const transformedIngredients: Ingredient[] = ingredientsData.map((ing: any) => ({
          id: ing.id,
          productId: ing.productId || ing.rawMaterialId,
          rawMaterialId: ing.rawMaterialId || ing.productId,
          productName: ing.productName,
          productType: ing.productType,
          productUnit: ing.productUnit,
          quantity: ing.quantity,
          unit: ing.unit
        }));
        
        setIngredients(transformedIngredients);
        setOriginalIngredients(transformedIngredients); // Track original ingredients for deletion
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error(
          "Failed to fetch ingredients:",
          res.status,
          res.statusText,
          errorData
        );
        // Set empty array if fetch fails (e.g., no ingredients yet)
        setIngredients([]);
        setOriginalIngredients([]);
      }
    } catch (error) {
      console.error("Failed to fetch ingredients:", error);
      // Set empty array if fetch fails
      setIngredients([]);
      setOriginalIngredients([]);
    }
  }, [menuItemId]);

  useEffect(() => {
    if (isOpen) {
      // Always fetch ingredients from API when modal opens, don't rely on prop
      fetchExistingIngredients();
      fetchProducts();
    }
  }, [isOpen, menuItemId, fetchExistingIngredients, fetchProducts]);

  const handleAddIngredient = () => {
    if (!selectedProductId || !quantity || !unit) {
      warning("لطفا همه فیلدها را پر کنید");

      return;
    }

    const product = products.find(p => p.id === selectedProductId);

    if (!product) return;

    // Check if already added
    if (Array.isArray(ingredients) && ingredients.some(i => i.productId === selectedProductId)) {
      warning("این ماده اولیه قبلا اضافه شده است");

      return;
    }

    const newIngredient: Ingredient = {
      productId: selectedProductId,

      productName: product.name,

      productType: product.type,

      productUnit: product.unit,

      quantity: parseFloat(quantity),

      unit: unit
    };

    setIngredients([...ingredients, newIngredient]);

    setSelectedProductId("");

    setQuantity("");

    setUnit("");
  };

  const handleRemoveIngredient = (productId: string) => {
    setIngredients(ingredients.filter(i => i.productId !== productId));
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      // Delete all original ingredients that are no longer in the current list
      for (const originalIng of originalIngredients) {
        if (originalIng.id) {
          const stillExists = Array.isArray(ingredients) && ingredients.some(
            ing => ing.id === originalIng.id
          );
          if (!stillExists) {
            await fetch(
              `/api/menu-items/${menuItemId}/ingredients?ingredientId=${originalIng.id}`,
              { method: "DELETE", ...adminFetchInit() }
            );
          }
        }
      }

      // Add new ingredients (those without an id)
      for (const ing of ingredients) {
        if (!ing.id) {
          // Use productId (unified system)
          const payload = {
            productId: ing.productId,
            quantity: ing.quantity,
            unit: ing.unit
          };
          
          const res = await fetch(`/api/menu-items/${menuItemId}/ingredients`, {
            method: "POST",
            ...adminFetchInit(),
            headers: {
              ...(adminFetchInit().headers as Record<string, string>),
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to add ingredient: ${res.statusText}`);
          }
        }
      }

      onSave(ingredients);
      success("مواد اولیه با موفقیت ذخیره شد");
      onClose();
    } catch (error) {
      console.error("Failed to save ingredients:", error);
      showError("خطا در ذخیره مواد اولیه");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const bgClass = isDark ? "bg-neutral-900" : "bg-white";

  const textClass = isDark ? "text-white" : "text-gray-900";

  const borderClass = isDark ? "border-white/10" : "border-gray-300";

  const inputBgClass = isDark ? "bg-neutral-800" : "bg-gray-50";

  const inputBorderClass = isDark ? "border-white/20" : "border-gray-300";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
      <div
        className={`${bgClass} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border ${borderClass}`}
      >
        {/* Header */}

        <div
          className={`sticky top-0 flex items-center justify-between p-6 border-b ${borderClass} ${bgClass}`}
        >
          <h2 className={`text-2xl font-bold ${textClass}`}>
            مدیریت مواد اولیه
          </h2>

          <button
            onClick={onClose}
            className="p-2 hover:bg-red-500/20 rounded-lg transition"
          >
            <X size={24} className="text-red-500" />
          </button>
        </div>

        {/* Content */}

        <div className="p-6 space-y-6">
          {/* Add New Ingredient */}

          <div className={`p-4 rounded-lg border ${borderClass}`}>
            <h3 className={`font-bold mb-4 ${textClass}`}>افزودن ماده اولیه</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={selectedProductId}
                onChange={e => {
                  setSelectedProductId(e.target.value);

                  const product = products.find(p => p.id === e.target.value);

                  if (product) {
                    setUnit(product.unit);
                  }
                }}
                className={`px-3 py-2 rounded-lg border ${inputBgClass} ${inputBorderClass} ${textClass}`}
              >
                <option value="">انتخاب ماده اولیه</option>

                {(() => {
                  const safeIngredients = Array.isArray(ingredients) ? ingredients : [];
                  return products?.filter((p: Product) => {
                    return !safeIngredients.some(i => i.productId === p.id);
                  })?.map((product: Product) => (
                    <option key={product?.id} value={product?.id}>
                      {product?.name} ({product?.unit})
                    </option>
                  ));
                })()}
              </select>

              <input
                type="number"
                step="0.01"
                placeholder="مقدار"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className={`px-3 py-2 rounded-lg border ${inputBgClass} ${inputBorderClass} ${textClass}`}
              />

              <input
                type="text"
                placeholder="واحد"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className={`px-3 py-2 rounded-lg border ${inputBgClass} ${inputBorderClass} ${textClass}`}
              />
            </div>

            <button
              onClick={handleAddIngredient}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-coffee-600 hover:bg-coffee-500 text-white rounded-lg transition"
            >
              <Plus size={18} />
              افزودن
            </button>
          </div>

          {/* Ingredients List */}

          <div>
            <h3 className={`font-bold mb-4 ${textClass}`}>
              مواد اولیه ({ingredients.length})
            </h3>

            {ingredients.length === 0 ? (
              <div className={`text-center py-8 text-gray-500`}>
                هیچ ماده اولیه‌ای اضافه نشده است
              </div>
            ) : (
              <div className="space-y-2">
                {ingredients?.map((ingredient: Ingredient, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg border ${borderClass}`}
                  >
                    <div>
                      <div className={`font-semibold ${textClass}`}>
                        {ingredient?.productName || "نامشخص"}
                      </div>

                      <div className="text-sm text-gray-500">
                        {ingredient?.quantity} {ingredient?.unit}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleRemoveIngredient(ingredient?.productId)
                      }
                      className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}

        <div
          className={`sticky bottom-0 flex gap-3 justify-end p-6 border-t ${borderClass} ${bgClass}`}
        >
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg border ${borderClass} ${textClass} hover:opacity-80 transition`}
          >
            لغو
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-coffee-600 hover:bg-coffee-500 text-white transition disabled:opacity-50"
          >
            {loading ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </div>
    </div>
  );
};
