import { formatJalaliDate, timestampToJalali } from "@/utils/jalaliDateUtils";

const UTF8_BOM = "\uFEFF";

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(cells: unknown[]): string {
  return cells.map(escapeCsvCell).join(",");
}

function section(title: string, lines: string[]): string[] {
  return [title, ...lines, ""];
}

function formatTs(ts: number | string | null | undefined): string {
  if (!ts) return "";
  if (typeof ts === "string") {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return formatJalaliDate(timestampToJalali(Math.floor(d.getTime() / 1000)));
  }
  return formatJalaliDate(timestampToJalali(ts));
}

export function buildCsv(sections: string[][]): string {
  const body = sections.map(lines => lines.join("\n")).join("\n");
  return UTF8_BOM + body;
}

export function salesReportToCsv(data: any): string {
  const lines: string[] = [];

  lines.push(...section("گزارش فروش", [
    row(["تاریخ تولید", new Date().toLocaleString("fa-IR")]),
  ]));

  lines.push(...section("خلاصه", [
    row(["عنوان", "مقدار"]),
    row(["کل سفارشات", data.totals?.totalOrders ?? 0]),
    row(["کل فروش (تومان)", data.totals?.totalSales ?? 0]),
    row(["میانگین سفارش (تومان)", data.totals?.avgOrderValue ?? 0]),
    row(["مشتریان منحصر به فرد", data.totals?.uniqueCustomers ?? 0]),
  ]));

  if (data.topItems?.length || data.itemSales?.length) {
    const items = data.itemSales ?? data.topItems;
    lines.push("فروش آیتم‌ها");
    lines.push(row(["نام", "تعداد فروش", "درآمد (تومان)", "تعداد سفارشات"]));
    items.forEach((item: any) => {
      lines.push(row([item.name, item.totalQuantity ?? 0, item.totalRevenue ?? 0, item.orderCount ?? 0]));
    });
    lines.push("");
  }

  if (data.categoryData?.length) {
    lines.push("فروش بر اساس دسته‌بندی");
    lines.push(row(["دسته‌بندی", "تعداد سفارشات", "مقدار فروش", "درآمد (تومان)"]));
    data.categoryData.forEach((cat: any) => {
      lines.push(row([cat.category, cat.orderCount ?? 0, cat.totalQuantity ?? 0, cat.totalRevenue ?? 0]));
    });
    lines.push("");
  }

  if (data.orders?.length) {
    lines.push("لیست سفارشات");
    lines.push(row(["شناسه", "تاریخ", "وضعیت", "منبع", "مبلغ (تومان)", "تعداد آیتم", "مشتری"]));
    data.orders.forEach((order: any) => {
      lines.push(row([
        order.id,
        order.createdAt ?? "",
        order.status ?? "",
        order.source ?? "",
        order.totalPrice ?? 0,
        order.itemCount ?? 0,
        order.customerName ?? order.customerPhone ?? "",
      ]));
    });
  }

  return buildCsv([lines]);
}

export function inventoryReportToCsv(data: any): string {
  const lines: string[] = [];

  lines.push(...section("گزارش موجودی", [
    row(["تاریخ تولید", new Date().toLocaleString("fa-IR")]),
    row(["کل آیتم‌ها", data.totals?.totalItems ?? 0]),
    row(["ارزش کل (تومان)", data.totals?.totalValue ?? 0]),
    row(["آیتم‌های کم‌موجودی", data.totals?.lowStockCount ?? 0]),
  ]));

  if (data.rawMaterials?.length) {
    lines.push("مواد اولیه");
    lines.push(row(["نام", "دسته‌بندی", "موجودی", "حداقل", "واحد", "قیمت", "ارزش", "مصرف", "تأمین"]));
    data.rawMaterials.forEach((item: any) => {
      const value = (item.current_stock ?? 0) * (item.price ?? 0);
      lines.push(row([
        item.name,
        item.category,
        item.current_stock ?? 0,
        item.min_stock ?? 0,
        item.unit,
        item.price ?? 0,
        value,
        item.usageQuantity ?? 0,
        item.restockQuantity ?? 0,
      ]));
    });
    lines.push("");
  }

  if (data.lowStock?.length) {
    lines.push("هشدار کم‌موجودی");
    lines.push(row(["نام", "دسته‌بندی", "موجودی فعلی", "حداقل", "واحد"]));
    data.lowStock.forEach((item: any) => {
      lines.push(row([item.name, item.category, item.current_stock ?? 0, item.min_stock ?? 0, item.unit]));
    });
  }

  return buildCsv([lines]);
}

