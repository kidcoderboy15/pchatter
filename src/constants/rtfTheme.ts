/**
 * RTF: Rate the Fit - Theme Constants
 * Dark background, bold typography, Gen-Z energy
 */

export const RTF_COLORS = {
  // Core dark background
  bg: '#0A0A0F',
  bgCard: '#16161F',
  bgElevated: '#1E1E2A',
  bgInput: '#252535',

  // Accent colors
  neon: '#C8FF00',
  neonDim: '#8AB300',
  electric: '#7C3AED',
  hotPink: '#FF2D78',
  cyan: '#00F0FF',
  orange: '#FF6B35',
  gold: '#FFD700',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B8',
  textMuted: '#6B6B80',

  // Borders
  border: '#2A2A3A',
  borderLight: '#3A3A4A',
};

export const RTF_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const RTF_FONTS = {
  // Bold display headings
  heading: {
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  // Subheadings
  subheading: {
    fontWeight: '700' as const,
    letterSpacing: 0,
  },
  // Body text
  body: {
    fontWeight: '400' as const,
    letterSpacing: 0.2,
  },
  // Mono/tags
  mono: {
    fontWeight: '600' as const,
    letterSpacing: 1.5,
  },
};

export const RTF_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
  hero: 48,
};

export const RTF_RADIUS = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};
