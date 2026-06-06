export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // Stored in Tomans
  category: string;
  imageUrl?: string;
  available: boolean;
  is_pinned?: boolean;
  is_suggested?: boolean;
  display_order?: number; // Display order for menu items
  ingredients?: MenuIngredient[]; // Raw materials used in this item
}

export interface MenuIngredient {
  rawMaterialId: string;
  quantity: number; // How much is used
  unit: string; // "g" (grams), "ml" (milliliters), "pcs" (pieces), "cup", etc.
}

export interface RawMaterial {
  id: string;
  name: string; // e.g., "Espresso beans", "Whole milk", "Sugar"
  category: string; // e.g., "beans", "dairy", "sweeteners"
  unit: string; // "g" (grams), "ml" (milliliters), "pcs" (pieces), "cup", "kg", "liter"
  currentStock: number; // Current quantity in stock
  minStock: number; // Alert when below this
  price: number; // Cost per unit (in Tomans)
  supplier?: string; // Supplier name
  lastRestocked?: number; // Timestamp
  createdAt: number;
  updatedAt: number;
}

export interface ExternalProduct {
  id: string;
  name: string; // e.g., "Cake from Supplier X", "Imported Juice"
  category: string; // e.g., "cakes", "drinks", "pastries"
  price: number; // Price per unit (in Tomans)
  unit: string; // "pcs" (pieces), "portion", "bottle", etc.
  description?: string; // Product description
  supplier?: string; // External supplier name
  isAvailable: boolean; // Whether product is currently available
  createdAt: number;
  updatedAt: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "super_admin"; // Super admin has access to raw materials
  createdAt: number;
  updatedAt: number;
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export type Category =
  | "اسپرسو"
  | "قهوه دمی"
  | "نوشیدنی سرد"
  | "کیک و دسر"
  | "نوشیدنی خاص";

export const CATEGORIES: Category[] = [
  "اسپرسو",
  "قهوه دمی",
  "نوشیدنی سرد",
  "نوشیدنی خاص",
  "کیک و دسر"
];

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  totalPrice?: number; // For database compatibility
  status: "pending" | "completed" | "cancelled";
  source?: "website" | "manual"; // Where order came from
  createdAt: number; // Timestamp
  created_at?: number; // Database field
  customerName: string; // Customer name (required)
  customerPhone?: string; // Customer phone (optional)
  customerNote?: string;
}

export interface MenuContextType {
  items: MenuItem[];
  orders: Order[];
  isLoading: boolean;
  addItem: (item: Omit<MenuItem, "id">, imageFile?: File) => Promise<void>;
  updateItem: (
    id: string,
    item: Partial<MenuItem>,
    imageFile?: File
  ) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addOrder: (
    items: OrderItem[],
    note?: string,
    customerInfo?: {
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      tableNumber?: number | string;
    }
  ) => Promise<void>;
  updateOrderStatus: (id: string, status: Order["status"]) => Promise<void>;
  isAuthenticated: boolean;
  authChecked: boolean;
  userRole: "admin" | "super_admin" | null;
  login: (role: "admin" | "super_admin") => boolean;
  logout: () => void;
  qrCodeUrl: string;
  updateQrCodeUrl: (url: string) => void;
  // Raw Materials (Super Admin only)
  rawMaterials?: RawMaterial[];
  addRawMaterial?: (
    material: Omit<RawMaterial, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateRawMaterial?: (
    id: string,
    material: Partial<RawMaterial>
  ) => Promise<void>;
  deleteRawMaterial?: (id: string) => Promise<void>;
}
