/**
 * RTF: Rate the Fit - Type Definitions
 */

export type RatingEmoji = 'FIRE' | 'DEAD' | 'TRASH' | 'MID' | 'GRAIL';

export type StyleCategory =
  | 'All'
  | 'Streetwear'
  | 'Y2K'
  | 'Gorpcore'
  | 'Old Money'
  | 'Techwear'
  | 'Skater'
  | 'Cottagecore'
  | 'Dark Academia'
  | 'Coastal'
  | 'Retro';

export interface StyleItem {
  id: string;
  name: string;
  vibe: string;
  heatScore: number; // 0-100
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  description: string;
  proTip: string;
  celebs: string[];
  tags: string[];
  category: StyleCategory;
  cardColor: string;
  accentColor: string;
  emoji: string;
  imageUrl?: string;
}

export interface StyleRating {
  id: string;
  userId: string;
  styleId: string;
  rating: RatingEmoji;
  createdAt: string;
}

export interface RTFUserProfile {
  userId: string;
  totalRatings: number;
  favoriteStyles: string[];
  topCategory: StyleCategory;
  ratings: StyleRating[];
}

export const RATING_CONFIG: Record<RatingEmoji, { emoji: string; label: string; color: string; value: number }> = {
  FIRE: { emoji: '🔥', label: 'FIRE', color: '#FF6B35', value: 5 },
  GRAIL: { emoji: '🏆', label: 'GRAIL', color: '#FFD700', value: 4 },
  DEAD: { emoji: '💀', label: 'DEAD', color: '#A855F7', value: 3 },
  MID: { emoji: '😐', label: 'MID', color: '#6B7280', value: 2 },
  TRASH: { emoji: '🗑️', label: 'TRASH', color: '#EF4444', value: 1 },
};
