import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RatingEmoji, RATING_CONFIG } from '../../types/rtf';
import { RTF_COLORS, RTF_SPACING, RTF_SIZES, RTF_RADIUS, RTF_FONTS } from '../../constants/rtfTheme';

interface RatingButtonsProps {
  selected: RatingEmoji | null;
  onRate: (rating: RatingEmoji) => void;
}

const RATINGS: RatingEmoji[] = ['FIRE', 'GRAIL', 'DEAD', 'MID', 'TRASH'];

export default function RatingButtons({ selected, onRate }: RatingButtonsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>RATE THIS FIT</Text>
      <View style={styles.row}>
        {RATINGS.map((rating) => {
          const config = RATING_CONFIG[rating];
          const isSelected = selected === rating;
          return (
            <TouchableOpacity
              key={rating}
              onPress={() => onRate(rating)}
              style={[
                styles.button,
                isSelected && { backgroundColor: config.color, borderColor: config.color },
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{config.emoji}</Text>
              <Text
                style={[
                  styles.label,
                  isSelected && styles.labelActive,
                ]}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: RTF_SPACING.xl,
  },
  title: {
    fontSize: RTF_SIZES.sm,
    color: RTF_COLORS.textMuted,
    textAlign: 'center',
    marginBottom: RTF_SPACING.lg,
    ...RTF_FONTS.mono,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: RTF_SPACING.sm,
  },
  button: {
    alignItems: 'center',
    paddingVertical: RTF_SPACING.md,
    paddingHorizontal: RTF_SPACING.md,
    borderRadius: RTF_RADIUS.lg,
    backgroundColor: RTF_COLORS.bgElevated,
    borderWidth: 2,
    borderColor: RTF_COLORS.border,
    minWidth: 60,
  },
  emoji: {
    fontSize: 24,
    marginBottom: RTF_SPACING.xs,
  },
  label: {
    fontSize: RTF_SIZES.xs,
    color: RTF_COLORS.textSecondary,
    ...RTF_FONTS.mono,
  },
  labelActive: {
    color: RTF_COLORS.textPrimary,
  },
});
