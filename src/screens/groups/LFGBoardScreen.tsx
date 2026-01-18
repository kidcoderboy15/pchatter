import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { GroupsStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';
import { matchingService } from '../../services/matchingService';
import { viralService } from '../../services/viralService';

type LFGBoardScreenProps = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'LFGBoard'>;
  route: RouteProp<GroupsStackParamList, 'LFGBoard'>;
};

interface LFGPost {
  id: string;
  created_by: string;
  creator_username?: string;
  creator_level?: number;
  format: string;
  slots_total: number;
  slots_filled: number;
  skill_min: number;
  skill_max: number;
  location_name: string;
  notes: string;
  status: string;
  time_options: Array<{ id: string; start_at: string }>;
  claims: Array<{ user_id: string; username?: string }>;
  compatibility_score?: number;
}

export default function LFGBoardScreen({ navigation, route }: LFGBoardScreenProps) {
  const { groupId } = route.params;
  const [posts, setPosts] = useState<LFGPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'now' | 'today' | 'week'>('all');

  useEffect(() => {
    loadPosts();
  }, [groupId, filter]);

  const loadPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's profile for matching
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      // Load open LFG posts
      let query = supabase
        .from('lfg_posts')
        .select(`
          *,
          users!lfg_posts_created_by_fkey(username, self_level),
          lfg_time_options(*),
          lfg_claims(user_id, users(username))
        `)
        .eq('group_id', groupId)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      // Apply time filters
      const now = new Date();
      if (filter === 'now') {
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        query = query.lte('lfg_time_options.start_at', oneHourFromNow.toISOString());
      } else if (filter === 'today') {
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('lfg_time_options.start_at', endOfDay.toISOString());
      } else if (filter === 'week') {
        const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        query = query.lte('lfg_time_options.start_at', endOfWeek.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform and score posts
      const transformedPosts: LFGPost[] = (data || []).map((post: any) => ({
        id: post.id,
        created_by: post.created_by,
        creator_username: post.users?.username,
        creator_level: post.users?.self_level,
        format: post.format,
        slots_total: post.slots_total,
        slots_filled: post.slots_filled,
        skill_min: post.skill_min,
        skill_max: post.skill_max,
        location_name: post.location_name,
        notes: post.notes,
        status: post.status,
        time_options: post.lfg_time_options || [],
        claims: post.lfg_claims || [],
        compatibility_score: profile ? matchingService.scoreCompatibility(profile, post) : 0,
      }));

      // Sort by compatibility score (highest first)
      transformedPosts.sort((a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0));

      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error loading LFG posts:', error);
      Alert.alert('Error', 'Failed to load games');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleJoinPost = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if already joined
      const post = posts.find(p => p.id === postId);
      if (post?.claims.some(c => c.user_id === user.id)) {
        Alert.alert('Already Joined', 'You\'ve already claimed a spot in this game');
        return;
      }

      // Check if full
      if (post && post.slots_filled >= post.slots_total) {
        Alert.alert('Full', 'This game is already full');
        return;
      }

      // Create claim
      const { error: claimError } = await supabase
        .from('lfg_claims')
        .insert({
          lfg_post_id: postId,
          user_id: user.id,
          status: 'joined',
          selected_time_option_id: post?.time_options[0]?.id, // Default to first option
        });

      if (claimError) throw claimError;

      // Update slots filled
      const newSlotsFilled = (post?.slots_filled || 0) + 1;
      const { error: updateError } = await supabase
        .from('lfg_posts')
        .update({ slots_filled: newSlotsFilled })
        .eq('id', postId);

      if (updateError) throw updateError;

      // Check if full - create session if so
      if (newSlotsFilled >= (post?.slots_total || 4)) {
        await viralService.haptic('success');
        await matchingService.createSessionFromLFG(postId);
        Alert.alert('Game On! 🎾', 'Session created! Check your upcoming games.');
      } else {
        await viralService.haptic('medium');
        Alert.alert('Joined! 🎾', `You're in! ${(post?.slots_total || 4) - newSlotsFilled} spots left.`);
      }

      loadPosts(); // Refresh
    } catch (error: any) {
      console.error('Error joining game:', error);
      Alert.alert('Error', error.message || 'Failed to join game');
    }
  };

  const formatTimeOptions = (options: Array<{ start_at: string }>) => {
    if (!options || options.length === 0) return 'TBD';
    if (options.length === 1) {
      return new Date(options[0].start_at).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
    return `${options.length} time options`;
  };

  const renderPost = ({ item }: { item: LFGPost }) => {
    const spotsLeft = item.slots_total - item.slots_filled;
    const matchScore = Math.round((item.compatibility_score || 0) * 100);

    return (
      <View style={styles.postCard}>
        {/* Match score badge */}
        {matchScore > 70 && (
          <View style={styles.matchBadge}>
            <Text style={styles.matchBadgeText}>{matchScore}% Match</Text>
          </View>
        )}

        <View style={styles.postHeader}>
          <Text style={styles.creatorName}>{item.creator_username || 'Unknown'}</Text>
          <Text style={styles.creatorLevel}>Level {item.creator_level || '?'}</Text>
        </View>

        <View style={styles.postDetails}>
          <Text style={styles.format}>{item.format.toUpperCase()}</Text>
          <Text style={styles.skillRange}>
            Skill {item.skill_min}-{item.skill_max}
          </Text>
        </View>

        <Text style={styles.location}>📍 {item.location_name}</Text>
        <Text style={styles.time}>🕐 {formatTimeOptions(item.time_options)}</Text>

        {item.notes && <Text style={styles.notes}>{item.notes}</Text>}

        <View style={styles.postFooter}>
          <Text style={styles.slots}>
            {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
          </Text>
          <TouchableOpacity
            style={[styles.joinButton, spotsLeft === 0 && styles.joinButtonDisabled]}
            onPress={() => handleJoinPost(item.id)}
            disabled={spotsLeft === 0}
          >
            <Text style={styles.joinButtonText}>
              {spotsLeft === 0 ? 'FULL' : 'JOIN'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'now', 'today', 'week'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f === 'all' ? 'All' : f === 'now' ? 'Next Hour' : f === 'today' ? 'Today' : 'This Week'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🎾</Text>
              <Text style={styles.emptyText}>No games yet</Text>
              <Text style={styles.emptySubtext}>
                {filter === 'all'
                  ? 'Be the first to organize a game!'
                  : 'Try a different time filter or create a new game'}
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={async () => {
                  await viralService.haptic('medium');
                  navigation.navigate('CreateLFG', { groupId });
                }}
              >
                <Text style={styles.emptyButtonText}>📅 Create New Game</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPosts(); }} />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  filterTabs: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#22c55e',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  matchBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  creatorLevel: {
    fontSize: 14,
    color: '#6b7280',
  },
  postDetails: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  format: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
  skillRange: {
    fontSize: 14,
    color: '#6b7280',
  },
  location: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  notes: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  slots: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  joinButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  joinButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  empty: {
    paddingVertical: 64,
    paddingHorizontal: 32,
    alignItems: 'center',
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
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
