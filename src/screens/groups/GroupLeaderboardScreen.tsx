import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { GroupsStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';
import { viralService } from '../../services/viralService';

type GroupLeaderboardScreenProps = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'GroupLeaderboard'>;
  route: RouteProp<GroupsStackParamList, 'GroupLeaderboard'>;
};

type LeaderboardCategory = 'games' | 'wins' | 'pickles' | 'aces' | 'show_rate';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  games_played: number;
  games_won: number;
  pickle_trophies: number;
  total_aces: number;
  show_rate: number;
  win_rate: number;
}

export default function GroupLeaderboardScreen({ navigation, route }: GroupLeaderboardScreenProps) {
  const { groupId } = route.params;
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [category, setCategory] = useState<LeaderboardCategory>('games');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [groupId, category]);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('group_member_stats')
        .select(`
          user_id,
          games_played,
          games_won,
          pickle_trophies,
          total_aces,
          show_rate,
          users!inner(username)
        `)
        .eq('group_id', groupId)
        .gte('games_played', 1); // Only show members who've played at least once

      if (error) throw error;

      const entries: LeaderboardEntry[] = (data || []).map((entry: any) => ({
        user_id: entry.user_id,
        username: entry.users.username,
        games_played: entry.games_played,
        games_won: entry.games_won,
        pickle_trophies: entry.pickle_trophies,
        total_aces: entry.total_aces,
        show_rate: entry.show_rate,
        win_rate: entry.games_played > 0 ? entry.games_won / entry.games_played : 0,
      }));

      // Sort based on category
      entries.sort((a, b) => {
        switch (category) {
          case 'games':
            return b.games_played - a.games_played;
          case 'wins':
            return b.games_won - a.games_won || b.win_rate - a.win_rate;
          case 'pickles':
            return b.pickle_trophies - a.pickle_trophies;
          case 'aces':
            return b.total_aces - a.total_aces;
          case 'show_rate':
            return b.show_rate - a.show_rate;
          default:
            return 0;
        }
      });

      setLeaderboard(entries);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const handleCategoryChange = async (newCategory: LeaderboardCategory) => {
    await viralService.haptic('light');
    setCategory(newCategory);
  };

  const getCategoryValue = (entry: LeaderboardEntry): string => {
    switch (category) {
      case 'games':
        return entry.games_played.toString();
      case 'wins':
        return `${entry.games_won} (${(entry.win_rate * 100).toFixed(0)}%)`;
      case 'pickles':
        return entry.pickle_trophies.toString();
      case 'aces':
        return entry.total_aces.toString();
      case 'show_rate':
        return `${(entry.show_rate * 100).toFixed(0)}%`;
      default:
        return '0';
    }
  };

  const getCategoryLabel = (): string => {
    switch (category) {
      case 'games':
        return 'Games Played';
      case 'wins':
        return 'Wins';
      case 'pickles':
        return 'Pickle Trophies';
      case 'aces':
        return 'Aces Served';
      case 'show_rate':
        return 'Show Rate';
      default:
        return '';
    }
  };

  const getMedalEmoji = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

  const renderLeaderboardEntry = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rank = index + 1;
    const medal = getMedalEmoji(rank);

    return (
      <View style={[styles.entryCard, rank <= 3 && styles.topThree]}>
        <View style={styles.rankColumn}>
          <Text style={styles.rankText}>
            {medal || `#${rank}`}
          </Text>
        </View>
        <View style={styles.userColumn}>
          <Text style={styles.username}>{item.username}</Text>
          <View style={styles.stats}>
            <Text style={styles.statText}>
              {item.games_played} games • {(item.win_rate * 100).toFixed(0)}% wins
            </Text>
          </View>
        </View>
        <View style={styles.valueColumn}>
          <Text style={styles.value}>{getCategoryValue(item)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Group Leaderboard</Text>
        <Text style={styles.subtitle}>Top performers in this group</Text>
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {[
          { key: 'games', label: '🎮 Games', emoji: '🎮' },
          { key: 'wins', label: '🏆 Wins', emoji: '🏆' },
          { key: 'pickles', label: '🥒 Pickles', emoji: '🥒' },
          { key: 'aces', label: '🎾 Aces', emoji: '🎾' },
          { key: 'show_rate', label: '⏰ Show Rate', emoji: '⏰' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, category === tab.key && styles.tabActive]}
            onPress={() => handleCategoryChange(tab.key as LeaderboardCategory)}
          >
            <Text style={[styles.tabText, category === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.user_id}
        renderItem={renderLeaderboardEntry}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🏆</Text>
              <Text style={styles.emptyText}>No stats yet</Text>
              <Text style={styles.emptySubtext}>
                Play some games to populate the leaderboard!
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabsContent: {
    padding: 12,
    gap: 8,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#22c55e',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  topThree: {
    borderWidth: 2,
    borderColor: '#fbbf24',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rankColumn: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  userColumn: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  stats: {
    flexDirection: 'row',
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
  },
  valueColumn: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
