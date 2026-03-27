import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RTFStackParamList } from '../../navigation/types';
import { RTF_COLORS, RTF_SPACING, RTF_SIZES, RTF_RADIUS, RTF_FONTS } from '../../constants/rtfTheme';
import { RTF_STYLES } from '../../data/rtfStyles';
import HeatBar from '../../components/rtf/HeatBar';
import TrendingBadge from '../../components/rtf/TrendingBadge';

type Props = {
  navigation: NativeStackNavigationProp<RTFStackParamList, 'RTFTrending'>;
};

export default function RTFTrendingScreen({ navigation }: Props) {
  // Sort by heat score descending
  const trendingStyles = [...RTF_STYLES].sort((a, b) => b.heatScore - a.heatScore);

  const renderItem = ({ item, index }: { item: (typeof RTF_STYLES)[0]; index: number }) => {
    const rank = index + 1;
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('RTFDetail', { styleId: item.id })}
        activeOpacity={0.7}
      >
        <TrendingBadge rank={rank} />
        <View style={styles.info}>
          <Text style={styles.emoji}>{item.emoji}</Text>
          <View style={styles.textCol}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.vibe, { color: item.accentColor }]}>
              {item.vibe}
            </Text>
          </View>
        </View>
        <View style={styles.heatCol}>
          <Text style={[styles.heatScore, { color: item.accentColor }]}>
            {item.heatScore}
          </Text>
          <HeatBar score={item.heatScore} color={item.accentColor} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={trendingStyles}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>TRENDING</Text>
            <Text style={styles.subtitle}>
              Ranked by community heat score
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RTF_COLORS.bg,
  },
  list: {
    paddingBottom: RTF_SPACING.huge,
  },
  header: {
    paddingHorizontal: RTF_SPACING.lg,
    paddingTop: RTF_SPACING.xl,
    paddingBottom: RTF_SPACING.xxl,
  },
  title: {
    fontSize: RTF_SIZES.xxxl,
    color: RTF_COLORS.neon,
    ...RTF_FONTS.heading,
  },
  subtitle: {
    fontSize: RTF_SIZES.sm,
    color: RTF_COLORS.textMuted,
    marginTop: RTF_SPACING.xs,
    ...RTF_FONTS.body,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RTF_SPACING.lg,
    paddingVertical: RTF_SPACING.md,
    gap: RTF_SPACING.md,
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: RTF_SPACING.md,
  },
  emoji: {
    fontSize: 28,
  },
  textCol: {
    flex: 1,
  },
  name: {
    fontSize: RTF_SIZES.md,
    color: RTF_COLORS.textPrimary,
    ...RTF_FONTS.subheading,
  },
  vibe: {
    fontSize: RTF_SIZES.xs,
    textTransform: 'uppercase',
    marginTop: 2,
    ...RTF_FONTS.mono,
  },
  heatCol: {
    width: 80,
    alignItems: 'flex-end',
    gap: RTF_SPACING.xs,
  },
  heatScore: {
    fontSize: RTF_SIZES.lg,
    ...RTF_FONTS.heading,
  },
  separator: {
    height: 1,
    backgroundColor: RTF_COLORS.border,
    marginHorizontal: RTF_SPACING.lg,
  },
});
