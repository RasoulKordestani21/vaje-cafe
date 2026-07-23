import { MenuItem } from "./types";
import { encodeMenuCategory } from "./constants/menuCategories";

// Logo path - served from public/assets
export const LOGO_URL = "/assets/logo.png";

const HOT = "نوشیدنی‌های گرم (Hot Beverages)";
const COLD = "نوشیدنی‌های سرد (Cold Beverages)";
const DESSERTS = "دسر و شیرینی (Desserts)";

export const DEFAULT_MENU: MenuItem[] = [
  {
    id: "1",
    name: "لته واژه (سیگنیچر)",
    description:
      "ترکیبی خاص از اسپرسو غنی با شیر فوم گرفته شده و طعم دهنده دست‌ساز وانیل.",
    price: 85000,
    category: encodeMenuCategory(HOT, "قهوه‌های بر پایه شیر"),
    available: true,
    imageUrl: "https://picsum.photos/400/400?random=1"
  },
  {
    id: "2",
    name: "کمکس اتیوپی",
    description:
      "قهوه تک‌خاستگاه با نت‌های گلی و مرکباتی، تهیه شده به روش قطره‌ای دستی.",
    price: 95000,
    category: encodeMenuCategory(HOT, "قهوه‌های دمی"),
    available: true,
    imageUrl: "https://picsum.photos/400/400?random=2"
  },
  {
    id: "3",
    name: "کلد برو نیترو",
    description: "قهوه سرد دم با بافت خامه ای و طعم طبیعی شیرین بدون شکر.",
    price: 80000,
    category: encodeMenuCategory(COLD, "آیس کافی"),
    available: true,
    imageUrl: "https://picsum.photos/400/400?random=3"
  },
  {
    id: "4",
    name: "کروسان پسته",
    description:
      "لایه های ترد و کره‌ای پر شده با کرم پسته اعلا و تکه های پسته.",
    price: 110000,
    category: encodeMenuCategory(DESSERTS, "شیرینی‌های خشک"),
    available: true,
    imageUrl: "https://picsum.photos/400/400?random=4"
  },
  {
    id: "5",
    name: "لته زعفران و گل سرخ",
    description: "نوشیدنی خاص کافه واژه. اسپرسو، گلاب، شیر زعفرانی و هل.",
    price: 120000,
    category: encodeMenuCategory(HOT, "هات چاکلت و نوشیدنی‌های ویژه"),
    available: true,
    imageUrl: "https://picsum.photos/400/400?random=5"
  },
  {
    id: "6",
    name: "موکا شکلات تلخ",
    description: "تهیه شده با گاناش شکلات تلخ بلژیکی ۷۰ درصد.",
    price: 90000,
    category: encodeMenuCategory(HOT, "قهوه‌های بر پایه شیر"),
    available: true,
    imageUrl: "https://picsum.photos/400/400?random=6"
  }
];
