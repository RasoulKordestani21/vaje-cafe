"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Building2, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { adminFetchInit } from "@/services/dbService";

interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

interface BranchesManagementProps {
  isDark: boolean;
}

const BranchesManagement: React.FC<BranchesManagementProps> = ({ isDark }) => {
  const { success, error: showError } = useToast();
  const confirm = useConfirm();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    isActive: true
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/branches");
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
      } else {
        showError("خطا در بارگذاری شعب");
      }
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      showError("خطا در بارگذاری شعب");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        const res = await fetch(`/api/branches/${editingBranch.id}`, {
          method: "PUT",
          ...adminFetchInit(),
          headers: {
            ...(adminFetchInit().headers as Record<string, string>),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          success("شعبه با موفقیت بروزرسانی شد");
          setShowForm(false);
          setEditingBranch(null);
          setFormData({ name: "", address: "", phone: "", email: "", isActive: true });
          fetchBranches();
        } else {
          showError("خطا در بروزرسانی شعبه");
        }
      } else {
        const res = await fetch("/api/branches", {
          method: "POST",
          ...adminFetchInit(),
          headers: {
            ...(adminFetchInit().headers as Record<string, string>),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          success("شعبه با موفقیت ایجاد شد");
          setShowForm(false);
          setFormData({ name: "", address: "", phone: "", email: "", isActive: true });
          fetchBranches();
        } else {
          showError("خطا در ایجاد شعبه");
        }
      }
    } catch (error) {
      console.error("Error saving branch:", error);
      showError("خطا در ذخیره‌سازی شعبه");
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address || "",
      phone: branch.phone || "",
      email: branch.email || "",
      isActive: branch.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "حذف شعبه",
      message: "آیا از حذف این شعبه اطمینان دارید؟",
      confirmLabel: "حذف",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/branches/${id}`, {
        method: "DELETE",
        ...adminFetchInit(),
      });
      if (res.ok) {
        success("شعبه با موفقیت حذف شد");
        fetchBranches();
      } else {
        const error = await res.json();
        showError(error.error || "خطا در حذف شعبه");
      }
    } catch (error) {
      console.error("Error deleting branch:", error);
      showError("خطا در حذف شعبه");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <span className={cn(isDark ? "text-gray-400" : "text-gray-600")}>
          در حال بارگذاری...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className={cn("text-xl font-bold", isDark ? "text-white" : "text-gray-900")}>
          مدیریت شعب
        </h2>
        <Button
          onClick={() => {
            setEditingBranch(null);
            setFormData({ name: "", address: "", phone: "", email: "", isActive: true });
            setShowForm(true);
          }}
          className="bg-primary-500 hover:bg-primary-600 text-white"
        >
          <Plus size={18} className="ml-2" />
          افزودن شعبه جدید
        </Button>
      </div>

      {showForm && (
        <Card
          className={cn(
            isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
          )}
        >
          <CardHeader>
            <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
              {editingBranch ? "ویرایش شعبه" : "افزودن شعبه جدید"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className={cn("block text-sm font-medium mb-1", isDark ? "text-gray-300" : "text-gray-700")}>
                  نام شعبه *
                </Label>
                <Input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={cn(
                    "w-full",
                    isDark
                      ? "bg-neutral-800 border-white/10 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  )}
                />
              </div>
              <div>
                <Label className={cn("block text-sm font-medium mb-1", isDark ? "text-gray-300" : "text-gray-700")}>
                  آدرس
                </Label>
                <Input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className={cn(
                    "w-full",
                    isDark
                      ? "bg-neutral-800 border-white/10 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={cn("block text-sm font-medium mb-1", isDark ? "text-gray-300" : "text-gray-700")}>
                    تلفن
                  </Label>
                  <Input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className={cn(
                      "w-full",
                      isDark
                        ? "bg-neutral-800 border-white/10 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    )}
                  />
                </div>
                <div>
                  <Label className={cn("block text-sm font-medium mb-1", isDark ? "text-gray-300" : "text-gray-700")}>
                    ایمیل
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className={cn(
                      "w-full",
                      isDark
                        ? "bg-neutral-800 border-white/10 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    )}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <Label htmlFor="isActive" className={cn("text-sm", isDark ? "text-gray-300" : "text-gray-700")}>
                  فعال
                </Label>
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1 bg-coffee-600 hover:bg-coffee-500 text-white"
                >
                  {editingBranch ? "بروزرسانی" : "ایجاد"}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingBranch(null);
                  }}
                  variant="outline"
                  className={cn(
                    isDark
                      ? "bg-neutral-800 border-neutral-700 text-gray-300 hover:bg-neutral-700"
                      : "bg-gray-200 border-gray-300 text-gray-700 hover:bg-gray-300"
                  )}
                >
                  انصراف
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card
        className={cn(
          "overflow-hidden",
          isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
        )}
      >
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {branches.map(branch => (
              <div
                key={branch.id}
                className={cn(
                  "p-6 flex items-center justify-between transition-colors",
                  isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2
                      size={20}
                      className={branch.isActive ? "text-coffee-500" : "text-gray-500"}
                    />
                    <h3 className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
                      {branch.name}
                    </h3>
                    {!branch.isActive && (
                      <span className="text-xs px-2 py-1 rounded bg-gray-500/20 text-gray-400">
                        غیرفعال
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {branch.address && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className={isDark ? "text-gray-500" : "text-gray-400"} />
                        <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                          {branch.address}
                        </span>
                      </div>
                    )}
                    {branch.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className={isDark ? "text-gray-500" : "text-gray-400"} />
                        <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                          {branch.phone}
                        </span>
                      </div>
                    )}
                    {branch.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} className={isDark ? "text-gray-500" : "text-gray-400"} />
                        <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                          {branch.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(branch)}
                    className={cn(
                      "h-9 w-9",
                      isDark
                        ? "bg-neutral-800 hover:bg-coffee-600 text-gray-400 hover:text-white"
                        : "bg-gray-100 hover:bg-coffee-600 text-gray-600 hover:text-white"
                    )}
                    title="ویرایش"
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(branch.id)}
                    className={cn(
                      "h-9 w-9",
                      isDark
                        ? "bg-neutral-800 hover:bg-red-600 text-gray-400 hover:text-white"
                        : "bg-gray-100 hover:bg-red-600 text-gray-600 hover:text-white"
                    )}
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {branches.length === 0 && (
            <div className={cn("p-12 text-center", isDark ? "text-gray-400" : "text-gray-600")}>
              شعبه‌ای وجود ندارد
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BranchesManagement;




