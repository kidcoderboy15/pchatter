import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { RTF_COLORS, RTF_SPACING, RTF_SIZES, RTF_RADIUS, RTF_FONTS } from '../../constants/rtfTheme';

interface CategoryPillsProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategoryPills({ categories, selected, onSelect }: CategoryPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((cat) => {
        const isActive = cat === selected;
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => onSelect(cat)}
            style={[styles.pill, isActive && styles.pillActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: RTF_SPACING.lg,
    paddingVertical: RTF_SPACING.md,
    gap: RTF_SPACING.sm,
  },
  pill: {
    paddingHorizontal: RTF_SPACING.lg,
    paddingVertical: RTF_SPACING.sm,
    borderRadius: RTF_RADIUS.pill,
    backgroundColor: RTF_COLORS.bgElevated,
    borderWidth: 1,
    borderColor: RTF_COLORS.border,
    marginRight: RTF_SPACING.sm,
  },
  pillActive: {
    backgroundColor: RTF_COLORS.neon,
    borderColor: RTF_COLORS.neon,
  },
  pillText: {
    fontSize: RTF_SIZES.sm,
    color: RTF_COLORS.textSecondary,
    ...RTF_FONTS.mono,
  },
  pillTextActive: {
    color: RTF_COLORS.bg,
    ...RTF_FONTS.mono,
  },
});
