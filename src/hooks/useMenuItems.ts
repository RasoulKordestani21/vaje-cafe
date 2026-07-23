import { useState, useCallback } from "react";
import { MenuItem } from "@/types";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";

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
  const { success, error: showError } = useToast();
  const confirm = useConfirm();
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (data: Omit<MenuItem, "id">, imageFile?: File) => {
      setIsSubmitting(true);
      try {
        if (editingItem) {
          await updateItem(editingItem.id, data, imageFile);
          setEditingItem(null);
          success("آیتم منو با موفقیت ویرایش شد");
        } else {
          await addItem(data, imageFile);
          success("آیتم منو با موفقیت اضافه شد");
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
        showError("خطا در ذخیره آیتم منو");
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingItem, addItem, updateItem, items, success, showError]
  );

  const handleEdit = useCallback((item: MenuItem) => {
    setEditingItem(item);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      const ok = await confirm({
        title: "حذف آیتم منو",
        message: "آیا از حذف این آیتم اطمینان دارید؟",
        confirmLabel: "حذف",
        variant: "destructive",
      });
      if (!ok) return;

      try {
        await deleteItem(id);
        if (editingItem?.id === id) {
          setEditingItem(null);
        }
        success("آیتم منو با موفقیت حذف شد");
      } catch (error) {
        console.error("Error deleting menu item:", error);
        showError("خطا در حذف آیتم منو");
      }
    },
    [confirm, deleteItem, editingItem, success, showError]
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

