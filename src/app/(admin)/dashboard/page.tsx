"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useMenu } from "@/context/MenuContext";
import { useContext } from "react";
import { ThemeContext } from "@/app/providers";
import {
  Trash2,
  Plus,
  LayoutDashboard,
  Coffee,
  Users,
  Clock,
  History,
  Building2,
  CheckSquare,
  Square,
  Settings,
  Image,
  DollarSign,
  Star,
  MessageSquareText,
  Images,
  FileText
} from "lucide-react";
import DashboardStats from "@/components/dashboard/DashboardStats";
import ManualOrderForm from "@/components/ManualOrderForm";
import OrdersTable from "@/components/OrdersTable";
import { RawMaterialModal } from "@/components/RawMaterialModal";
import { IngredientModal } from "@/components/IngredientModal";
import { InventoryLogsModal } from "@/components/InventoryLogsModal";
import OrderDetailModal from "@/components/OrderDetailModal";
import StockAdjustmentModal from "@/components/StockAdjustmentModal";
import { formatToman, toPersianDigits } from "@/utils/format";
import { getStats } from "@/services/dbService";
import { formatPersianNumber } from "@/utils/dateFormatter";
import { jalaliToTimestamp } from "@/utils/jalaliDateUtils";
import {
  filterOrders,
  sortOrders,
  getPaginationInfo
} from "@/utils/pagination";
import OrderFilters, {
  OrderFilterState
} from "@/components/orders/OrderFilters";
import OrderBulkActions from "@/components/orders/OrderBulkActions";
import InventoryOverview from "@/components/inventory/InventoryOverview";
import LowStockAlerts from "@/components/inventory/LowStockAlerts";
import RestockRecommendations from "@/components/inventory/RestockRecommendations";
import SuppliersList from "@/components/inventory/SuppliersList";
import { useInventory } from "@/hooks/useInventory";
import MenuItemForm from "@/components/menu/MenuItemForm";
import MenuTable from "@/components/menu/MenuTable";
import { useMenuItems } from "@/hooks/useMenuItems";
import CustomerOrders from "@/components/customers/CustomerOrders";
import BranchesManagement from "@/components/branches/BranchesManagement";
import CustomersManagement from "@/components/customers/CustomersManagement";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SiteSettings from "@/components/settings/SiteSettings";
import BannerManager from "@/components/banners/BannerManager";
import WorkingHoursManager from "@/components/working-hours/WorkingHoursManager";
import ExpenseManager from "@/components/expenses/ExpenseManager";
import RatingsApproval from "@/components/ratings/RatingsApproval";
import CustomerMessagesManager from "@/components/admin/CustomerMessagesManager";
import StaffManagement from "@/components/staff/StaffManagement";
import GalleryManager from "@/components/gallery/GalleryManager";
import StoryManager from "@/components/stories/StoryManager";
import ExperienceCommentsManager from "@/components/experience/ExperienceCommentsManager";
import LoyaltyProgramManager from "@/components/loyalty/LoyaltyProgramManager";
import LoyaltyPointsManager from "@/components/loyalty/LoyaltyPointsManager";
import ReportsManager from "@/components/reports/ReportsManager";
import WasteManager from "@/components/waste/WasteManager";
import DashboardSidebar, {
  DashboardPage
} from "@/components/dashboard/DashboardSidebar";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const {
    items,
    orders,
    addItem,
    updateItem,
    deleteItem,
    updateOrderStatus,
    isAuthenticated,
    userRole,
    logout,
    isLoading
  } = useMenu();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isDark, toggleTheme } = useContext(ThemeContext);

  // Get active page from URL search params, default to "dashboard"
  // Use pathname + search params to ensure component updates on navigation
  const pageParam = searchParams?.get("page") || "dashboard";
  const [activePage, setActivePage] = useState<DashboardPage>(
    (pageParam as DashboardPage) || "dashboard"
  );

  // Sync activePage with URL params when they change
  useEffect(() => {
    const newPageParam = searchParams?.get("page") || "dashboard";
    const newActivePage = (newPageParam as DashboardPage) || "dashboard";
    setActivePage(newActivePage);
  }, [pageParam, pathname, searchParams]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [accessibleTabs, setAccessibleTabs] = useState<string[]>([]);
  const [userType, setUserType] = useState<"admin" | "staff" | null>(null);
  const [stats, setStats] = useState({
    visits: 0,
    menuViews: 0,
    totalSales: 0,
    ordersCount: 0,
    averageOrderValue: 0,
    dailyData: [] as Array<{
      date: string;
      orders: number;
      sales: number;
      visits?: number;
    }>,
    categoryBreakdown: [] as Array<{
      name: string;
      value: number;
      sales?: number;
      itemCount?: number;
    }>,
    comparisonData: {
      todayVsYesterday: {
        orders: 0,
        sales: 0,
        ordersChange: 0,
        salesChange: 0
      },
      thisWeekVsLastWeek: {
        orders: 0,
        sales: 0,
        ordersChange: 0,
        salesChange: 0
      }
    },
    topSellingItems: [] as Array<{
      id: string;
      name: string;
      quantity: number;
      revenue: number;
    }>
  });
  // Pagination & Filter State
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [showManualOrderForm, setShowManualOrderForm] = useState(false);
  const [orderFilter, setOrderFilter] = useState<OrderFilterState>({
    source: "all",
    status: "all",
    dateFrom: "",
    dateTo: "",
    search: "",
    minAmount: "",
    maxAmount: ""
  });
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any | null>(
    null
  );

  // Customer Orders State
  // Customer Orders state is now handled by CustomerOrders component

  // Inventory State
  const [products, setProducts] = useState<any[]>([]);
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState<
    "all" | "raw_material" | "packed_product"
  >("all");
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedProductLogs, setSelectedProductLogs] = useState<any[]>([]);
  const [showLogsModal, setShowLogsModal] = useState(false);

  // Inventory Enhancement State
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);

  // Use inventory hook (only when inventory tab is active and user is super_admin)
  // Note: Hook will be called but will only fetch when tab is active
  const inventoryData = useInventory();
  const { lowStockAlerts, inventoryValue, restockRecommendations, suppliers } =
    activePage === "inventory" && userRole === "super_admin"
      ? inventoryData
      : {
          lowStockAlerts: [],
          inventoryValue: null,
          restockRecommendations: [],
          suppliers: []
        };
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [adjustmentProduct, setAdjustmentProduct] = useState<any | null>(null);

  // Date range filter for stats
  const [dateRange, setDateRange] = useState({
    from: "",
    to: ""
  });

  // Branch selection state
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  // Menu Management
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [ingredientModalItemId, setIngredientModalItemId] =
    useState<string>("");

  const menuItems = useMenuItems({
    items,
    addItem,
    updateItem,
    deleteItem
  });

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;
    console.log(isAuthenticated);
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      // Fetch stats when authenticated
      const fetchStats = async () => {
        // Convert Jalali dates to timestamps for the API
        let startDate: number | undefined = undefined;
        let endDate: number | undefined = undefined;

        if (dateRange.from) {
          startDate = jalaliToTimestamp(dateRange.from);
        }
        if (dateRange.to) {
          // Set end time to end of day
          endDate = jalaliToTimestamp(dateRange.to);
          endDate = endDate + 24 * 60 * 60 - 1;
        }

        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate.toString());
        if (endDate) params.append("endDate", endDate.toString());

        // Fetch enhanced analytics
        const analyticsUrl = params.toString()
          ? `/api/analytics?${params.toString()}`
          : "/api/analytics";

        try {
          const analyticsResponse = await fetch(analyticsUrl);
          const analyticsData = await analyticsResponse.json();

          setStats({
            visits: analyticsData.visits || 0,
            menuViews: analyticsData.menuViews || 0,
            totalSales: analyticsData.totalSales || 0,
            ordersCount: analyticsData.ordersCount || 0,
            averageOrderValue: analyticsData.averageOrderValue || 0,
            dailyData: analyticsData.dailyData || [],
            categoryBreakdown: analyticsData.categoryBreakdown || [],
            comparisonData: analyticsData.comparisonData || {
              todayVsYesterday: {
                orders: 0,
                sales: 0,
                ordersChange: 0,
                salesChange: 0
              },
              thisWeekVsLastWeek: {
                orders: 0,
                sales: 0,
                ordersChange: 0,
                salesChange: 0
              }
            },
            topSellingItems: analyticsData.topSellingItems || []
          });
        } catch (error) {
          console.error("Error fetching analytics:", error);
          // Fallback to basic stats
          const statsUrl = params.toString()
            ? `/api/stats?${params.toString()}`
            : "/api/stats";
          const response = await fetch(statsUrl);
          const data = await response.json();
          setStats({
            visits: data.visits || 0,
            menuViews: data.menuViews || 0,
            totalSales: data.totalSales || 0,
            ordersCount: data.orders || 0,
            averageOrderValue: 0,
            dailyData: data.dailyData || [],
            categoryBreakdown: data.categoryBreakdown || [],
            comparisonData: {
              todayVsYesterday: {
                orders: 0,
                sales: 0,
                ordersChange: 0,
                salesChange: 0
              },
              thisWeekVsLastWeek: {
                orders: 0,
                sales: 0,
                ordersChange: 0,
                salesChange: 0
              }
            },
            topSellingItems: []
          });
        }
      };

      fetchStats();

      // Auto-refresh stats every 10 seconds when on dashboard tab (reduced from 30s)
      if (activePage === "dashboard") {
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
      }
    }
  }, [isLoading, isAuthenticated, router, activePage, dateRange]);

  // Customer orders data is now handled by CustomerOrders component

  // Refs to prevent multiple simultaneous fetches and track last fetch
  const fetchingProductsRef = useRef(false);
  const lastFetchedFilterRef = useRef<string>("");

  // Fetch products when inventory tab is active
  useEffect(() => {
    // Only fetch if inventory tab is active and user is super admin
    if (activePage !== "inventory" || userRole !== "super_admin") {
      return;
    }

    // Create a unique key for this fetch (tab + filter)
    const fetchKey = `${activePage}-${inventoryTypeFilter}`;

    // Skip if we're already fetching or if we just fetched this exact combination
    if (
      fetchingProductsRef.current ||
      lastFetchedFilterRef.current === fetchKey
    ) {
      return;
    }

    fetchingProductsRef.current = true;
    lastFetchedFilterRef.current = fetchKey;
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        const url =
          inventoryTypeFilter === "all"
            ? "/api/products"
            : `/api/products?type=${inventoryTypeFilter}`;
        const res = await fetch(url);
        if (res.ok && isMounted) {
          const data = await res.json();
          // API returns array directly, not wrapped in { data: [...] }
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        // Reset the last fetched ref on error so we can retry
        if (lastFetchedFilterRef.current === fetchKey) {
          lastFetchedFilterRef.current = "";
        }
      } finally {
        fetchingProductsRef.current = false;
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
      // Don't reset fetchingProductsRef here - let it complete naturally
    };
  }, [activePage, userRole, inventoryTypeFilter]);

  // Inventory data is now handled by useInventory hook

  const handleAddProduct = async (product: any) => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || ""
        },
        body: JSON.stringify(product)
      });

      if (res.ok) {
        setShowNewProductForm(false);
        alert("محصول با موفقیت اضافه شد");
        // Don't refresh here - let the modal's onSave handle it
      } else {
        const error = await res.json().catch(() => ({}));
        alert(`خطا در اضافه کردن محصول: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error adding product:", error);
      alert("خطا در اضافه کردن محصول");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("آیا مطمئن هستید؟")) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: {
          "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || ""
        }
      });

      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
        setSelectedProduct(null);
        alert("محصول حذف شد");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("خطا در حذف محصول");
    }
  };

  const handleSaveProduct = async (updatedProduct: any) => {
    try {
      const res = await fetch(`/api/products/${updatedProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || ""
        },
        body: JSON.stringify(updatedProduct)
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedProduct(updated);
        // Refresh products list after a short delay (only if not already fetching)
        setTimeout(() => {
          if (
            activePage === "inventory" &&
            userRole === "super_admin" &&
            !fetchingProductsRef.current
          ) {
            fetchingProductsRef.current = true;
            const url =
              inventoryTypeFilter === "all"
                ? "/api/products"
                : `/api/products?type=${inventoryTypeFilter}`;
            fetch(url)
              .then(res => res.json())
              .then(data => {
                setProducts(Array.isArray(data) ? data : []);
                fetchingProductsRef.current = false;
              })
              .catch(err => {
                console.error("Failed to refresh products:", err);
                fetchingProductsRef.current = false;
              });
          }
        }, 200);
        return;
      } else {
        alert("خطا در ذخیره‌سازی");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      alert("خطا در ذخیره‌سازی");
    }
  };

  const handleViewLogs = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}/logs`);
      if (res.ok) {
        const logs = await res.json();
        setSelectedProductLogs(logs);
        setShowLogsModal(true);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      alert("خطا در دریافت لاگ‌ها");
    }
  };

  const handleStockAdjustment = async (
    productId: string,
    newStock: number,
    note: string
  ) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || ""
        },
        body: JSON.stringify({
          currentStock: newStock
        })
      });

      if (res.ok) {
        alert("موجودی با موفقیت بروزرسانی شد");
        // Refresh products
        const url =
          inventoryTypeFilter === "all"
            ? "/api/products"
            : `/api/products?type=${inventoryTypeFilter}`;
        const productsRes = await fetch(url);
        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(Array.isArray(data) ? data : []);
        }
        // Refresh inventory data
        if (activePage === "inventory" && userRole === "super_admin") {
          inventoryData.refresh();
        }
      } else {
        alert("خطا در بروزرسانی موجودی");
      }
    } catch (error) {
      console.error("Error adjusting stock:", error);
      alert("خطا در بروزرسانی موجودی");
    }
  };

  const handleOrderStatusChange = async (
    orderId: string,
    newStatus: "pending" | "completed" | "cancelled"
  ) => {
    try {
      // Update order status
      await updateOrderStatus(orderId, newStatus);

      // If order is completed, record it in stats
      if (newStatus === "completed") {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          // Record the order event in stats
          try {
            await fetch("/api/stats", {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || ""
              },
              body: JSON.stringify({
                action: "order",
                data: {
                  orderId,
                  amount: order.totalAmount || order.totalPrice || 0,
                  source: order.source
                }
              })
            });
          } catch (error) {
            console.warn("Failed to record order stats:", error);
          }
        }
      }

      // Refresh stats
      const updatedStats = await getStats();
      setStats(updatedStats as any);
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("خطا در بروزرسانی وضعیت سفارش");
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout API to clear session on server
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      // Clear sessionStorage (session-based auth)
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("vaje_auth");
      }
      // Clear client-side auth
      logout();
      router.push("/login");
    }
  };

  // Menu handlers are now in useMenuItems hook

  // Define role-based accessible tabs (business logic)
  const getRoleBasedTabs = (): string[] => {
    // Get role from context or fallback to sessionStorage
    let effectiveRole = userRole;
    if (!effectiveRole && typeof window !== "undefined") {
      const roleFromStorage = sessionStorage.getItem("vaje_role");
      if (roleFromStorage === "admin" || roleFromStorage === "super_admin") {
        effectiveRole = roleFromStorage as "admin" | "super_admin";
      }
    }

    if (effectiveRole === "super_admin") {
      // Super Admin: Full access to everything
      return [
        "dashboard",
        "menu",
        "orders",
        "inventory",
        "customer-orders",
        "branches",
        "customers",
        "settings",
        "banners",
        "working-hours",
        "expenses",
        "ratings",
        "customer-messages",
        "staff",
        "stats",
        "reports",
        "waste",
        "gallery",
        "stories",
        "experience-comments",
        "loyalty"
      ];
    }

    if (effectiveRole === "admin") {
      // Admin: Management tabs (no inventory, branches, staff management)
      return [
        "dashboard",
        "menu",
        "orders",
        "customer-orders",
        "expenses",
        "ratings",
        "customer-messages",
        "reports",
        "waste",
        "gallery",
        "stories",
        "experience-comments",
        "loyalty"
      ];
    }

    if (userType === "staff") {
      // Staff tabs are fetched from database (can be customized per staff member)
      return accessibleTabs;
    }

    // Default fallback: if authenticated but role not loaded yet, show basic tabs
    if (isAuthenticated) {
      return ["dashboard", "menu", "orders"];
    }

    return [];
  };

  // Fetch staff accessible tabs and set default tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userTypeValue = sessionStorage.getItem("vaje_userType");
      setUserType(userTypeValue as "admin" | "staff" | null);

      if (userTypeValue === "staff") {
        const staffData = sessionStorage.getItem("staff_data");
        if (staffData) {
          const parsed = JSON.parse(staffData);

          // Role-based default tabs (business logic)
          const roleDefaults: { [key: string]: string[] } = {
            waiter: ["orders"],
            barista: ["orders"],
            manager: ["dashboard", "orders", "stats"]
          };

          // Fetch accessible tabs from database
          fetch(`/api/staff/${parsed.id}/tabs`, {
            credentials: "include"
          })
            .then(res => res.json())
            .then(data => {
              if (
                data.permissions &&
                Array.isArray(data.permissions) &&
                data.permissions.length > 0
              ) {
                setAccessibleTabs(data.permissions);
              } else {
                // Use role-based defaults
                setAccessibleTabs(roleDefaults[parsed.role] || ["orders"]);
              }
              // Set default active tab for staff
              const defaultTab = roleDefaults[parsed.role]?.[0] || "orders";
              if (defaultTab === "dashboard") {
                router.push("/dashboard");
              } else {
                router.push(`/dashboard?page=${defaultTab}`);
              }
            })
            .catch(() => {
              // Fallback to role-based defaults on error
              setAccessibleTabs(roleDefaults[parsed.role] || ["orders"]);
              const defaultTab = roleDefaults[parsed.role]?.[0] || "orders";
              if (defaultTab === "dashboard") {
                router.push("/dashboard");
              } else {
                router.push(`/dashboard?page=${defaultTab}`);
              }
            });
        }
      }
    }
  }, []);

  // Check if a tab is accessible based on role
  const isTabAccessible = (tab: string): boolean => {
    const roleTabs = getRoleBasedTabs();
    // console.log( tab);
    return roleTabs.includes(tab);
  };

  if (!isAuthenticated) return null;

  const pendingOrdersCount = orders.filter(o => o.status === "pending").length;

  // Render page content based on activePage
  const renderPageContent = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DashboardStats
              stats={stats}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              isDark={isDark}
            />
          </div>
        );

      case "orders":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-xl text-white font-bold">مدیریت سفارشات</h2>
              <button
                onClick={() => setShowManualOrderForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
              >
                <Plus size={18} />
                سفارش دستی
              </button>
            </div>

            {/* Order Filters */}
            <OrderFilters
              value={orderFilter}
              onChange={setOrderFilter}
              onReset={() => {
                setOrderFilter({
                  source: "all",
                  status: "all",
                  dateFrom: "",
                  dateTo: "",
                  search: "",
                  minAmount: "",
                  maxAmount: ""
                });
                setSelectedOrders(new Set());
              }}
              isDark={isDark}
            />

            {/* Bulk Actions */}
            <OrderBulkActions
              selectedCount={selectedOrders.size}
              isDark={isDark}
              onCompleteSelected={async () => {
                if (
                  confirm(
                    `آیا می‌خواهید ${selectedOrders.size} سفارش را تکمیل کنید؟`
                  )
                ) {
                  for (const orderId of selectedOrders) {
                    await handleOrderStatusChange(orderId, "completed");
                  }
                  setSelectedOrders(new Set());
                }
              }}
              onCancelSelected={async () => {
                if (
                  confirm(
                    `آیا می‌خواهید ${selectedOrders.size} سفارش را لغو کنید؟`
                  )
                ) {
                  for (const orderId of selectedOrders) {
                    await handleOrderStatusChange(orderId, "cancelled");
                  }
                  setSelectedOrders(new Set());
                }
              }}
              onClearSelection={() => setSelectedOrders(new Set())}
            />

            {/* Orders Table */}
            {(() => {
              // Filter orders
              let filtered = filterOrders(orders as any, {
                source:
                  orderFilter.source === "all" ? undefined : orderFilter.source,
                status:
                  orderFilter.status === "all" ? undefined : orderFilter.status,
                search: orderFilter.search || undefined
              });

              // Apply date filters using Jalali dates
              if (orderFilter.dateFrom) {
                const startDate = jalaliToTimestamp(orderFilter.dateFrom);
                filtered = filtered.filter(order => {
                  let orderTimestamp = 0;
                  if (order.createdAt) {
                    if (typeof order.createdAt === "string") {
                      orderTimestamp = Math.floor(
                        new Date(order.createdAt).getTime() / 1000
                      );
                    } else {
                      orderTimestamp = order.createdAt;
                    }
                  }
                  return orderTimestamp >= startDate;
                });
              }
              if (orderFilter.dateTo) {
                let endDate = jalaliToTimestamp(orderFilter.dateTo);
                // Set end time to end of day
                endDate = endDate + 24 * 60 * 60 - 1;
                filtered = filtered.filter(order => {
                  let orderTimestamp = 0;
                  if (order.createdAt) {
                    if (typeof order.createdAt === "string") {
                      orderTimestamp = Math.floor(
                        new Date(order.createdAt).getTime() / 1000
                      );
                    } else {
                      orderTimestamp = order.createdAt;
                    }
                  }
                  return orderTimestamp <= endDate;
                });
              }

              // Apply amount filters
              if (orderFilter.minAmount) {
                const minAmount = parseFloat(orderFilter.minAmount);
                filtered = filtered.filter(order => {
                  const total = order.totalAmount || order.totalPrice || 0;
                  return total >= minAmount;
                });
              }
              if (orderFilter.maxAmount) {
                const maxAmount = parseFloat(orderFilter.maxAmount);
                filtered = filtered.filter(order => {
                  const total = order.totalAmount || order.totalPrice || 0;
                  return total <= maxAmount;
                });
              }

              // Sort by date descending
              filtered = sortOrders(filtered, "date", "desc");

              const allFilteredSelected =
                filtered.length > 0 &&
                filtered.every(order => selectedOrders.has(order.id));
              const someFilteredSelected = filtered.some(order =>
                selectedOrders.has(order.id)
              );

              return (
                <div className="space-y-6">
                  {/* Select All Checkbox */}
                  {filtered.length > 0 && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-neutral-800/50">
                      <button
                        onClick={() => {
                          if (allFilteredSelected) {
                            // Deselect all filtered
                            const newSelected = new Set(selectedOrders);
                            filtered.forEach(order =>
                              newSelected.delete(order.id)
                            );
                            setSelectedOrders(newSelected);
                          } else {
                            // Select all filtered
                            const newSelected = new Set(selectedOrders);
                            filtered.forEach(order =>
                              newSelected.add(order.id)
                            );
                            setSelectedOrders(newSelected);
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        {allFilteredSelected ? (
                          <CheckSquare size={20} className="text-coffee-500" />
                        ) : (
                          <Square size={20} className="text-gray-400" />
                        )}
                        <span
                          className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
                        >
                          {allFilteredSelected
                            ? "لغو انتخاب همه"
                            : "انتخاب همه"}
                        </span>
                      </button>
                      {someFilteredSelected && (
                        <span
                          className={`text-xs ${isDark ? "text-gray-500" : "text-gray-600"}`}
                        >
                          ({toPersianDigits(selectedOrders.size.toString())}{" "}
                          انتخاب شده)
                        </span>
                      )}
                    </div>
                  )}

                  <OrdersTable
                    orders={filtered as any}
                    currentPage={ordersPage}
                    itemsPerPage={ordersPerPage}
                    onStatusChange={handleOrderStatusChange}
                    selectedOrders={selectedOrders}
                    onToggleSelect={orderId => {
                      const newSelected = new Set(selectedOrders);
                      if (newSelected.has(orderId)) {
                        newSelected.delete(orderId);
                      } else {
                        newSelected.add(orderId);
                      }
                      setSelectedOrders(newSelected);
                    }}
                    onViewDetail={order => {
                      setSelectedOrderDetail(order);
                      setShowOrderDetail(true);
                    }}
                    isDark={isDark}
                  />

                  {/* Pagination Controls */}
                  {(() => {
                    const info = getPaginationInfo(
                      filtered.length,
                      ordersPage,
                      ordersPerPage
                    );

                    if (info.pages <= 1) return null;

                    return (
                      <div className="flex justify-center items-center gap-3 p-4">
                        <button
                          onClick={() =>
                            setOrdersPage(Math.max(1, ordersPage - 1))
                          }
                          disabled={!info.hasPrevPage}
                          className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                        >
                          قبلی
                        </button>
                        <span className="text-white text-sm font-medium px-4">
                          صفحه {formatPersianNumber(info.page)} از{" "}
                          {formatPersianNumber(info.pages)}
                        </span>
                        <button
                          onClick={() =>
                            setOrdersPage(Math.min(info.pages, ordersPage + 1))
                          }
                          disabled={!info.hasNextPage}
                          className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                        >
                          بعدی
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}
          </div>
        );

      case "menu":
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Form Section */}
              <div className="lg:col-span-1">
                <MenuItemForm
                  editingItem={menuItems.editingItem}
                  onSubmit={menuItems.handleSubmit}
                  onCancel={menuItems.handleCancel}
                  onManageIngredients={() => {
                    if (menuItems.editingItem) {
                      setIngredientModalItemId(menuItems.editingItem.id);
                      setShowIngredientModal(true);
                    }
                  }}
                  isDark={isDark}
                  isSubmitting={menuItems.isSubmitting}
                />
              </div>

              {/* List Section */}
              <div className="lg:col-span-2">
                <MenuTable
                  items={items}
                  onEdit={menuItems.handleEdit}
                  onDelete={menuItems.handleDelete}
                  onManageIngredients={itemId => {
                    setIngredientModalItemId(itemId);
                    setShowIngredientModal(true);
                  }}
                  onTogglePin={async (itemId: string, isPinned: boolean) => {
                    try {
                      await updateItem(itemId, { is_pinned: isPinned } as any);
                    } catch (err) {
                      console.error("Failed to toggle pin:", err);
                      alert("خطا در تغییر وضعیت ثابت کردن");
                    }
                  }}
                  onToggleSuggest={async (
                    itemId: string,
                    isSuggested: boolean
                  ) => {
                    try {
                      await updateItem(itemId, {
                        is_suggested: isSuggested
                      } as any);
                    } catch (err) {
                      console.error("Failed to toggle suggest:", err);
                      alert("خطا در تغییر وضعیت پیشنهاد");
                    }
                  }}
                  onReorder={async (
                    itemOrders: Array<{ id: string; display_order: number }>
                  ) => {
                    try {
                      const adminToken =
                        process.env.NEXT_PUBLIC_ADMIN_TOKEN || "";
                      const response = await fetch("/api/menu/reorder", {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                          ...(adminToken
                            ? { "x-access-token": adminToken }
                            : {})
                        },
                        credentials: "include",
                        body: JSON.stringify({ itemOrders })
                      });
                      if (response.ok) {
                        // MenuContext will automatically refresh via subscribeToMenu
                        alert("ترتیب آیتم‌ها با موفقیت تغییر کرد");
                      } else {
                        throw new Error("Failed to reorder");
                      }
                    } catch (err) {
                      console.error("Failed to reorder items:", err);
                      alert("خطا در تغییر ترتیب آیتم‌ها");
                    }
                  }}
                  isDark={isDark}
                />
              </div>
            </div>
          </div>
        );

      case "inventory":
        if (!isTabAccessible("inventory")) return null;
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Inventory Overview Cards */}
            <InventoryOverview
              lowStockCount={lowStockAlerts.length}
              inventoryValue={inventoryValue}
              suppliersCount={suppliers.length}
              isDark={isDark}
            />

            {/* Low Stock Alerts List */}
            <LowStockAlerts alerts={lowStockAlerts} isDark={isDark} />

            {/* Restock Recommendations */}
            <RestockRecommendations
              recommendations={restockRecommendations}
              isDark={isDark}
            />

            {/* Suppliers Management */}
            <SuppliersList
              suppliers={suppliers}
              selectedSupplier={selectedSupplier}
              onSelectSupplier={setSelectedSupplier}
              isDark={isDark}
            />

            <div className="flex justify-between items-center flex-wrap gap-4">
              <h2
                className={`text-xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                مدیریت موجودی
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setInventoryTypeFilter("all")}
                  className={`px-4 py-2 rounded-lg font-bold transition ${
                    inventoryTypeFilter === "all"
                      ? "bg-coffee-600 text-white"
                      : isDark
                        ? "bg-neutral-800 text-gray-400 hover:text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  همه
                </button>
                <button
                  onClick={() => setInventoryTypeFilter("raw_material")}
                  className={`px-4 py-2 rounded-lg font-bold transition ${
                    inventoryTypeFilter === "raw_material"
                      ? "bg-coffee-600 text-white"
                      : isDark
                        ? "bg-neutral-800 text-gray-400 hover:text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  مواد اولیه
                </button>
                <button
                  onClick={() => setInventoryTypeFilter("packed_product")}
                  className={`px-4 py-2 rounded-lg font-bold transition ${
                    inventoryTypeFilter === "packed_product"
                      ? "bg-coffee-600 text-white"
                      : isDark
                        ? "bg-neutral-800 text-gray-400 hover:text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  محصولات بسته‌بندی
                </button>
                <button
                  onClick={() => setShowNewProductForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                >
                  <Plus size={18} />
                  افزودن محصول
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div
              className={`overflow-x-auto rounded-2xl border ${
                isDark
                  ? "bg-neutral-900 border-white/5"
                  : "bg-white border-gray-300"
              }`}
            >
              <table className="w-full">
                <thead>
                  <tr
                    className={`border-b ${
                      isDark ? "border-white/5" : "border-gray-300"
                    }`}
                  >
                    <th
                      className={`text-right px-6 py-4 font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      نوع
                    </th>
                    <th
                      className={`text-right px-6 py-4 font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      نام
                    </th>
                    <th
                      className={`text-right px-6 py-4 font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      دسته
                    </th>
                    <th
                      className={`text-right px-6 py-4 font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      واحد
                    </th>
                    <th
                      className={`text-right px-6 py-4 font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      موجودی
                    </th>
                    <th
                      className={`text-right px-6 py-4 font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      حداقل
                    </th>
                    <th
                      className={`text-right px-6 py-4 font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      قیمت
                    </th>
                    <th
                      className={`text-right px-6 py-4 font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      تامین‌کننده
                    </th>
                    <th
                      className={`text-right px-6 py-4 font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className={`px-6 py-12 text-center ${
                          isDark ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        محصولی وجود ندارد
                      </td>
                    </tr>
                  ) : (
                    products.map(product => (
                      <tr
                        key={product.id}
                        onClick={() => setSelectedProduct(product)}
                        className={`border-b cursor-pointer transition ${
                          isDark
                            ? "border-white/5 hover:bg-white/5"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <td
                          className={`px-6 py-4 text-sm ${
                            product.type === "raw_material"
                              ? "text-blue-400"
                              : "text-purple-400"
                          }`}
                        >
                          {product.type === "raw_material"
                            ? "مواد اولیه"
                            : "بسته‌بندی"}
                        </td>
                        <td
                          className={`px-6 py-4 font-semibold ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {product.name}
                        </td>
                        <td
                          className={`px-6 py-4 text-sm ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {product.category}
                        </td>
                        <td
                          className={`px-6 py-4 text-sm ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {product.unit}
                        </td>
                        <td
                          className={`px-6 py-4 font-semibold ${
                            product.currentStock < product.minStock
                              ? "text-red-400"
                              : "text-green-400"
                          }`}
                        >
                          {toPersianDigits(product.currentStock.toString())}
                        </td>
                        <td
                          className={`px-6 py-4 text-sm ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {toPersianDigits(product.minStock.toString())}
                        </td>
                        <td
                          className={`px-6 py-4 font-semibold ${
                            isDark ? "text-amber-400" : "text-amber-600"
                          }`}
                        >
                          {formatToman(product.price)}
                        </td>
                        <td
                          className={`px-6 py-4 text-sm ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {product.supplier || "-"}
                        </td>
                        <td
                          className="px-6 py-4"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewLogs(product.id)}
                              className="p-1 hover:bg-blue-500/20 rounded transition"
                              title="تاریخچه"
                            >
                              <History size={18} className="text-blue-500" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1 hover:bg-red-500/20 rounded transition"
                              title="حذف"
                            >
                              <Trash2 size={18} className="text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "branches":
        if (!isTabAccessible("branches")) return null;
        return <BranchesManagement isDark={isDark} />;

      case "customers":
        if (!isTabAccessible("customers")) return null;
        return <CustomersManagement isDark={isDark} />;

      case "settings":
        if (!isTabAccessible("settings")) return null;
        return <SiteSettings isDark={isDark} />;

      case "banners":
        if (!isTabAccessible("banners")) return null;
        return <BannerManager isDark={isDark} />;

      case "working-hours":
        if (!isTabAccessible("working-hours")) return null;
        return <WorkingHoursManager isDark={isDark} />;

      case "stats":
        if (!isTabAccessible("stats")) return null;
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DashboardStats
              stats={stats}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              isDark={isDark}
            />
          </div>
        );

      case "customer-orders":
        if (!isTabAccessible("customer-orders")) return null;
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CustomerOrders orders={orders} isDark={isDark} />
          </div>
        );

      case "expenses":
        if (!isTabAccessible("expenses")) return null;
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ExpenseManager isDark={isDark} />
          </div>
        );

      case "ratings":
        if (!isTabAccessible("ratings")) return null;
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <RatingsApproval isDark={isDark} />
          </div>
        );

      case "customer-messages":
        if (!isTabAccessible("customer-messages")) return null;
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CustomerMessagesManager isDark={isDark} />
          </div>
        );

      case "loyalty":
        if (!isTabAccessible("loyalty")) return null;
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <LoyaltyProgramManager isDark={isDark} />
          </div>
        );

      case "staff":
        if (!isTabAccessible("staff")) return null;
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StaffManagement isDark={isDark} />
          </div>
        );

      case "gallery":
        if (!isTabAccessible("gallery")) return null;
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GalleryManager isDark={isDark} />
          </div>
        );

      case "stories":
        if (!isTabAccessible("stories")) return null;
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StoryManager isDark={isDark} />
          </div>
        );

      case "experience-comments":
        if (!isTabAccessible("experience-comments")) return null;
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ExperienceCommentsManager isDark={isDark} />
          </div>
        );

      case "reports":
        if (!isTabAccessible("reports")) return null;
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ReportsManager isDark={isDark} />
          </div>
        );

      case "waste":
        if (!isTabAccessible("waste")) return null;
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <WasteManager isDark={isDark} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={cn("flex h-screen overflow-hidden", isDark ? "bg-[#0d0f13]" : "bg-gray-50")}
      dir="rtl"
    >
      {/* Sidebar — fixed overlay on mobile, inline on desktop */}
      <DashboardSidebar
        isDark={isDark}
        userRole={userRole}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={sidebarMobileOpen}
        onMobileOpen={() => setSidebarMobileOpen(true)}
        onMobileClose={() => setSidebarMobileOpen(false)}
        pendingOrdersCount={pendingOrdersCount}
      />

      {/* Main Content — full width on mobile since sidebar is an overlay */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 w-full">
        {/* Header */}
        <div
          className={cn(
            "h-16 flex items-center border-b shrink-0",
            isDark
              ? "bg-[#111318] border-white/5"
              : "bg-white border-gray-100"
          )}
        >
          <div className="flex-1 px-5">
            <DashboardHeader
              isDark={isDark}
              onLogout={handleLogout}
              onToggleTheme={toggleTheme}
            />
          </div>
        </div>

        {/* Page Content */}
        <div
          className={cn(
            "flex-1 overflow-y-auto",
            isDark ? "bg-[#0d0f13]" : "bg-gray-50"
          )}
        >
          <div className="max-w-7xl mx-auto px-5 py-6">
            {renderPageContent()}
          </div>
        </div>
      </div>

      {/* Manual Order Form Modal */}
      {showManualOrderForm && (
        <ManualOrderForm
          items={items}
          isDark={isDark}
          onSubmit={async orderData => {
            try {
              const response = await fetch("/api/orders", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || ""
                },
                body: JSON.stringify(orderData)
              });

              if (response.ok) {
                await response.json();
                alert("سفارش دستی با موفقیت ثبت شد");
                setShowManualOrderForm(false);

                // Switch to customer-orders page to show the new order immediately
                router.push("/dashboard?page=customer-orders");

                // Optional: Force a refresh of orders from API
                try {
                  await new Promise(resolve => setTimeout(resolve, 300));
                  // The context's subscription will handle the update automatically
                  // but we can also manually fetch to ensure immediate visibility
                  const ordersRes = await fetch("/api/orders");
                  if (ordersRes.ok) {
                    await ordersRes.json();
                    // Orders will be updated through context subscription
                  }
                } catch (fetchError) {
                  console.error("Error refreshing orders:", fetchError);
                  // Still show success - the subscription will catch the update
                }
              } else {
                const error = await response.json().catch(() => ({}));
                alert(`خطا در ثبت سفارش: ${error.error || "Unknown error"}`);
              }
            } catch (error) {
              console.error(error);
              alert("خطا در ثبت سفارش");
            }
          }}
          onClose={() => setShowManualOrderForm(false)}
        />
      )}

      {/* Product Modal - for both add and edit */}
      {(showNewProductForm || selectedProduct) && (
        <RawMaterialModal
          material={selectedProduct || undefined}
          isDark={isDark}
          onClose={() => {
            setShowNewProductForm(false);
            setSelectedProduct(null);
          }}
          onSave={async product => {
            if (selectedProduct) {
              // Edit mode
              await handleSaveProduct(product);
            } else {
              // Add mode - ensure type is set
              const productData = {
                ...product,
                type:
                  product.type ||
                  (inventoryTypeFilter === "packed_product"
                    ? "packed_product"
                    : "raw_material")
              };
              await handleAddProduct(productData);
            }
            setShowNewProductForm(false);
            setSelectedProduct(null);
          }}
          onDelete={selectedProduct ? handleDeleteProduct : undefined}
        />
      )}

      {/* Inventory Logs Modal */}
      {showLogsModal && selectedProduct && (
        <InventoryLogsModal
          isOpen={showLogsModal}
          onClose={() => {
            setShowLogsModal(false);
            setSelectedProductLogs([]);
          }}
          logs={selectedProductLogs}
          productName={selectedProduct.name}
          isDark={isDark}
        />
      )}

      {/* Ingredient Modal */}
      {showIngredientModal && ingredientModalItemId && (
        <IngredientModal
          isOpen={showIngredientModal}
          onClose={() => {
            setShowIngredientModal(false);
            setIngredientModalItemId("");
          }}
          menuItemId={ingredientModalItemId}
          onSave={() => {
            // Refresh menu items or show success
          }}
          isDark={isDark}
        />
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={showOrderDetail}
        order={selectedOrderDetail}
        onClose={() => {
          setShowOrderDetail(false);
          setSelectedOrderDetail(null);
        }}
        isDark={isDark}
        showTimeline={true}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={showStockAdjustment}
        product={adjustmentProduct}
        isDark={isDark}
        onClose={() => {
          setShowStockAdjustment(false);
          setAdjustmentProduct(null);
        }}
        onSave={handleStockAdjustment}
      />
    </div>
  );
}

// Branches Management is now a separate component
