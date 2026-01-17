import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';
import { rewardService } from '../../services/rewardService';
import { viralService } from '../../services/viralService';

type RatePlayersScreenProps = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'RatePlayers'>;
  route: RouteProp<HomeStackParamList, 'RatePlayers'>;
};

interface Player {
  id: string;
  username: string;
  self_level: number;
  team: number;
}

interface Rating {
  userId: string;
  skillLevel: number | null;
  sportsmanship: number | null;
}

export default function RatePlayersScreen({ navigation, route }: RatePlayersScreenProps) {
  const { sessionId, resultId, isPickle, hadATP } = route.params;
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, [sessionId]);

  const loadPlayers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      const { data } = await supabase
        .from('session_participants')
        .select('user_id, team, users(id, username, self_level)')
        .eq('session_id', sessionId)
        .neq('user_id', user.id); // Exclude current user

      if (data) {
        const playersList: Player[] = data.map((p: any) => ({
          id: p.users.id,
          username: p.users.username,
          self_level: p.users.self_level,
          team: p.team,
        }));
        setPlayers(playersList);

        // Initialize ratings
        const initialRatings: Record<string, Rating> = {};
        playersList.forEach(player => {
          initialRatings[player.id] = {
            userId: player.id,
            skillLevel: null,
            sportsmanship: 3, // Default to neutral
          };
        });
        setRatings(initialRatings);
      }
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const setSkillRating = async (userId: string, level: number) => {
    await viralService.haptic('light');
    setRatings(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        skillLevel: level,
      },
    }));
  };

  const setSportsmanshipRating = async (userId: string, level: number) => {
    await viralService.haptic('light');
    setRatings(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        sportsmanship: level,
      },
    }));
  };

  const handleSubmit = async () => {
    // Validate all players have skill ratings
    const allRated = Object.values(ratings).every(r => r.skillLevel !== null);
    if (!allRated) {
      Alert.alert('Missing Ratings', 'Please rate all players\' skill levels');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Insert all ratings
      const ratingInserts = Object.values(ratings).map(rating => ({
        session_id: sessionId,
        rater_id: user.id,
        rated_user_id: rating.userId,
        skill_level: rating.skillLevel,
        sportsmanship: rating.sportsmanship,
      }));

      const { error } = await supabase
        .from('peer_ratings')
        .insert(ratingInserts);

      if (error) throw error;

      // Award quick confirm bonus if within 1 hour
      await rewardService.awardConfirmationTokens(user.id, resultId);

      // Celebrate with haptic
      await viralService.haptic('success');

      // Show success message
      const celebrationMessage = isPickle
        ? '🥒 Ratings submitted! That pickle was legendary!'
        : hadATP
        ? '🎯 Ratings submitted! That ATP shot was epic!'
        : '🎾 Ratings submitted! Thanks for playing!';

      Alert.alert(
        'Thanks!',
        celebrationMessage,
        [
          {
            text: 'Done',
            onPress: () => navigation.navigate('HomeScreen'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting ratings:', error);
      Alert.alert('Error', error.message || 'Failed to submit ratings');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Ratings?',
      'Rating players helps improve matchmaking. Are you sure?',
      [
        { text: 'Go Back', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => navigation.navigate('HomeScreen'),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rate Your Opponents</Text>
        <Text style={styles.subtitle}>
          Help build better matches - rate the players you just played with
        </Text>
      </View>

      {players.map((player) => (
        <View key={player.id} style={styles.playerCard}>
          <View style={styles.playerHeader}>
            <Text style={styles.playerName}>{player.username}</Text>
            <Text style={styles.playerLevel}>
              Self-rated: {player.self_level}
            </Text>
          </View>

          {/* Skill rating */}
          <Text style={styles.ratingLabel}>Skill Level (1-6)</Text>
          <View style={styles.ratingButtons}>
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.ratingButton,
                  ratings[player.id]?.skillLevel === level && styles.ratingButtonSelected,
                ]}
                onPress={() => setSkillRating(player.id, level)}
              >
                <Text
                  style={[
                    styles.ratingButtonText,
                    ratings[player.id]?.skillLevel === level && styles.ratingButtonTextSelected,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sportsmanship rating */}
          <Text style={styles.ratingLabel}>Sportsmanship</Text>
          <View style={styles.sportsmanshipButtons}>
            {[
              { value: 1, label: '😡' },
              { value: 2, label: '😐' },
              { value: 3, label: '😊' },
              { value: 4, label: '😄' },
              { value: 5, label: '🤩' },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.sportsmanshipButton,
                  ratings[player.id]?.sportsmanship === item.value &&
                    styles.sportsmanshipButtonSelected,
                ]}
                onPress={() => setSportsmanshipRating(player.id, item.value)}
              >
                <Text style={styles.sportsmanshipEmoji}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Submitting...' : 'Submit Ratings'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipButtonText}>Skip for now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  playerCard: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  playerLevel: {
    fontSize: 14,
    color: '#6b7280',
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  ratingButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ratingButtonSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#16a34a',
  },
  ratingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  ratingButtonTextSelected: {
    color: '#fff',
  },
  sportsmanshipButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sportsmanshipButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sportsmanshipButtonSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  sportsmanshipEmoji: {
    fontSize: 24,
  },
  submitButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#22c55e',
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
});
