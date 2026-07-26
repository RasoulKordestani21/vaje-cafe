"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useMenu } from "@/context/MenuContext";
import { useContext } from "react";
import { ThemeContext } from "@/app/providers";
import {
  Trash2,
  Plus,
  Edit2,
  // LayoutDashboard,
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
  FileText,
  PackagePlus
} from "lucide-react";
import DashboardStats from "@/components/dashboard/DashboardStats";
import ManualOrderForm from "@/components/ManualOrderForm";
import OrdersTable from "@/components/OrdersTable";
import { RawMaterialModal } from "@/components/RawMaterialModal";
import { IngredientModal } from "@/components/IngredientModal";
import { InventoryLogsModal } from "@/components/InventoryLogsModal";
import OrderDetailModal from "@/components/OrderDetailModal";
import InventoryTransactionModal from "@/components/inventory/InventoryTransactionModal";
import { formatToman, toPersianDigits } from "@/utils/format";
import { getStats, getAuthHeaders, adminFetchInit } from "@/services/dbService";
import { getPanelUserType, isAdminPanelRole } from "@/lib/adminSession";
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
import AdminPageBreadcrumb, { AdminPageTitle } from "@/components/dashboard/AdminPageBreadcrumb";
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
import PaginationControls from "@/components/ui/PaginationControls";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QuickAction } from "@/components/dashboard/DashboardHeader";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { adminShellBg, adminContentBg, adminHeaderBg } from "@/lib/adminTheme";

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
    logoutPanel,
    isLoading
  } = useMenu();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const { success, error: showError } = useToast();
  const confirm = useConfirm();

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
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState("مدیر سیستم");
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [userRoleKey, setUserRoleKey] = useState<string | null>(null);
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
  const [logsProductName, setLogsProductName] = useState("");
  const [logsProductUnit, setLogsProductUnit] = useState("");

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
        const url =
          inventoryTypeFilter === "all"
            ? "/api/products"
            : `/api/products?type=${inventoryTypeFilter}`;
        const listRes = await fetch(url);
        if (listRes.ok) {
          const data = await listRes.json();
          setProducts(Array.isArray(data) ? data : []);
        }
      } else {
        const error = await res.json().catch(() => ({}));
        showError(`خطا در اضافه کردن محصول: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error adding product:", error);
      showError("خطا در اضافه کردن محصول");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const ok = await confirm({
      title: "حذف محصول",
      message: "آیا مطمئن هستید که می‌خواهید این محصول را حذف کنید؟",
      confirmLabel: "حذف",
      variant: "destructive",
    });
    if (!ok) return;

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
        success("محصول حذف شد");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      showError("خطا در حذف محصول");
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
        success("محصول با موفقیت ذخیره شد");
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
        showError("خطا در ذخیره‌سازی");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      showError("خطا در ذخیره‌سازی");
    }
  };

  const handleViewLogs = async (
    productId: string,
    productName?: string,
    productUnit?: string
  ) => {
    try {
      const res = await fetch(
        `/api/products/${productId}/inventory`,
        adminFetchInit()
      );
      if (res.ok) {
        const logs = await res.json();
        const product = products.find(p => p.id === productId);
        setLogsProductName(productName || product?.name || "محصول");
        setLogsProductUnit(productUnit || product?.unit || "");
        setSelectedProductLogs(Array.isArray(logs) ? logs : []);
        setShowLogsModal(true);
      } else {
        showError("خطا در دریافت تاریخچه");
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      showError("خطا در دریافت تاریخچه");
    }
  };

  const refreshProductsList = async () => {
    const url =
      inventoryTypeFilter === "all"
        ? "/api/products"
        : `/api/products?type=${inventoryTypeFilter}`;
    const productsRes = await fetch(url, adminFetchInit());
    if (productsRes.ok) {
      const data = await productsRes.json();
      setProducts(Array.isArray(data) ? data : []);
    }
  };

  const handleInventoryTransaction = async (payload: {
    productId: string;
    operation: "buy" | "sell" | "update";
    quantity: number;
    unitPrice?: number;
    note?: string;
  }) => {
    try {
      const res = await fetch(`/api/products/${payload.productId}/inventory`, {
        method: "POST",
        ...adminFetchInit(),
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        success("عملیات موجودی با موفقیت ثبت شد");
        await refreshProductsList();
        if (activePage === "inventory" && userRole === "super_admin") {
          inventoryData.refresh();
        }
        if (selectedProduct?.id === payload.productId) {
          const updated = await fetch(
            `/api/products/${payload.productId}`,
            adminFetchInit()
          );
          if (updated.ok) {
            setSelectedProduct(await updated.json());
          }
        }
      } else {
        const err = await res.json().catch(() => ({}));
        showError(err.error || "خطا در ثبت عملیات موجودی");
      }
    } catch (error) {
      console.error("Error recording inventory transaction:", error);
      showError("خطا در ثبت عملیات موجودی");
    }
  };

  const openInventoryTransaction = (product: any) => {
    setAdjustmentProduct(product);
    setShowStockAdjustment(true);
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
      showError("خطا در بروزرسانی وضعیت سفارش");
    }
  };

  const handleLogout = async () => {
    setUserType(null);
    setAccessibleTabs([]);
    setUserDisplayName("مدیر سیستم");
    setUserEmail(undefined);
    setUserRoleKey(null);
    await logoutPanel();
    router.replace("/login");
  };

  // Menu handlers are now in useMenuItems hook

  // Define role-based accessible tabs (business logic)
  const getRoleBasedTabs = (): string[] => {
    let effectiveRole = userRole;
    if (!effectiveRole && typeof window !== "undefined") {
      const roleFromStorage = sessionStorage.getItem("vaje_role");
      if (
        getPanelUserType() === "admin" &&
        isAdminPanelRole(roleFromStorage)
      ) {
        effectiveRole = roleFromStorage;
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
      return accessibleTabs.length > 0 ? accessibleTabs : ["orders"];
    }

    // Default fallback: if authenticated but role not loaded yet, show basic tabs
    if (isAuthenticated) {
      return ["dashboard", "menu", "orders"];
    }

    return [];
  };

  // Load user display info for sidebar / account modal
  useEffect(() => {
    if (typeof window === "undefined" || !isAuthenticated) return;

    const panelUserType = getPanelUserType();

    if (panelUserType === "staff") {
      const staffData = sessionStorage.getItem("staff_data");
      if (!staffData) return;
      try {
        const parsed = JSON.parse(staffData);
        if (parsed.name) setUserDisplayName(parsed.name);
        if (parsed.role) setUserRoleKey(parsed.role);
        if (parsed.email) setUserEmail(parsed.email);
      } catch {
        /* ignore */
      }
      return;
    }

    fetch("/api/auth/validate", {
      credentials: "include",
      headers: getAuthHeaders(),
    })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.user?.name) setUserDisplayName(data.user.name);
        if (data?.user?.email) setUserEmail(data.user.email);
        if (isAdminPanelRole(data?.role)) setUserRoleKey(data.role);
      })
      .catch(() => {
        const role = sessionStorage.getItem("vaje_role");
        if (isAdminPanelRole(role)) setUserRoleKey(role);
      });
  }, [userType, userRole, isAuthenticated]);

  const navigateToPage = (page: DashboardPage) => {
    if (page === "dashboard") {
      router.push("/dashboard");
    } else {
      router.push(`/dashboard?page=${page}`);
    }
  };

  // Reset orders pagination when filters change
  useEffect(() => {
    if (activePage === "orders") {
      setOrdersPage(1);
    }
  }, [orderFilter, activePage]);

  const getHeaderQuickActions = (): QuickAction[] => {
    switch (activePage) {
      case "orders":
        return [
          {
            label: "سفارش دستی",
            icon: <Plus size={15} />,
            onClick: () => setShowManualOrderForm(true),
            variant: "primary"
          }
        ];
      default:
        return [];
    }
  };

  // Sync panel user type + staff tab permissions when auth changes
  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") {
      setUserType(null);
      setAccessibleTabs([]);
      return;
    }

    const userTypeValue = getPanelUserType();
    setUserType(userTypeValue);

    if (userTypeValue !== "staff") {
      setAccessibleTabs([]);
      return;
    }

    const staffData = sessionStorage.getItem("staff_data");
    if (!staffData) return;

    let parsed: { role?: string };
    try {
      parsed = JSON.parse(staffData);
    } catch {
      return;
    }

    const roleDefaults: { [key: string]: string[] } = {
      waiter: ["orders"],
      barista: ["orders", "customer-orders"],
      manager: ["dashboard", "orders", "customer-orders", "stats"]
    };

    fetch("/api/staff/my-tabs", {
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
          setAccessibleTabs(roleDefaults[parsed.role ?? ""] || ["orders"]);
        }
        const defaultTab = roleDefaults[parsed.role ?? ""]?.[0] || "orders";
        if (defaultTab === "dashboard") {
          router.replace("/dashboard");
        } else {
          router.replace(`/dashboard?page=${defaultTab}`);
        }
      })
      .catch(() => {
        setAccessibleTabs(roleDefaults[parsed.role ?? ""] || ["orders"]);
        const defaultTab = roleDefaults[parsed.role ?? ""]?.[0] || "orders";
        if (defaultTab === "dashboard") {
          router.replace("/dashboard");
        } else {
          router.replace(`/dashboard?page=${defaultTab}`);
        }
      });
  }, [isAuthenticated, router]);

  // Check if a tab is accessible based on role
  const isTabAccessible = (tab: string): boolean => {
    const roleTabs = getRoleBasedTabs();
    // console.log( tab);
    return roleTabs.includes(tab);
  };

  if (!isAuthenticated) return null;

  const pendingOrdersCount = orders.filter(o => o.status === "pending").length;
  const sidebarAllowedPages = getRoleBasedTabs() as DashboardPage[];

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
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                const count = selectedOrders.size;
                const ok = await confirm({
                  title: "تکمیل سفارش‌ها",
                  message: `آیا می‌خواهید ${count} سفارش را تکمیل کنید؟`,
                  confirmLabel: "تکمیل",
                });
                if (!ok) return;
                for (const orderId of selectedOrders) {
                  await handleOrderStatusChange(orderId, "completed");
                }
                setSelectedOrders(new Set());
                success(`${count} سفارش تکمیل شد`);
              }}
              onCancelSelected={async () => {
                const count = selectedOrders.size;
                const ok = await confirm({
                  title: "لغو سفارش‌ها",
                  message: `آیا می‌خواهید ${count} سفارش را لغو کنید؟`,
                  confirmLabel: "لغو سفارش‌ها",
                  variant: "destructive",
                });
                if (!ok) return;
                for (const orderId of selectedOrders) {
                  await handleOrderStatusChange(orderId, "cancelled");
                }
                setSelectedOrders(new Set());
                success(`${count} سفارش لغو شد`);
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
                    <div
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl border",
                        isDark
                          ? "bg-white/[0.03] border-white/[0.06]"
                          : "bg-admin-surface border-admin-border shadow-sm"
                      )}
                    >
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

                  {/* Pagination */}
                  {(() => {
                    const info = getPaginationInfo(
                      filtered.length,
                      ordersPage,
                      ordersPerPage
                    );

                    if (info.pages <= 1) return null;

                    return (
                      <div className="flex flex-col items-center gap-3 pt-2">
                        <PaginationControls
                          currentPage={ordersPage}
                          totalPages={info.pages}
                          onPageChange={setOrdersPage}
                          isDark={isDark}
                          siblingCount={2}
                        />
                        <p
                          className={cn(
                            "text-xs",
                            isDark ? "text-gray-500" : "text-gray-400"
                          )}
                        >
                          {formatPersianNumber(info.total)} سفارش — صفحه{" "}
                          {formatPersianNumber(info.page)} از{" "}
                          {formatPersianNumber(info.pages)}
                        </p>
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
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => {
                  menuItems.setEditingItem(null);
                  setShowMenuForm(true);
                }}
                className="bg-coffee-600 hover:bg-coffee-500 text-white gap-2"
              >
                <Plus size={18} />
                افزودن آیتم جدید
              </Button>
            </div>

            <MenuTable
              items={items}
              onEdit={item => {
                menuItems.handleEdit(item);
                setShowMenuForm(true);
              }}
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
                  showError("خطا در تغییر وضعیت ثابت کردن");
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
                  showError("خطا در تغییر وضعیت پیشنهاد");
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
                    success("ترتیب آیتم‌ها با موفقیت تغییر کرد");
                  } else {
                    throw new Error("Failed to reorder");
                  }
                } catch (err) {
                  console.error("Failed to reorder items:", err);
                  showError("خطا در تغییر ترتیب آیتم‌ها");
                }
              }}
              isDark={isDark}
            />

            <Dialog
              open={(showMenuForm || !!menuItems.editingItem) && !showIngredientModal}
              onOpenChange={open => {
                if (!open) {
                  menuItems.handleCancel();
                  setShowMenuForm(false);
                }
              }}
            >
              <DialogContent
                className={cn(
                  "max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0",
                  isDark
                    ? "bg-[#1a1d24] border-white/10 text-white"
                    : "bg-admin-surface border-admin-border"
                )}
              >
                <DialogHeader
                  className={cn(
                    "px-6 pt-6 pb-4 border-b shrink-0 text-right space-y-0",
                    isDark ? "border-white/10" : "border-admin-border"
                  )}
                >
                  <DialogTitle className="flex items-center gap-2 text-base font-bold pe-8">
                    {menuItems.editingItem ? (
                      <>
                        <Edit2 size={18} className="text-coffee-500 shrink-0" />
                        ویرایش آیتم
                      </>
                    ) : (
                      <>
                        <Plus size={18} className="text-coffee-500 shrink-0" />
                        افزودن آیتم جدید
                      </>
                    )}
                  </DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto px-6 py-5 flex-1">
                <MenuItemForm
                  editingItem={menuItems.editingItem}
                  onSubmit={async (...args) => {
                    const wasEditing = !!menuItems.editingItem;
                    await menuItems.handleSubmit(...args);
                    if (wasEditing) setShowMenuForm(false);
                  }}
                  onCancel={() => {
                    menuItems.handleCancel();
                    setShowMenuForm(false);
                  }}
                  onManageIngredients={() => {
                    if (menuItems.editingItem) {
                      setIngredientModalItemId(menuItems.editingItem.id);
                      setShowIngredientModal(true);
                    }
                  }}
                  isDark={isDark}
                  isSubmitting={menuItems.isSubmitting}
                  compact
                  hideTitle
                />
                </div>
              </DialogContent>
            </Dialog>
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
                      دسته‌بندی
                    </th>
                    <th
                      className={`text-right px-6 py-4 font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      زیردسته
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
                        colSpan={10}
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
                          className={`px-6 py-4 text-sm max-w-[180px] ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          <span className="line-clamp-2" title={product.categoryGroup || ""}>
                            {product.categoryGroup || "—"}
                          </span>
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
                              onClick={() => openInventoryTransaction(product)}
                              className="p-1 hover:bg-emerald-500/20 rounded transition"
                              title="عملیات موجودی"
                            >
                              <PackagePlus size={18} className="text-emerald-500" />
                            </button>
                            <button
                              onClick={() =>
                                handleViewLogs(product.id, product.name, product.unit)
                              }
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
      className={cn("flex h-screen overflow-hidden", adminShellBg(isDark))}
      dir="rtl"
    >
      {/* Sidebar — fixed overlay on mobile, inline on desktop */}
      <DashboardSidebar
        isDark={isDark}
        userRole={userRole}
        allowedPages={sidebarAllowedPages}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={sidebarMobileOpen}
        onMobileOpen={() => setSidebarMobileOpen(true)}
        onMobileClose={() => setSidebarMobileOpen(false)}
        pendingOrdersCount={pendingOrdersCount}
        userName={userDisplayName}
        userRoleLabel={
          userType === "staff" ? userRoleKey : userRoleKey || userRole
        }
        userEmail={userEmail}
        userType={userType}
        canAccessSiteSettings={userRole === "super_admin"}
        onNavigate={page => {
          setSidebarMobileOpen(false);
          navigateToPage(page);
        }}
      />

      {/* Main Content — full width on mobile since sidebar is an overlay */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 w-full">
        {/* Header */}
        <div
          className={cn(
            "relative z-30 min-h-16 flex items-center border-b shrink-0 px-3 md:px-4 lg:px-5 py-2",
            adminHeaderBg(isDark)
          )}
        >
          <DashboardHeader
            isDark={isDark}
            onLogout={handleLogout}
            onToggleTheme={toggleTheme}
            pendingOrdersCount={pendingOrdersCount}
            onNavigate={navigateToPage}
            onGlobalSearch={query => {
              navigateToPage("orders");
              setOrderFilter(prev => ({ ...prev, search: query }));
              setOrdersPage(1);
            }}
            quickActions={getHeaderQuickActions()}
          />
        </div>

        {/* Page Content */}
        <div
          className={cn("flex-1 overflow-y-auto", adminContentBg(isDark))}
        >
          <div className="max-w-7xl mx-auto px-5 py-6">
            <AdminPageBreadcrumb activePage={activePage} isDark={isDark} />
            <AdminPageTitle activePage={activePage} isDark={isDark} />
            {renderPageContent()}
          </div>
        </div>
      </div>

      {/* Manual Order Form Modal */}
      <ManualOrderForm
        items={items}
        isDark={isDark}
        open={showManualOrderForm}
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
                success("سفارش دستی با موفقیت ثبت شد");
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
                showError(`خطا در ثبت سفارش: ${error.error || "Unknown error"}`);
              }
            } catch (error) {
              console.error(error);
              showError("خطا در ثبت سفارش");
            }
          }}
          onClose={() => setShowManualOrderForm(false)}
        />

      {/* Product Modal - for both add and edit */}
      {(showNewProductForm || selectedProduct) && (
        <RawMaterialModal
          material={selectedProduct || undefined}
          isDark={isDark}
          onClose={() => {
            setShowNewProductForm(false);
            setSelectedProduct(null);
          }}
          onOpenTransaction={
            selectedProduct?.id
              ? () => openInventoryTransaction(selectedProduct)
              : undefined
          }
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
      {showLogsModal && (
        <InventoryLogsModal
          isOpen={showLogsModal}
          onClose={() => {
            setShowLogsModal(false);
            setSelectedProductLogs([]);
            setLogsProductName("");
          }}
          logs={selectedProductLogs}
          productName={logsProductName}
          productUnit={logsProductUnit}
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

      {/* Inventory Transaction Modal */}
      <InventoryTransactionModal
        isOpen={showStockAdjustment}
        product={adjustmentProduct}
        isDark={isDark}
        onClose={() => {
          setShowStockAdjustment(false);
          setAdjustmentProduct(null);
        }}
        onSave={handleInventoryTransaction}
      />
    </div>
  );
}

// Branches Management is now a separate component
