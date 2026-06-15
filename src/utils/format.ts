export const formatToman = (price: number): string => {
  if (typeof price !== 'number') return '۰ تومان';
  
  // Convert to Toman string with commas
  const formatter = new Intl.NumberFormat('fa-IR');
  return `${formatter.format(price)} تومان`;
};

export const toEnglishDigits = (n: string): string =>
  n
    .replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

export const toPersianDigits = (n: string | number): string => {
  if (n === undefined || n === null) return '';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
};