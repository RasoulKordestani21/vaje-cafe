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

// Persian Price Input Helper Functions
export const sanitizePriceInput = (value: string): string => {
  // Convert Persian/Arabic digits to English
  const englishDigits = toEnglishDigits(value);
  // Remove all non-digits (including commas, spaces, currency symbols)
  return englishDigits.replace(/\D/g, "");
};

export const parsePersianPrice = (value: string): number => {
  const sanitized = sanitizePriceInput(value);
  return parseInt(sanitized, 10) || 0;
};

export const formatPersianPriceInput = (value: string): string => {
  const sanitized = sanitizePriceInput(value);
  if (!sanitized) return '';
  
  // Format with Persian digits and add commas
  const number = parseInt(sanitized, 10);
  const formatted = new Intl.NumberFormat('fa-IR').format(number);
  return toPersianDigits(formatted);
};

export const validatePriceInput = (value: string, min = 0, max?: number): {
  isValid: boolean;
  error?: string;
  value: number;
} => {
  const numericValue = parsePersianPrice(value);
  
  if (!value.trim()) {
    return {
      isValid: false,
      error: 'مبلغ الزامی است',
      value: 0
    };
  }
  
  if (numericValue <= min) {
    return {
      isValid: false,
      error: `مبلغ باید بیشتر از ${toPersianDigits(min.toLocaleString())} تومان باشد`,
      value: numericValue
    };
  }
  
  if (max && numericValue > max) {
    return {
      isValid: false,
      error: `مبلغ نباید بیشتر از ${toPersianDigits(max.toLocaleString())} تومان باشد`,
      value: numericValue
    };
  }
  
  return {
    isValid: true,
    value: numericValue
  };
};

// Helper to get display text for price inputs
export const getPriceInputDisplayText = (value: string | number, showCurrency = true): string => {
  if (!value) return '';
  
  const numericValue = typeof value === 'string' ? parsePersianPrice(value) : value;
  const formatted = formatPersianPriceInput(numericValue.toString());
  
  return showCurrency ? `${formatted} تومان` : formatted;
};