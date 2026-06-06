import { useState, useCallback } from "react";
import { MenuItem } from "@/types";

interface UseMenuItemsOptions {
  items: MenuItem[];
  addItem: (item: Omit<MenuItem, "id">, imageFile?: File) => Promise<void>;
  updateItem: (id: string, item: Partial<MenuItem>, imageFile?: File) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

interface UseMenuItemsReturn {
  editingItem: MenuItem | null;
  isSubmitting: boolean;
  setEditingItem: (item: MenuItem | null) => void;
  handleSubmit: (data: Omit<MenuItem, "id">, imageFile?: File) => Promise<void>;
  handleEdit: (item: MenuItem) => void;
  handleDelete: (id: string) => Promise<void>;
  handleCancel: () => void;
}

export const useMenuItems = ({
  items,
  addItem,
  updateItem,
  deleteItem
}: UseMenuItemsOptions): UseMenuItemsReturn => {
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (data: Omit<MenuItem, "id">, imageFile?: File) => {
      setIsSubmitting(true);
      try {
        if (editingItem) {
          await updateItem(editingItem.id, data, imageFile);
          setEditingItem(null);
        } else {
          await addItem(data, imageFile);
          // After adding, find the new item and set it for editing (to allow adding ingredients)
          setTimeout(() => {
            const newItem = items.find(
              item =>
                item.name === data.name &&
                item.category === data.category &&
                item.price === data.price
            );
            if (newItem) {
              setEditingItem(newItem);
            }
          }, 500);
        }
      } catch (error) {
        console.error("Error saving menu item:", error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingItem, addItem, updateItem, items]
  );

  const handleEdit = useCallback((item: MenuItem) => {
    setEditingItem(item);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm("آیا از حذف این آیتم اطمینان دارید؟")) {
        await deleteItem(id);
        if (editingItem?.id === id) {
          setEditingItem(null);
        }
      }
    },
    [deleteItem, editingItem]
  );

  const handleCancel = useCallback(() => {
    setEditingItem(null);
  }, []);

  return {
    editingItem,
    isSubmitting,
    setEditingItem,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleCancel
  };
};




