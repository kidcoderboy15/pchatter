/**
 * Input validation utilities for Pickle Chatter
 */

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate phone number (US format)
 * Accepts various formats: (123) 456-7890, 123-456-7890, 1234567890, +11234567890
 */
export const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  // Should be 10 digits (US) or 11 digits (with country code)
  return cleaned.length >= 10 && cleaned.length <= 11;
};

/**
 * Format phone number for display
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

/**
 * Validate pickleball score (0-99)
 */
export const validateScore = (score: string): number | null => {
  const num = parseInt(score, 10);
  if (isNaN(num) || num < 0 || num > 99) {
    return null;
  }
  return num;
};

/**
 * Validate username
 * Rules: 3-20 characters, alphanumeric, underscores, and hyphens only
 */
export const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * Validate skill level (1-6)
 */
export const validateSkillLevel = (level: number): boolean => {
  return Number.isInteger(level) && level >= 1 && level <= 6;
};

/**
 * Validate text input length
 */
export const validateLength = (
  text: string,
  minLength: number,
  maxLength: number
): boolean => {
  const length = text.trim().length;
  return length >= minLength && length <= maxLength;
};

/**
 * Validate group join code
 * Format: 8 alphanumeric characters
 */
export const validateJoinCode = (code: string): boolean => {
  const codeRegex = /^[A-Z0-9]{8}$/;
  return codeRegex.test(code.toUpperCase());
};

/**
 * Sanitize text input (remove special characters)
 */
export const sanitizeText = (text: string): string => {
  return text.trim().replace(/[<>]/g, '');
};

/**
 * Validate URL format
 */
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate password strength
 * Rules: At least 8 characters, contains letter and number
 */
export const validatePassword = (password: string): {
  valid: boolean;
  message?: string;
} => {
  if (password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters',
    };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasLetter || !hasNumber) {
    return {
      valid: false,
      message: 'Password must contain both letters and numbers',
    };
  }

  return { valid: true };
};

/**
 * Get validation error message for form field
 */
export const getValidationError = (
  field: string,
  value: string,
  rules?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => boolean;
  }
): string | null => {
  if (rules?.required && !value.trim()) {
    return `${field} is required`;
  }

  if (rules?.minLength && value.trim().length < rules.minLength) {
    return `${field} must be at least ${rules.minLength} characters`;
  }

  if (rules?.maxLength && value.trim().length > rules.maxLength) {
    return `${field} must be at most ${rules.maxLength} characters`;
  }

  if (rules?.pattern && !rules.pattern.test(value)) {
    return `${field} format is invalid`;
  }

  if (rules?.custom && !rules.custom(value)) {
    return `${field} is invalid`;
  }

  return null;
};
