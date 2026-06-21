import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RTFStackParamList } from '../../navigation/types';
import { RTF_COLORS, RTF_SPACING, RTF_SIZES, RTF_FONTS } from '../../constants/rtfTheme';
import { RTF_STYLES, RTF_CATEGORIES } from '../../data/rtfStyles';
import { StyleItem } from '../../types/rtf';
import StyleCard from '../../components/rtf/StyleCard';
import CategoryPills from '../../components/rtf/CategoryPills';

type Props = {
  navigation: NativeStackNavigationProp<RTFStackParamList, 'RTFBrowse'>;
};

export default function RTFBrowseScreen({ navigation }: Props) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredStyles = useMemo(() => {
    if (selectedCategory === 'All') return RTF_STYLES;
    return RTF_STYLES.filter((s) => s.category === selectedCategory);
  }, [selectedCategory]);

  const handleStylePress = (style: StyleItem) => {
    navigation.navigate('RTFDetail', { styleId: style.id });
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Logo / Title */}
      <View style={styles.titleRow}>
        <Text style={styles.logo}>RTF</Text>
        <Text style={styles.subtitle}>RATE THE FIT</Text>
      </View>
      <Text style={styles.tagline}>
        Discover trending styles. Rate the drip. Build your taste.
      </Text>

      {/* Category filter */}
      <CategoryPills
        categories={RTF_CATEGORIES}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Results count */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {filteredStyles.length} {filteredStyles.length === 1 ? 'style' : 'styles'}
        </Text>
        <Text style={styles.sortText}>Sorted by Heat</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={filteredStyles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StyleCard style={item} onPress={handleStylePress} />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
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
    paddingBottom: RTF_SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: RTF_SPACING.lg,
    gap: RTF_SPACING.md,
  },
  logo: {
    fontSize: RTF_SIZES.hero,
    color: RTF_COLORS.neon,
    ...RTF_FONTS.heading,
  },
  subtitle: {
    fontSize: RTF_SIZES.sm,
    color: RTF_COLORS.textMuted,
    ...RTF_FONTS.mono,
  },
  tagline: {
    fontSize: RTF_SIZES.md,
    color: RTF_COLORS.textSecondary,
    paddingHorizontal: RTF_SPACING.lg,
    marginTop: RTF_SPACING.sm,
    marginBottom: RTF_SPACING.lg,
    ...RTF_FONTS.body,
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: RTF_SPACING.lg,
    marginTop: RTF_SPACING.sm,
  },
  resultsText: {
    fontSize: RTF_SIZES.sm,
    color: RTF_COLORS.textSecondary,
    ...RTF_FONTS.body,
  },
  sortText: {
    fontSize: RTF_SIZES.sm,
    color: RTF_COLORS.textMuted,
    ...RTF_FONTS.mono,
  },
});
