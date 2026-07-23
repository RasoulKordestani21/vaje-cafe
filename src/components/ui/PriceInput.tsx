"use client";

import { useState, useEffect, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { 
  sanitizePriceInput, 
  formatPersianPriceInput, 
  validatePriceInput,
  toPersianDigits,
  parsePersianPrice
} from '@/utils/format';

interface PriceInputProps {
  label?: string;
  value: string | number;
  onChange: (value: string, numericValue: number) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  min?: number;
  max?: number;
  showValidation?: boolean;
  showCurrency?: boolean;
  id?: string;
  name?: string;
}

export const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(({
  label,
  value,
  onChange,
  onBlur,
  placeholder = "۰",
  required = false,
  disabled = false,
  className,
  labelClassName,
  inputClassName,
  min = 0,
  max,
  showValidation = true,
  showCurrency = true,
  id,
  name,
  ...props
}, ref) => {
  const [displayValue, setDisplayValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [validationState, setValidationState] = useState<{
    isValid: boolean;
    error?: string;
  }>({ isValid: true });

  // Initialize display value
  useEffect(() => {
    if (value) {
      const numericValue = typeof value === 'string' ? parsePersianPrice(value) : value;
      if (numericValue > 0) {
        setDisplayValue(formatPersianPriceInput(numericValue.toString()));
      } else {
        setDisplayValue('');
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty input
    if (!inputValue.trim()) {
      setDisplayValue('');
      onChange('', 0);
      return;
    }

    // Sanitize and format the input
    const sanitized = sanitizePriceInput(inputValue);
    const formatted = formatPersianPriceInput(sanitized);
    const numericValue = parsePersianPrice(sanitized);

    setDisplayValue(formatted);
    onChange(sanitized, numericValue);

    // Validate if enabled
    if (showValidation) {
      const validation = validatePriceInput(sanitized, min, max);
      setValidationState({
        isValid: validation.isValid,
        error: validation.error
      });
    }
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
    onBlur?.();
    
    // Final validation on blur
    if (showValidation && displayValue) {
      const validation = validatePriceInput(displayValue, min, max);
      setValidationState({
        isValid: validation.isValid,
        error: validation.error
      });
    }
  };

  const getDisplayValue = () => {
    if (focused) {
      // When focused, show formatted numbers without currency
      return displayValue;
    } else {
      // When not focused and has value, show with currency if enabled
      if (displayValue && showCurrency) {
        return `${displayValue} تومان`;
      }
      return displayValue;
    }
  };

  const hasError = showValidation && !validationState.isValid && displayValue;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label 
          htmlFor={id}
          className={cn(
            "block text-sm font-medium",
            required && "after:content-['*'] after:text-red-500 after:ml-1",
            hasError && "text-red-600",
            labelClassName
          )}
        >
          {label}
        </Label>
      )}
      
      <div className="relative">
        <Input
          ref={ref}
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          value={getDisplayValue()}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "text-right",
            hasError && "border-red-500 focus-visible:ring-red-500",
            inputClassName
          )}
          dir="rtl"
          {...props}
        />
        
        {!focused && !displayValue && showCurrency && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
            تومان
          </div>
        )}
      </div>

      {hasError && showValidation && (
        <p className="text-sm text-red-600 mt-1">
          {validationState.error}
        </p>
      )}
      
      {displayValue && !hasError && min > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          حداقل: {toPersianDigits(min.toLocaleString())} تومان
          {max && ` - حداکثر: ${toPersianDigits(max.toLocaleString())} تومان`}
        </p>
      )}
    </div>
  );
});

PriceInput.displayName = "PriceInput";