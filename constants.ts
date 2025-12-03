import { MenuItem } from "./types";

// NOTE: This is a temporary CDN URL. For production, download the image and serve it locally.
export const LOGO_URL = "https://scontent-ams2-1.cdninstagram.com/v/t51.2885-19/581802746_17888983236382578_2494068580191133590_n.jpg?stp=dst-jpg_s320x320_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=scontent-ams2-1.cdninstagram.com&_nc_cat=106&_nc_oc=Q6cZ2QHk3CI3KMYJZ7AleAPX0Dloeks3XxBw4Xq0PH6rDa5sWh5oerYYnLs4hnqg6EzHPA4&_nc_ohc=6HVccnbB7J0Q7kNvwFJdcEF&_nc_gid=z7lLIUeWCXOcakvo5f7tlQ&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfmKEVTpeDWbgS6iPzQcJNlD9ClMYE_tgEFh8yM-JJdcOA&oe=693453AB&_nc_sid=8b3546";

export const DEFAULT_MENU: MenuItem[] = [
  {
    id: '1',
    name: 'لته واژه (سیگنیچر)',
    description: 'ترکیبی خاص از اسپرسو غنی با شیر فوم گرفته شده و طعم دهنده دست‌ساز وانیل.',
    price: 5.50,
    category: 'اسپرسو',
    available: true,
    imageUrl: 'https://picsum.photos/400/400?random=1'
  },
  {
    id: '2',
    name: 'کمکس اتیوپی',
    description: 'قهوه تک‌خاستگاه با نت‌های گلی و مرکباتی، تهیه شده به روش قطره‌ای دستی.',
    price: 6.00,
    category: 'قهوه دمی',
    available: true,
    imageUrl: 'https://picsum.photos/400/400?random=2'
  },
  {
    id: '3',
    name: 'کلد برو نیترو',
    description: 'قهوه سرد دم با بافت خامه ای و طعم طبیعی شیرین بدون شکر.',
    price: 5.00,
    category: 'نوشیدنی سرد',
    available: true,
    imageUrl: 'https://picsum.photos/400/400?random=3'
  },
  {
    id: '4',
    name: 'کروسان پسته',
    description: 'لایه های ترد و کره‌ای پر شده با کرم پسته اعلا و تکه های پسته.',
    price: 4.50,
    category: 'کیک و دسر',
    available: true,
    imageUrl: 'https://picsum.photos/400/400?random=4'
  },
  {
    id: '5',
    name: 'لته زعفران و گل سرخ',
    description: 'نوشیدنی خاص کافه واژه. اسپرسو، گلاب، شیر زعفرانی و هل.',
    price: 7.00,
    category: 'نوشیدنی خاص',
    available: true,
    imageUrl: 'https://picsum.photos/400/400?random=5'
  },
  {
    id: '6',
    name: 'موکا شکلات تلخ',
    description: 'تهیه شده با گاناش شکلات تلخ بلژیکی ۷۰ درصد.',
    price: 6.50,
    category: 'اسپرسو',
    available: true,
    imageUrl: 'https://picsum.photos/400/400?random=6'
  }
];