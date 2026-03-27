import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RTF_COLORS, RTF_RADIUS } from '../../constants/rtfTheme';

interface HeatBarProps {
  score: number; // 0-100
  color: string;
}

export default function HeatBar({ score, color }: HeatBarProps) {
  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          { width: `${Math.min(score, 100)}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flex: 1,
    height: 6,
    backgroundColor: RTF_COLORS.bgElevated,
    borderRadius: RTF_RADIUS.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: RTF_RADIUS.pill,
  },
});