export function staffReportToCsv(data: any): string {
  const lines: string[] = [];

  lines.push(...section("گزارش عملکرد پرسنل", [
    row(["تاریخ تولید", new Date().toLocaleString("fa-IR")]),
    row(["کل پرسنل", data.totals?.totalStaff ?? 0]),
    row(["پرسنل فعال", data.totals?.activeStaff ?? 0]),
  ]));

  if (data.roleSummary?.length) {
    lines.push("خلاصه نقش‌ها");
    lines.push(row(["نقش", "تعداد کل", "فعال"]));
    data.roleSummary.forEach((role: any) => {
      lines.push(row([role.role, role.count ?? 0, role.activeCount ?? 0]));
    });
    lines.push("");
  }

  if (data.staff?.length) {
    lines.push("عملکرد پرسنل");
    lines.push(row(["نام", "ایمیل", "نقش", "تلفن", "عملیات سفارش", "اعلان‌ها", "نرخ خواندن (%)"]));
    data.staff.forEach((member: any) => {
      lines.push(row([
        member.name,
        member.email,
        member.role,
        member.phone ?? "",
        member.orderActions ?? 0,
        member.totalNotifications ?? 0,
        member.notificationReadRate ?? 0,
      ]));
    });
  }

  return buildCsv([lines]);
}

export function customersReportToCsv(data: any): string {
  const lines: string[] = [];

  lines.push(...section("گزارش مشتریان", [
    row(["تاریخ تولید", new Date().toLocaleString("fa-IR")]),
    row(["کل مشتریان (دوره)", data.totals?.totalCustomers ?? 0]),
    row(["مشتریان جدید", data.totals?.newCustomers ?? 0]),
    row(["میانگین سفارش (تومان)", data.totals?.avgOrderValue ?? 0]),
    row(["مشتریان با امتیاز", data.totals?.customersWithPoints ?? 0]),
  ]));

  if (data.segments) {
    lines.push("تقسیم‌بندی مشتریان");
    lines.push(row(["VIP", "عادی", "جدید"]));
    lines.push(row([data.segments.vip ?? 0, data.segments.regular ?? 0, data.segments.new ?? 0]));
    lines.push("");
  }

  const customers = data.customers ?? data.topCustomers ?? [];
  if (customers.length) {
    lines.push("لیست مشتریان");
    lines.push(row([
      "نام", "تلفن", "ایمیل", "کل سفارشات", "کل خرید (تومان)",
      "سفارشات دوره", "خرید دوره (تومان)", "آخرین سفارش", "امتیاز",
    ]));
    customers.forEach((customer: any) => {
      lines.push(row([
        customer.name ?? "",
        customer.phone ?? "",
        customer.email ?? "",
        customer.totalOrders ?? 0,
        customer.totalSpent ?? 0,
        customer.ordersInPeriod ?? 0,
        customer.spentInPeriod ?? 0,
        formatTs(customer.lastOrderDate),
        customer.loyalty_points_balance ?? 0,
      ]));
    });
  }

  return buildCsv([lines]);
}

export type ReportType = "sales" | "inventory" | "staff" | "customers";

export function reportToCsv(type: ReportType, data: any): string {
  switch (type) {
    case "sales": return salesReportToCsv(data);
    case "inventory": return inventoryReportToCsv(data);
    case "staff": return staffReportToCsv(data);
    case "customers": return customersReportToCsv(data);
    default: throw new Error(`Unknown report type: ${type}`);
  }
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  sales: "فروش",
  inventory: "موجودی",
  staff: "پرسنل",
  customers: "مشتریان",
};
