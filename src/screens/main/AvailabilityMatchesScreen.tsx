import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../services/supabase';
import { useToast } from '../../contexts/ToastContext';

interface Match {
  availability_id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  available_date: string;
  start_time: string;
  end_time: string;
  preferred_location: string | null;
  notes: string | null;
  atp_rating: number | null;
}

export const AvailabilityMatchesScreen = ({ route, navigation }: any) => {
  const { date, startTime, endTime } = route.params;
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('find_availability_matches', {
        p_user_id: user.id,
        p_date: date,
        p_start_time: startTime,
        p_end_time: endTime,
      });

      if (error) throw error;
      setMatches(data || []);
    } catch (error: any) {
      console.error('Error loading matches:', error);
      showToast('Failed to load matches', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = async (matchUserId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's first group
      const { data: groups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .limit(1);

      if (!groups || groups.length === 0) {
        showToast('Join a group first', 'info');
        return;
      }

      // Create a session (game)
      const sessionDate = new Date(date + 'T' + startTime);

      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          group_id: groups[0].group_id,
          session_date: sessionDate.toISOString(),
          location: matches.find(m => m.user_id === matchUserId)?.preferred_location || 'TBD',
          max_players: 4,
          status: 'scheduled',
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Add both players as participants
      const { error: participantError } = await supabase
        .from('session_participants')
        .insert([
          { session_id: session.id, user_id: user.id, status: 'confirmed' },
          { session_id: session.id, user_id: matchUserId, status: 'pending' },
        ]);

      if (participantError) throw participantError;

      showToast('Game created!', 'success');
      navigation.navigate('SessionDetails', { sessionId: session.id });
    } catch (error: any) {
      console.error('Error creating game:', error);
      showToast(error.message || 'Failed to create game', 'error');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <Text style={styles.noRating}>Not rated</Text>;

    const stars = Math.round(rating);
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text key={star} style={styles.star}>
            {star <= stars ? '⭐' : '☆'}
          </Text>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Matches</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Available Players</Text>
      </View>

      <View style={styles.timeInfo}>
        <Text style={styles.timeInfoText}>
          {formatDate(date)}
        </Text>
        <Text style={styles.timeInfoTime}>
          {formatTime(startTime)} - {formatTime(endTime)}
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {matches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>😔</Text>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptyText}>
              No other players have posted this time slot.{'\n'}
              Check back later or try a different time!
            </Text>
          </View>
        ) : (
          matches.map((match) => (
            <View key={match.availability_id} style={styles.matchCard}>
              <View style={styles.matchHeader}>
                <View style={styles.matchUser}>
                  {match.avatar_url ? (
                    <Image source={{ uri: match.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarPlaceholderText}>
                        {(match.display_name || match.username).charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.matchUserInfo}>
                    <Text style={styles.matchName}>
                      {match.display_name || match.username}
                    </Text>
                    {renderStars(match.atp_rating)}
                  </View>
                </View>
              </View>

              <View style={styles.matchDetails}>
                <View style={styles.matchTime}>
                  <Text style={styles.detailIcon}>🕐</Text>
                  <Text style={styles.detailText}>
                    {formatTime(match.start_time)} - {formatTime(match.end_time)}
                  </Text>
                </View>

                {match.preferred_location && (
                  <View style={styles.matchDetail}>
                    <Text style={styles.detailIcon}>📍</Text>
                    <Text style={styles.detailText}>{match.preferred_location}</Text>
                  </View>
                )}

                {match.notes && (
                  <View style={styles.matchDetail}>
                    <Text style={styles.detailIcon}>💬</Text>
                    <Text style={styles.detailText}>{match.notes}</Text>
                  </View>
                )}
              </View>

              <View style={styles.matchActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.createGameButton]}
                  onPress={() => handleCreateGame(match.user_id)}
                >
                  <Text style={styles.createGameButtonText}>Create Game</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.messageButton]}
                  onPress={() => {
                    showToast('Messaging coming soon!', 'info');
                  }}
                >
                  <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#22c55e',
  },
  backButton: {
    marginBottom: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  timeInfo: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  timeInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  timeInfoTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  matchCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  matchHeader: {
    marginBottom: 12,
  },
  matchUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarPlaceholderText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  matchUserInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 14,
    marginRight: 2,
  },
  noRating: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  matchDetails: {
    marginBottom: 12,
  },
  matchTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
  matchActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  createGameButton: {
    backgroundColor: '#22c55e',
  },
  createGameButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  messageButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});
