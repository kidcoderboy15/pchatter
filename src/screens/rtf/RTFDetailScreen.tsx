import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RTFStackParamList } from '../../navigation/types';
import { RTF_COLORS, RTF_SPACING, RTF_SIZES, RTF_RADIUS, RTF_FONTS } from '../../constants/rtfTheme';
import { RTF_STYLES } from '../../data/rtfStyles';
import { RatingEmoji, RATING_CONFIG } from '../../types/rtf';
import HeatBar from '../../components/rtf/HeatBar';
import RatingButtons from '../../components/rtf/RatingButtons';

type Props = {
  navigation: NativeStackNavigationProp<RTFStackParamList, 'RTFDetail'>;
  route: RouteProp<RTFStackParamList, 'RTFDetail'>;
};

export default function RTFDetailScreen({ navigation, route }: Props) {
  const { styleId } = route.params;
  const style = RTF_STYLES.find((s) => s.id === styleId);
  const [userRating, setUserRating] = useState<RatingEmoji | null>(null);

  if (!style) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Style not found</Text>
      </SafeAreaView>
    );
  }

  const handleRate = (rating: RatingEmoji) => {
    setUserRating(rating);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>{'<'} Back</Text>
        </TouchableOpacity>

        {/* Hero section */}
        <View style={[styles.hero, { backgroundColor: style.cardColor }]}>
          <Text style={styles.heroEmoji}>{style.emoji}</Text>
          <Text style={styles.heroName}>{style.name}</Text>
          <Text style={[styles.heroVibe, { color: style.accentColor }]}>
            {style.vibe}
          </Text>

          {/* Heat score */}
          <View style={styles.heatSection}>
            <View style={styles.heatHeader}>
              <Text style={styles.heatLabel}>HEAT SCORE</Text>
              <Text style={[styles.heatValue, { color: style.accentColor }]}>
                {style.heatScore}/100
              </Text>
            </View>
            <HeatBar score={style.heatScore} color={style.accentColor} />
          </View>

          {/* Price */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>PRICE RANGE</Text>
              <Text style={styles.metaValue}>{style.priceRange}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>CATEGORY</Text>
              <Text style={styles.metaValue}>{style.category}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THE VIBE</Text>
          <Text style={styles.description}>{style.description}</Text>
        </View>

        {/* Pro Tip */}
        <View style={[styles.section, styles.proTipSection]}>
          <Text style={styles.proTipLabel}>PRO TIP</Text>
          <Text style={styles.proTipText}>{style.proTip}</Text>
        </View>

        {/* Celeb associations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WHO ROCKS IT</Text>
          <View style={styles.celebRow}>
            {style.celebs.map((celeb) => (
              <View key={celeb} style={styles.celebChip}>
                <Text style={styles.celebText}>{celeb}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TAGS</Text>
          <View style={styles.tagRow}>
            {style.tags.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Rating section */}
        <RatingButtons selected={userRating} onRate={handleRate} />

        {/* Rating feedback */}
        {userRating && (
          <View style={styles.ratingFeedback}>
            <Text style={styles.ratingFeedbackEmoji}>
              {RATING_CONFIG[userRating].emoji}
            </Text>
            <Text style={styles.ratingFeedbackText}>
              You rated this fit{' '}
              <Text style={{ color: RATING_CONFIG[userRating].color }}>
                {RATING_CONFIG[userRating].label}
              </Text>
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RTF_COLORS.bg,
  },
  scroll: {
    paddingBottom: RTF_SPACING.huge,
  },
  backButton: {
    paddingHorizontal: RTF_SPACING.lg,
    paddingVertical: RTF_SPACING.md,
  },
  backText: {
    color: RTF_COLORS.neon,
    fontSize: RTF_SIZES.md,
    ...RTF_FONTS.subheading,
  },
  errorText: {
    color: RTF_COLORS.textPrimary,
    fontSize: RTF_SIZES.lg,
    textAlign: 'center',
    marginTop: RTF_SPACING.huge,
  },
  hero: {
    marginHorizontal: RTF_SPACING.lg,
    borderRadius: RTF_RADIUS.xl,
    padding: RTF_SPACING.xxl,
    borderWidth: 1,
    borderColor: RTF_COLORS.border,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: RTF_SPACING.md,
  },
  heroName: {
    fontSize: RTF_SIZES.display,
    color: RTF_COLORS.textPrimary,
    marginBottom: RTF_SPACING.xs,
    ...RTF_FONTS.heading,
  },
  heroVibe: {
    fontSize: RTF_SIZES.md,
    textTransform: 'uppercase',
    marginBottom: RTF_SPACING.xxl,
    ...RTF_FONTS.mono,
  },
  heatSection: {
    marginBottom: RTF_SPACING.xl,
  },
  heatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: RTF_SPACING.sm,
  },
  heatLabel: {
    fontSize: RTF_SIZES.xs,
    color: RTF_COLORS.textMuted,
    ...RTF_FONTS.mono,
  },
  heatValue: {
    fontSize: RTF_SIZES.lg,
    ...RTF_FONTS.heading,
  },
  metaRow: {
    flexDirection: 'row',
    gap: RTF_SPACING.xl,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: RTF_SIZES.xs,
    color: RTF_COLORS.textMuted,
    marginBottom: RTF_SPACING.xs,
    ...RTF_FONTS.mono,
  },
  metaValue: {
    fontSize: RTF_SIZES.lg,
    color: RTF_COLORS.textPrimary,
    ...RTF_FONTS.subheading,
  },
  section: {
    paddingHorizontal: RTF_SPACING.lg,
    marginTop: RTF_SPACING.xxl,
  },
  sectionTitle: {
    fontSize: RTF_SIZES.sm,
    color: RTF_COLORS.textMuted,
    marginBottom: RTF_SPACING.md,
    ...RTF_FONTS.mono,
  },
  description: {
    fontSize: RTF_SIZES.lg,
    color: RTF_COLORS.textPrimary,
    lineHeight: 26,
    ...RTF_FONTS.body,
  },
  proTipSection: {
    backgroundColor: RTF_COLORS.bgCard,
    marginHorizontal: RTF_SPACING.lg,
    borderRadius: RTF_RADIUS.lg,
    padding: RTF_SPACING.xl,
    borderLeftWidth: 3,
    borderLeftColor: RTF_COLORS.neon,
  },
  proTipLabel: {
    fontSize: RTF_SIZES.xs,
    color: RTF_COLORS.neon,
    marginBottom: RTF_SPACING.sm,
    ...RTF_FONTS.mono,
  },
  proTipText: {
    fontSize: RTF_SIZES.md,
    color: RTF_COLORS.textSecondary,
    lineHeight: 22,
    ...RTF_FONTS.body,
  },
  celebRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: RTF_SPACING.sm,
  },
  celebChip: {
    backgroundColor: RTF_COLORS.bgElevated,
    paddingHorizontal: RTF_SPACING.lg,
    paddingVertical: RTF_SPACING.sm,
    borderRadius: RTF_RADIUS.pill,
    borderWidth: 1,
    borderColor: RTF_COLORS.borderLight,
  },
  celebText: {
    color: RTF_COLORS.textPrimary,
    fontSize: RTF_SIZES.sm,
    ...RTF_FONTS.body,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: RTF_SPACING.sm,
  },
  tagChip: {
    backgroundColor: RTF_COLORS.bgElevated,
    paddingHorizontal: RTF_SPACING.md,
    paddingVertical: RTF_SPACING.xs,
    borderRadius: RTF_RADIUS.pill,
  },
  tagText: {
    color: RTF_COLORS.textSecondary,
    fontSize: RTF_SIZES.sm,
    ...RTF_FONTS.body,
  },
  ratingFeedback: {
    alignItems: 'center',
    paddingVertical: RTF_SPACING.xl,
  },
  ratingFeedbackEmoji: {
    fontSize: 48,
    marginBottom: RTF_SPACING.sm,
  },
  ratingFeedbackText: {
    fontSize: RTF_SIZES.lg,
    color: RTF_COLORS.textSecondary,
    ...RTF_FONTS.body,
  },
});
