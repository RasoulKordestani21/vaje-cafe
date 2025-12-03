
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  available: boolean;
}

export type Category = 'اسپرسو' | 'قهوه دمی' | 'نوشیدنی سرد' | 'کیک و دسر' | 'نوشیدنی خاص';

export const CATEGORIES: Category[] = ['اسپرسو', 'قهوه دمی', 'نوشیدنی سرد', 'نوشیدنی خاص', 'کیک و دسر'];

export interface MenuContextType {
  items: MenuItem[];
  addItem: (item: Omit<MenuItem, 'id'>) => void;
  updateItem: (id: string, item: Partial<MenuItem>) => void;
  deleteItem: (id: string) => void;
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  qrCodeUrl: string;
  updateQrCodeUrl: (url: string) => void;
}
