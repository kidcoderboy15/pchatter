import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StyleItem } from '../../types/rtf';
import { RTF_COLORS, RTF_SPACING, RTF_SIZES, RTF_RADIUS, RTF_FONTS } from '../../constants/rtfTheme';
import HeatBar from './HeatBar';

interface StyleCardProps {
  style: StyleItem;
  onPress: (style: StyleItem) => void;
}

export default function StyleCard({ style, onPress }: StyleCardProps) {
  return (
    <TouchableOpacity
      onPress={() => onPress(style)}
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: style.cardColor }]}
    >
      {/* Header row */}
      <View style={styles.header}>
        <Text style={styles.emoji}>{style.emoji}</Text>
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>{style.priceRange}</Text>
        </View>
      </View>

      {/* Name + Vibe */}
      <Text style={styles.name}>{style.name}</Text>
      <Text style={[styles.vibe, { color: style.accentColor }]}>
        {style.vibe}
      </Text>

      {/* Heat score */}
      <View style={styles.heatRow}>
        <Text style={styles.heatLabel}>HEAT</Text>
        <HeatBar score={style.heatScore} color={style.accentColor} />
        <Text style={[styles.heatScore, { color: style.accentColor }]}>
          {style.heatScore}
        </Text>
      </View>

      {/* Tags */}
      <View style={styles.tags}>
        {style.tags.slice(0, 3).map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>#{tag}</Text>
          </View>
        ))}
      </View>

      {/* Celebs */}
      <Text style={styles.celebs} numberOfLines={1}>
        Worn by: {style.celebs.join(' · ')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: RTF_SPACING.lg,
    marginBottom: RTF_SPACING.lg,
    borderRadius: RTF_RADIUS.xl,
    padding: RTF_SPACING.xl,
    borderWidth: 1,
    borderColor: RTF_COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RTF_SPACING.md,
  },
  emoji: {
    fontSize: 36,
  },
  priceBadge: {
    backgroundColor: RTF_COLORS.bgElevated,
    paddingHorizontal: RTF_SPACING.md,
    paddingVertical: RTF_SPACING.xs,
    borderRadius: RTF_RADIUS.pill,
    borderWidth: 1,
    borderColor: RTF_COLORS.border,
  },
  priceText: {
    color: RTF_COLORS.gold,
    fontSize: RTF_SIZES.sm,
    ...RTF_FONTS.mono,
  },
  name: {
    fontSize: RTF_SIZES.xxl,
    color: RTF_COLORS.textPrimary,
    marginBottom: RTF_SPACING.xs,
    ...RTF_FONTS.heading,
  },
  vibe: {
    fontSize: RTF_SIZES.sm,
    marginBottom: RTF_SPACING.lg,
    textTransform: 'uppercase',
    ...RTF_FONTS.mono,
  },
  heatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RTF_SPACING.lg,
    gap: RTF_SPACING.sm,
  },
  heatLabel: {
    fontSize: RTF_SIZES.xs,
    color: RTF_COLORS.textMuted,
    ...RTF_FONTS.mono,
  },
  heatScore: {
    fontSize: RTF_SIZES.md,
    ...RTF_FONTS.subheading,
  },
  tags: {
    flexDirection: 'row',
    gap: RTF_SPACING.sm,
    marginBottom: RTF_SPACING.md,
  },
  tag: {
    backgroundColor: RTF_COLORS.bgElevated,
    paddingHorizontal: RTF_SPACING.md,
    paddingVertical: RTF_SPACING.xs,
    borderRadius: RTF_RADIUS.pill,
  },
  tagText: {
    fontSize: RTF_SIZES.xs,
    color: RTF_COLORS.textSecondary,
    ...RTF_FONTS.body,
  },
  celebs: {
    fontSize: RTF_SIZES.xs,
    color: RTF_COLORS.textMuted,
    ...RTF_FONTS.body,
  },
});
