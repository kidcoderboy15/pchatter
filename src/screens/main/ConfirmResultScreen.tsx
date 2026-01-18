import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';
import { viralService } from '../../services/viralService';
import { useToast } from '../../context/ToastContext';

type ConfirmResultScreenProps = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'ConfirmResult'>;
  route: RouteProp<HomeStackParamList, 'ConfirmResult'>;
};

interface PendingResult {
  id: string;
  session_id: string;
  team1_score: number;
  team2_score: number;
  is_pickle: boolean;
  had_atp: boolean;
  created_by: string;
  created_at: string;
  creator_name: string;
  location: string;
  needs_confirmation: boolean;
  confirmed_by: string[];
  game_results: {
    user_id: string;
    username: string;
    aces: number;
    nasty_nates: number;
    pegs: number;
    team: number;
  }[];
}

export default function ConfirmResultScreen({ navigation, route }: ConfirmResultScreenProps) {
  const { resultId } = route.params;
  const { showToast } = useToast();
  const [result, setResult] = useState<PendingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadResult();
  }, [resultId]);

  const loadResult = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Get match result with creator info and stats
      const { data: matchData, error: matchError } = await supabase
        .from('match_results')
        .select(`
          *,
          creator:users!created_by(username),
          sessions!inner(location_name)
        `)
        .eq('id', resultId)
        .single();

      if (matchError) throw matchError;

      // Get per-player stats
      const { data: statsData, error: statsError } = await supabase
        .from('game_results')
        .select(`
          user_id,
          aces,
          nasty_nates,
          pegs,
          team,
          users!inner(username)
        `)
        .eq('match_result_id', resultId);

      if (statsError) throw statsError;

      const pendingResult: PendingResult = {
        id: matchData.id,
        session_id: matchData.session_id,
        team1_score: matchData.team1_score,
        team2_score: matchData.team2_score,
        is_pickle: matchData.is_pickle,
        had_atp: matchData.had_atp,
        created_by: matchData.created_by,
        created_at: matchData.created_at,
        creator_name: matchData.creator.username,
        location: matchData.sessions.location_name,
        needs_confirmation: matchData.needs_confirmation,
        confirmed_by: matchData.confirmed_by || [],
        game_results: statsData.map((s: any) => ({
          user_id: s.user_id,
          username: s.users.username,
          aces: s.aces,
          nasty_nates: s.nasty_nates,
          pegs: s.pegs,
          team: s.team,
        })),
      };

      setResult(pendingResult);
    } catch (error: any) {
      console.error('Error loading result:', error);
      showToast('Failed to load result', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleConfirm = async () => {
    if (!currentUserId || !result) return;

    await viralService.haptic('success');

    try {
      // Add user to confirmed_by array
      const updatedConfirmedBy = [...result.confirmed_by, currentUserId];

      await supabase
        .from('match_results')
        .update({
          confirmed_by: updatedConfirmedBy,
          needs_confirmation: false, // Mark as not needing confirmation once anyone confirms
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', resultId);

      // Create confirmation record
      await supabase.from('result_confirmations').insert({
        match_result_id: resultId,
        user_id: currentUserId,
        status: 'confirmed',
      });

      showToast('Result confirmed!', 'success');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error confirming result:', error);
      showToast('Failed to confirm result', 'error');
    }
  };

  const handleDispute = async () => {
    if (!currentUserId) return;

    await viralService.haptic('warning');

    try {
      await supabase.from('result_confirmations').insert({
        match_result_id: resultId,
        user_id: currentUserId,
        status: 'disputed',
      });

      showToast('Result disputed. Please discuss with your group!', 'info');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error disputing result:', error);
      showToast('Failed to dispute result', 'error');
    }
  };

  if (loading || !result) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const team1Players = result.game_results.filter(p => p.team === 1);
  const team2Players = result.game_results.filter(p => p.team === 2);
  const alreadyConfirmed = result.confirmed_by.includes(currentUserId || '');

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadResult(); }} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Confirm Result</Text>
        <Text style={styles.subtitle}>@ {result.location}</Text>
        <Text style={styles.submittedBy}>Submitted by {result.creator_name}</Text>
      </View>

      {/* Score display */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreDisplay}>
          <View style={styles.teamScoreSection}>
            <Text style={styles.teamLabel}>Team 1</Text>
            <Text style={styles.teamScore}>{result.team1_score}</Text>
          </View>
          <Text style={styles.scoreDivider}>-</Text>
          <View style={styles.teamScoreSection}>
            <Text style={styles.teamLabel}>Team 2</Text>
            <Text style={styles.teamScore}>{result.team2_score}</Text>
          </View>
        </View>

        {result.is_pickle && (
          <View style={styles.pickleBadge}>
            <Text style={styles.pickleBadgeText}>🥒 PICKLE! 11-0</Text>
          </View>
        )}
        {result.had_atp && (
          <View style={styles.atpBadge}>
            <Text style={styles.atpBadgeText}>🎯 ATP Shot!</Text>
          </View>
        )}
      </View>

      {/* Player stats */}
      <View style={styles.statsSection}>
        <Text style={styles.statsSectionTitle}>Player Stats</Text>

        <View style={styles.teamsRow}>
          <View style={styles.teamColumn}>
            <Text style={styles.teamColumnLabel}>Team 1</Text>
            {team1Players.map(player => (
              <View key={player.user_id} style={styles.playerStatsRow}>
                <Text style={styles.playerName}>{player.username}</Text>
                {player.aces > 0 && <Text style={styles.statBadge}>🎾 {player.aces}</Text>}
                {player.nasty_nates > 0 && <Text style={styles.statBadge}>🔥 {player.nasty_nates}</Text>}
                {player.pegs > 0 && <Text style={styles.statBadge}>💥 {player.pegs}</Text>}
              </View>
            ))}
          </View>

          <View style={styles.teamColumn}>
            <Text style={styles.teamColumnLabel}>Team 2</Text>
            {team2Players.map(player => (
              <View key={player.user_id} style={styles.playerStatsRow}>
                <Text style={styles.playerName}>{player.username}</Text>
                {player.aces > 0 && <Text style={styles.statBadge}>🎾 {player.aces}</Text>}
                {player.nasty_nates > 0 && <Text style={styles.statBadge}>🔥 {player.nasty_nates}</Text>}
                {player.pegs > 0 && <Text style={styles.statBadge}>💥 {player.pegs}</Text>}
              </View>
            ))}
          </View>
        </View>
      </View>

      {alreadyConfirmed ? (
        <View style={styles.confirmedSection}>
          <Text style={styles.confirmedText}>✓ You've already confirmed this result</Text>
        </View>
      ) : (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>✓ Confirm Result</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.disputeButton} onPress={handleDispute}>
            <Text style={styles.disputeButtonText}>Dispute</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.hint}>
        {result.confirmed_by.length > 0
          ? `${result.confirmed_by.length} player(s) have confirmed this result`
          : 'Be the first to confirm!'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#6b7280',
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
    marginBottom: 4,
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  submittedBy: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  scoreCard: {
    margin: 20,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  teamScoreSection: {
    alignItems: 'center',
  },
  teamLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  teamScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#111827',
  },
  scoreDivider: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#d1d5db',
    marginHorizontal: 24,
  },
  pickleBadge: {
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  pickleBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
  },
  atpBadge: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  atpBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
  },
  statsSection: {
    padding: 20,
    paddingTop: 0,
  },
  statsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    color: '#374151',
  },
  teamsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  teamColumn: {
    flex: 1,
  },
  teamColumnLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  playerStatsRow: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  statBadge: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 8,
  },
  confirmedSection: {
    margin: 20,
    padding: 16,
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  actionButtons: {
    padding: 20,
    gap: 12,
  },
  confirmButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  disputeButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  disputeButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    textAlign: 'center',
    fontSize: 13,
    color: '#9ca3af',
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
});
