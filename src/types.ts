
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // Stored in Tomans
  category: string;
  imageUrl?: string;
  available: boolean;
}

export type Category = 'اسپرسو' | 'قهوه دمی' | 'نوشیدنی سرد' | 'کیک و دسر' | 'نوشیدنی خاص';

export const CATEGORIES: Category[] = ['اسپرسو', 'قهوه دمی', 'نوشیدنی سرد', 'نوشیدنی خاص', 'کیک و دسر'];

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
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: number; // Timestamp
  customerNote?: string;
}

export interface MenuContextType {
  items: MenuItem[];
  orders: Order[];
  isLoading: boolean;
  addItem: (item: Omit<MenuItem, 'id'>, imageFile?: File) => Promise<void>;
  updateItem: (id: string, item: Partial<MenuItem>, imageFile?: File) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addOrder: (items: OrderItem[], note?: string) => Promise<void>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  qrCodeUrl: string;
  updateQrCodeUrl: (url: string) => void;
}
