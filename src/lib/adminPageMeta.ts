import { DashboardPage } from "@/components/dashboard/DashboardSidebar";

export interface AdminPageMeta {
  title: string;
  breadcrumb: string;
  group: string;
}

export const ADMIN_PAGE_META: Record<DashboardPage, AdminPageMeta> = {
  dashboard: { title: "داشبورد", breadcrumb: "داشبورد", group: "اصلی" },
  orders: { title: "مدیریت سفارشات", breadcrumb: "سفارشات", group: "اصلی" },
  menu: { title: "مدیریت منو", breadcrumb: "منو", group: "اصلی" },
  "customer-orders": {
    title: "سفارشات مشتری",
    breadcrumb: "سفارشات مشتری",
    group: "اصلی"
  },
  customers: { title: "مشتریان", breadcrumb: "مشتریان", group: "مدیریت" },
  expenses: { title: "هزینه‌ها", breadcrumb: "هزینه‌ها", group: "مدیریت" },
  ratings: {
    title: "نظرات و امتیازها",
    breadcrumb: "نظرات",
    group: "مدیریت"
  },
  "customer-messages": {
    title: "پیام‌های مشتریان",
    breadcrumb: "پیام‌ها",
    group: "مدیریت"
  },
  gallery: { title: "گالری تصاویر", breadcrumb: "گالری", group: "محتوایی" },
  stories: { title: "استوری‌ها", breadcrumb: "استوری‌ها", group: "محتوایی" },
  "experience-comments": {
    title: "نظرات تجربه",
    breadcrumb: "نظرات تجربه",
    group: "محتوایی"
  },
  loyalty: {
    title: "برنامه وفاداری",
    breadcrumb: "وفاداری",
    group: "مدیریت"
  },
  reports: { title: "گزارش‌ها", breadcrumb: "گزارش‌ها", group: "تحلیل" },
  waste: { title: "مدیریت ضایعات", breadcrumb: "ضایعات", group: "تحلیل" },
  stats: { title: "آمار", breadcrumb: "آمار", group: "تحلیل" },
  inventory: { title: "موجودی", breadcrumb: "موجودی", group: "مدیریت" },
  branches: { title: "شعب", breadcrumb: "شعب", group: "مدیریت" },
  staff: { title: "مدیریت کارکنان", breadcrumb: "کارکنان", group: "مدیریت" },
  settings: { title: "تنظیمات سایت", breadcrumb: "تنظیمات", group: "تنظیمات" },
  banners: { title: "بنرها", breadcrumb: "بنرها", group: "محتوایی" },
  "working-hours": {
    title: "ساعات کاری",
    breadcrumb: "ساعات کاری",
    group: "تنظیمات"
  }
};

export const ADMIN_ROLE_LABELS: Record<string, string> = {
  super_admin: "مدیر ارشد",
  admin: "مدیر",
  manager: "مدیر شعبه",
  waiter: "گارسون",
  barista: "باریستا"
};

export function searchAdminPages(query: string): DashboardPage[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return (Object.entries(ADMIN_PAGE_META) as [DashboardPage, AdminPageMeta][])
    .filter(
      ([, meta]) =>
        meta.title.toLowerCase().includes(q) ||
        meta.breadcrumb.toLowerCase().includes(q) ||
        meta.group.toLowerCase().includes(q)
    )
    .map(([id]) => id)
    .slice(0, 6);
}
