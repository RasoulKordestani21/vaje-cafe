import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/authMiddleware";

/**
 * Export report data as CSV
 * Query params:
 * - type: sales | inventory | staff | customers
 * - startDate: timestamp
 * - endDate: timestamp
 * - format: csv (default)
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = validateSession(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin" && user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!reportType) {
      return NextResponse.json({ error: "Report type is required" }, { status: 400 });
    }

    // Fetch report data from the appropriate endpoint
    const baseUrl = request.nextUrl.origin;
    const reportUrl = `${baseUrl}/api/reports/${reportType}?${startDate ? `startDate=${startDate}&` : ""}${endDate ? `endDate=${endDate}` : ""}`;
    
    const reportResponse = await fetch(reportUrl, {
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
    });

    if (!reportResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch report data" }, { status: 500 });
    }

    const reportData = await reportResponse.json();

    // Convert to CSV based on report type
    let csv = "";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];

    switch (reportType) {
      case "sales":
        csv = convertSalesToCSV(reportData);
        break;
      case "inventory":
        csv = convertInventoryToCSV(reportData);
        break;
      case "staff":
        csv = convertStaffToCSV(reportData);
        break;
      case "customers":
        csv = convertCustomersToCSV(reportData);
        break;
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    const filename = `${reportType}-report-${timestamp}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    );
  }
}

function convertSalesToCSV(data: any): string {
  const lines: string[] = [];
  
  // Header
  lines.push("Sales Report");
  lines.push(`Generated: ${new Date().toLocaleString("fa-IR")}`);
  lines.push("");
  
  // Totals
  lines.push("Summary");
  lines.push("Total Orders," + (data.totals?.totalOrders || 0));
  lines.push("Total Sales," + (data.totals?.totalSales || 0));
  lines.push("Average Order Value," + (data.totals?.avgOrderValue || 0));
  lines.push("Unique Customers," + (data.totals?.uniqueCustomers || 0));
  lines.push("");
  
  // Orders
  lines.push("Orders");
  lines.push("Order ID,Date,Status,Source,Total,Items,Customer");
  if (data.orders) {
    data.orders.forEach((order: any) => {
      lines.push([
        order.id,
        order.createdAt,
        order.status,
        order.source || "",
        order.totalPrice || 0,
        order.itemCount || 0,
        order.customerName || "",
      ].join(","));
    });
  }
  
  return lines.join("\n");
}

function convertInventoryToCSV(data: any): string {
  const lines: string[] = [];
  
  lines.push("Inventory Report");
  lines.push(`Generated: ${new Date().toLocaleString("fa-IR")}`);
  lines.push("");
  
  lines.push("Raw Materials");
  lines.push("Name,Category,Current Stock,Min Stock,Unit,Price,Value,Usage,Restock");
  if (data.rawMaterials) {
    data.rawMaterials.forEach((item: any) => {
      const value = (item.current_stock || 0) * (item.price || 0);
      lines.push([
        item.name || "",
        item.category || "",
        item.current_stock || 0,
        item.min_stock || 0,
        item.unit || "",
        item.price || 0,
        value,
        item.usageQuantity || 0,
        item.restockQuantity || 0,
      ].join(","));
    });
  }
  
  return lines.join("\n");
}

function convertStaffToCSV(data: any): string {
  const lines: string[] = [];
  
  lines.push("Staff Performance Report");
  lines.push(`Generated: ${new Date().toLocaleString("fa-IR")}`);
  lines.push("");
  
  lines.push("Staff");
  lines.push("Name,Email,Role,Phone,Order Actions,Notifications,Read Rate");
  if (data.staff) {
    data.staff.forEach((staff: any) => {
      lines.push([
        staff.name || "",
        staff.email || "",
        staff.role || "",
        staff.phone || "",
        staff.orderActions || 0,
        staff.totalNotifications || 0,
        staff.notificationReadRate || 0,
      ].join(","));
    });
  }
  
  return lines.join("\n");
}

function convertCustomersToCSV(data: any): string {
  const lines: string[] = [];
  
  lines.push("Customer Analytics Report");
  lines.push(`Generated: ${new Date().toLocaleString("fa-IR")}`);
  lines.push("");
  
  lines.push("Summary");
  lines.push("Total Customers," + (data.totals?.totalCustomers || 0));
  lines.push("New Customers," + (data.totals?.newCustomers || 0));
  lines.push("Average Order Value," + (data.totals?.avgOrderValue || 0));
  lines.push("");
  
  lines.push("Customers");
  lines.push("Name,Phone,Email,Total Orders,Total Spent,Orders in Period,Spent in Period,Last Order,Points");
  if (data.customers) {
    data.customers.forEach((customer: any) => {
      lines.push([
        customer.name || "",
        customer.phone || "",
        customer.email || "",
        customer.totalOrders || 0,
        customer.totalSpent || 0,
        customer.ordersInPeriod || 0,
        customer.spentInPeriod || 0,
        customer.lastOrderDate ? new Date(customer.lastOrderDate * 1000).toISOString().split("T")[0] : "",
        customer.loyalty_points_balance || 0,
      ].join(","));
    });
  }
  
  return lines.join("\n");
}


