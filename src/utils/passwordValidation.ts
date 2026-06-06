/**
 * Password validation utilities for consistent password requirements
 * across the application
 */

export interface PasswordStrengthResult {
  isValid: boolean;
  errors: string[];
}

// Password requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: false, // Optional - not currently enforced
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // Optional - not currently enforced
};

/**
 * Validate password against requirements
 * 
 * Requirements:
 * - Minimum 8 characters
 * - At least one letter (a-z or A-Z)
 * - At least one number (0-9)
 */
export function validatePassword(password: string): PasswordStrengthResult {
  const errors: string[] = [];

  // Check minimum length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`رمز عبور باید حداقل ${PASSWORD_REQUIREMENTS.minLength} کاراکتر باشد`);
  }

  // Check for letters
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-zA-Z]/.test(password)) {
    errors.push("رمز عبور باید شامل حروف باشد");
  }

  // Check for numbers
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/[0-9]/.test(password)) {
    errors.push("رمز عبور باید شامل اعداد باشد");
  }

  // Check for uppercase (optional)
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("رمز عبور باید شامل حروف بزرگ باشد");
  }

  // Check for special characters (optional)
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("رمز عبور باید شامل کاراکترهای خاص باشد");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get password strength score (0-100)
 */
export function getPasswordStrength(password: string): number {
  let strength = 0;

  // Length score (up to 30 points)
  if (password.length >= PASSWORD_REQUIREMENTS.minLength) {
    strength += 10;
  }
  if (password.length >= 12) {
    strength += 10;
  }
  if (password.length >= 16) {
    strength += 10;
  }

  // Character variety (up to 70 points)
  if (/[a-z]/.test(password)) {
    strength += 15; // lowercase letters
  }
  if (/[A-Z]/.test(password)) {
    strength += 15; // uppercase letters
  }
  if (/[0-9]/.test(password)) {
    strength += 15; // numbers
  }
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    strength += 25; // special characters
  }

  return Math.min(strength, 100);
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(strength: number): {
  label: string;
  color: string;
} {
  if (strength < 30) {
    return { label: "ضعیف", color: "red" };
  }
  if (strength < 60) {
    return { label: "متوسط", color: "orange" };
  }
  if (strength < 80) {
    return { label: "خوب", color: "yellow" };
  }
  return { label: "قوی", color: "green" };
}

/**
 * Generate a secure random password (optional utility)
 */
export function generateSecurePassword(length: number = 12): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*()";
  
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = "";
  
  // Ensure at least one of each required type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}
