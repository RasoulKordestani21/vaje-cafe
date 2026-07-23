"use client";

import React, { useState, useEffect } from "react";
import { Edit2, Trash2, UserPlus, Loader2, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatJalaliDate, timestampToJalali } from "@/utils/jalaliDateUtils";
import { toPersianDigits } from "@/utils/format";
import { getAuthHeaders } from "@/services/dbService";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";

interface Staff {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: "waiter" | "barista" | "manager";
  branch_id: string | null;
  branch_name?: string;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

interface Branch {
  id: string;
  name: string;
}

interface StaffManagementProps {
  isDark: boolean;
}

const StaffManagement: React.FC<StaffManagementProps> = ({ isDark }) => {
  const { success, error: showError, warning } = useToast();
  const confirm = useConfirm();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "waiter" as "waiter" | "barista" | "manager",
    branch_id: "",
    is_active: true,
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/staff", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch staff");
      }
      const data = await response.json();
      setStaff(data.staff || []);
    } catch (err: any) {
      console.error("Failed to fetch staff:", err);
      showError(err.message || "خطا در بارگذاری کارمندان");
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch("/api/branches", {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setBranches(data.branches || []);
      }
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchBranches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingStaff
        ? `/api/staff/${editingStaff.id}`
        : "/api/staff";
      const method = editingStaff ? "PUT" : "POST";

      const payload: any = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        role: formData.role,
        branch_id: formData.branch_id || null,
        is_active: formData.is_active,
      };

      if (!editingStaff || formData.password) {
        if (!formData.password) {
          warning("رمز عبور الزامی است");
          return;
        }
        payload.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchStaff();
        handleCancel();
        success(editingStaff ? "کارمند با موفقیت ویرایش شد" : "کارمند با موفقیت اضافه شد");
      } else {
        const errorData = await response.json();
        showError(errorData.error || "خطا در ذخیره");
      }
    } catch (err: any) {
      console.error("Failed to save staff:", err);
      showError("خطا در ذخیره");
    }
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      phone: staffMember.phone,
      email: staffMember.email || "",
      password: "",
      role: staffMember.role,
      branch_id: staffMember.branch_id || "",
      is_active: staffMember.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "حذف کارمند",
      message: "آیا از حذف این کارمند اطمینان دارید؟",
      confirmLabel: "حذف",
      variant: "destructive",
    });
    if (!ok) return;

    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        await fetchStaff();
        success("کارمند با موفقیت حذف شد");
      } else {
        showError("خطا در حذف کارمند");
      }
    } catch (err) {
      console.error("Failed to delete staff:", err);
      showError("خطا در حذف کارمند");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStaff(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      password: "",
      role: "waiter",
      branch_id: "",
      is_active: true,
    });
  };

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      waiter: "گارسون",
      barista: "باریستا",
      manager: "مدیر",
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-coffee-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
          مدیریت کارکنان
        </h2>
        <Button
          onClick={() => {
            handleCancel();
            setShowForm(true);
          }}
          className="bg-coffee-600 hover:bg-coffee-500 text-white"
        >
          <UserPlus size={18} className="mr-2" />
          افزودن کارمند
        </Button>
      </div>

      {showForm && (
        <Card className={cn(isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
              {editingStaff ? "ویرایش کارمند" : "افزودن کارمند جدید"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                    نام <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className={cn(
                      "mt-1",
                      isDark
                        ? "bg-neutral-800 border-neutral-700 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                    شماره تماس <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className={cn(
                      "mt-1",
                      isDark
                        ? "bg-neutral-800 border-neutral-700 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="email" className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                    ایمیل <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    dir="ltr"
                    className={cn(
                      "mt-1",
                      isDark
                        ? "bg-neutral-800 border-neutral-700 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="password" className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                    رمز عبور {editingStaff ? "(اختیاری - برای تغییر)" : ""} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingStaff}
                    className={cn(
                      "mt-1",
                      isDark
                        ? "bg-neutral-800 border-neutral-700 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="role" className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                    نقش <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    required
                    className={cn(
                      "mt-1 w-full px-4 py-2 rounded-lg border",
                      isDark
                        ? "bg-neutral-800 border-neutral-700 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    )}
                  >
                    <option value="waiter">گارسون</option>
                    <option value="barista">باریستا</option>
                    <option value="manager">مدیر</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="branch_id" className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                    شعبه (اختیاری)
                  </Label>
                  <select
                    id="branch_id"
                    value={formData.branch_id}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    className={cn(
                      "mt-1 w-full px-4 py-2 rounded-lg border",
                      isDark
                        ? "bg-neutral-800 border-neutral-700 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    )}
                  >
                    <option value="">بدون شعبه</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {editingStaff && (
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className={cn("text-sm", isDark ? "text-gray-300" : "text-gray-700")}>
                      فعال
                    </span>
                  </label>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-coffee-600 hover:bg-coffee-500 text-white"
                >
                  <Save size={16} className="mr-2" />
                  {editingStaff ? "ذخیره تغییرات" : "افزودن"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className={cn(
                    isDark
                      ? "border-white/20 text-white hover:bg-white/10"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <X size={16} className="mr-2" />
                  لغو
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className={cn(isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-200")}>
        <CardHeader className={cn("border-b", isDark ? "border-white/5" : "border-gray-200")}>
          <CardTitle className={cn("text-lg", isDark ? "text-white" : "text-gray-900")}>
            لیست کارکنان ({toPersianDigits(staff.length.toString())})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {staff.length === 0 ? (
            <div className={cn("p-6 text-center", isDark ? "text-gray-500" : "text-gray-600")}>
              هیچ کارمندی ثبت نشده است.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {staff.map((staffMember) => (
                <div
                  key={staffMember.id}
                  className={cn(
                    "p-4 flex items-center justify-between",
                    isDark ? "hover:bg-neutral-800" : "hover:bg-gray-50"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
                        {staffMember.name}
                      </h4>
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          staffMember.role === "manager"
                            ? isDark
                              ? "bg-purple-900/30 text-purple-400"
                              : "bg-purple-100 text-purple-700"
                            : staffMember.role === "barista"
                            ? isDark
                              ? "bg-blue-900/30 text-blue-400"
                              : "bg-blue-100 text-blue-700"
                            : isDark
                            ? "bg-green-900/30 text-green-400"
                            : "bg-green-100 text-green-700"
                        )}
                      >
                        {getRoleLabel(staffMember.role)}
                      </span>
                      {!staffMember.is_active && (
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            isDark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-600"
                          )}
                        >
                          غیرفعال
                        </span>
                      )}
                    </div>
                    <div className={cn("text-sm space-y-1", isDark ? "text-gray-400" : "text-gray-600")}>
                      <p>شماره تماس: {staffMember.phone}</p>
                      {staffMember.email && <p>ایمیل: {staffMember.email}</p>}
                      {staffMember.branch_name && <p>شعبه: {staffMember.branch_name}</p>}
                      <p>تاریخ ثبت: {formatJalaliDate(timestampToJalali(staffMember.created_at))}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(staffMember)}
                      className={cn(
                        isDark
                          ? "bg-neutral-800 hover:bg-coffee-600 text-gray-400 hover:text-white"
                          : "bg-gray-100 hover:bg-coffee-600 text-gray-600 hover:text-white"
                      )}
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(staffMember.id)}
                      variant="destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffManagement;

