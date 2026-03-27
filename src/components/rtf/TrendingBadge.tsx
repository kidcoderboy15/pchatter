import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RTF_COLORS, RTF_SPACING, RTF_SIZES, RTF_RADIUS, RTF_FONTS } from '../../constants/rtfTheme';

interface TrendingBadgeProps {
  rank: number;
}

export default function TrendingBadge({ rank }: TrendingBadgeProps) {
  const getBadgeColor = () => {
    if (rank === 1) return RTF_COLORS.gold;
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return RTF_COLORS.neon;
  };

  return (
    <View style={[styles.badge, { backgroundColor: getBadgeColor() }]}>
      <Text style={styles.text}>#{rank}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: RTF_SPACING.sm,
    paddingVertical: RTF_SPACING.xs,
    borderRadius: RTF_RADIUS.pill,
    minWidth: 32,
    alignItems: 'center',
  },
  text: {
    fontSize: RTF_SIZES.xs,
    color: RTF_COLORS.bg,
    ...RTF_FONTS.mono,
  },
});
