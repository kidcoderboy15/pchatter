/**
 * Design System Constants for Pickle Chatter
 * Centralized theme values for consistency across the app
 */

export const COLORS = {
  // Primary colors
  primary: '#22c55e',
  primaryDark: '#16a34a',
  primaryLight: '#86efac',

  // Semantic colors
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',

  // Neutral colors
  black: '#111827',
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  // Pickleball specific
  pickleGreen: '#dcfce7',
  pickleGreenDark: '#166534',
  courtGray: '#f3f4f6',

  // Background
  background: '#ffffff',
  backgroundGray: '#f9fafb',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textInverse: '#ffffff',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FONT_SIZES = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  huge: 32,
  massive: 48,
};

export const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

// iOS Human Interface Guidelines
export const TOUCH_TARGET = {
  min: 44, // Minimum touch target size
  recommended: 48,
};

export const ANIMATION = {
  fast: 200,
  normal: 300,
  slow: 500,
};

// Screen breakpoints
export const BREAKPOINTS = {
  sm: 320, // iPhone SE
  md: 375, // iPhone standard
  lg: 414, // iPhone Plus
  xl: 768, // iPad
};

// Z-index levels
export const Z_INDEX = {
  background: 0,
  content: 1,
  header: 10,
  overlay: 100,
  modal: 1000,
  toast: 10000,
};
