import React, { useState } from 'react';
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
import { RatingEmoji, RATING_CONFIG, StyleRating } from '../../types/rtf';

type Props = {
  navigation: NativeStackNavigationProp<RTFStackParamList, 'RTFProfile'>;
};

// Mock user ratings for demo
const MOCK_RATINGS: StyleRating[] = [
  { id: '1', userId: 'user1', styleId: 'style-001', rating: 'FIRE', createdAt: '2026-03-27' },
  { id: '2', userId: 'user1', styleId: 'style-004', rating: 'GRAIL', createdAt: '2026-03-26' },
  { id: '3', userId: 'user1', styleId: 'style-002', rating: 'FIRE', createdAt: '2026-03-25' },
  { id: '4', userId: 'user1', styleId: 'style-005', rating: 'DEAD', createdAt: '2026-03-24' },
  { id: '5', userId: 'user1', styleId: 'style-012', rating: 'TRASH', createdAt: '2026-03-23' },
];

export default function RTFProfileScreen({ navigation }: Props) {
  const [ratings] = useState<StyleRating[]>(MOCK_RATINGS);

  // Stats
  const ratingCounts: Record<RatingEmoji, number> = {
    FIRE: 0, GRAIL: 0, DEAD: 0, MID: 0, TRASH: 0,
  };
  ratings.forEach((r) => {
    ratingCounts[r.rating]++;
  });

  const renderRatingItem = ({ item }: { item: StyleRating }) => {
    const style = RTF_STYLES.find((s) => s.id === item.styleId);
    if (!style) return null;
    const config = RATING_CONFIG[item.rating];

    return (
      <TouchableOpacity
        style={styles.ratingRow}
        onPress={() => navigation.navigate('RTFDetail', { styleId: item.styleId })}
        activeOpacity={0.7}
      >
        <Text style={styles.ratingEmoji}>{style.emoji}</Text>
        <View style={styles.ratingInfo}>
          <Text style={styles.ratingName}>{style.name}</Text>
          <Text style={[styles.ratingVibe, { color: style.accentColor }]}>
            {style.vibe}
          </Text>
        </View>
        <View style={[styles.ratingBadge, { backgroundColor: config.color }]}>
          <Text style={styles.ratingBadgeEmoji}>{config.emoji}</Text>
          <Text style={styles.ratingBadgeText}>{config.label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Profile header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>RTF</Text>
        </View>
        <Text style={styles.username}>Your Style Profile</Text>
        <Text style={styles.bio}>
          {ratings.length} fits rated
        </Text>
      </View>

      {/* Rating breakdown */}
      <View style={styles.statsGrid}>
        {(Object.keys(ratingCounts) as RatingEmoji[]).map((key) => {
          const config = RATING_CONFIG[key];
          return (
            <View key={key} style={styles.statItem}>
              <Text style={styles.statEmoji}>{config.emoji}</Text>
              <Text style={[styles.statCount, { color: config.color }]}>
                {ratingCounts[key]}
              </Text>
              <Text style={styles.statLabel}>{config.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Section title */}
      <Text style={styles.sectionTitle}>YOUR RATINGS</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={ratings}
        keyExtractor={(item) => item.id}
        renderItem={renderRatingItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👀</Text>
            <Text style={styles.emptyText}>No ratings yet</Text>
            <Text style={styles.emptySubtext}>
              Start browsing and rate some fits!
            </Text>
          </View>
        }
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
  headerContainer: {
    paddingTop: RTF_SPACING.xl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingBottom: RTF_SPACING.xxl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: RTF_COLORS.neon,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RTF_SPACING.md,
  },
  avatarText: {
    fontSize: RTF_SIZES.xl,
    color: RTF_COLORS.bg,
    ...RTF_FONTS.heading,
  },
  username: {
    fontSize: RTF_SIZES.xxl,
    color: RTF_COLORS.textPrimary,
    ...RTF_FONTS.heading,
  },
  bio: {
    fontSize: RTF_SIZES.sm,
    color: RTF_COLORS.textMuted,
    marginTop: RTF_SPACING.xs,
    ...RTF_FONTS.body,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: RTF_SPACING.lg,
    paddingVertical: RTF_SPACING.xl,
    marginHorizontal: RTF_SPACING.lg,
    backgroundColor: RTF_COLORS.bgCard,
    borderRadius: RTF_RADIUS.lg,
    borderWidth: 1,
    borderColor: RTF_COLORS.border,
    marginBottom: RTF_SPACING.xxl,
  },
  statItem: {
    alignItems: 'center',
    gap: RTF_SPACING.xs,
  },
  statEmoji: {
    fontSize: 24,
  },
  statCount: {
    fontSize: RTF_SIZES.xl,
    ...RTF_FONTS.heading,
  },
  statLabel: {
    fontSize: RTF_SIZES.xs,
    color: RTF_COLORS.textMuted,
    ...RTF_FONTS.mono,
  },
  sectionTitle: {
    fontSize: RTF_SIZES.sm,
    color: RTF_COLORS.textMuted,
    paddingHorizontal: RTF_SPACING.lg,
    marginBottom: RTF_SPACING.md,
    ...RTF_FONTS.mono,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RTF_SPACING.lg,
    paddingVertical: RTF_SPACING.md,
    gap: RTF_SPACING.md,
  },
  ratingEmoji: {
    fontSize: 32,
  },
  ratingInfo: {
    flex: 1,
  },
  ratingName: {
    fontSize: RTF_SIZES.md,
    color: RTF_COLORS.textPrimary,
    ...RTF_FONTS.subheading,
  },
  ratingVibe: {
    fontSize: RTF_SIZES.xs,
    textTransform: 'uppercase',
    marginTop: 2,
    ...RTF_FONTS.mono,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RTF_SPACING.md,
    paddingVertical: RTF_SPACING.xs,
    borderRadius: RTF_RADIUS.pill,
    gap: RTF_SPACING.xs,
  },
  ratingBadgeEmoji: {
    fontSize: 14,
  },
  ratingBadgeText: {
    fontSize: RTF_SIZES.xs,
    color: '#FFFFFF',
    ...RTF_FONTS.mono,
  },
  separator: {
    height: 1,
    backgroundColor: RTF_COLORS.border,
    marginHorizontal: RTF_SPACING.lg,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: RTF_SPACING.huge,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: RTF_SPACING.md,
  },
  emptyText: {
    fontSize: RTF_SIZES.xl,
    color: RTF_COLORS.textPrimary,
    ...RTF_FONTS.heading,
  },
  emptySubtext: {
    fontSize: RTF_SIZES.md,
    color: RTF_COLORS.textMuted,
    marginTop: RTF_SPACING.xs,
    ...RTF_FONTS.body,
  },
});
