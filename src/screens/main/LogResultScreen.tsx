import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';
import { rewardService } from '../../services/rewardService';
import { viralService } from '../../services/viralService';
import AchievementCard from '../../components/AchievementCard';
import { useToast } from '../../context/ToastContext';

type LogResultScreenProps = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'LogResult'>;
  route: RouteProp<HomeStackParamList, 'LogResult'>;
};

export default function LogResultScreen({ navigation, route }: LogResultScreenProps) {
  const { sessionId } = route.params;
  const { showToast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [team1Score, setTeam1Score] = useState('');
  const [team2Score, setTeam2Score] = useState('');
  const [playerAces, setPlayerAces] = useState<Record<string, number>>({});
  const [playerNastyNates, setPlayerNastyNates] = useState<Record<string, number>>({});
  const [playerPegs, setPlayerPegs] = useState<Record<string, number>>({});
  const [hadATP, setHadATP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAchievement, setShowAchievement] = useState<{
    type: 'pickle' | 'atp';
    userName: string;
  } | null>(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const { data } = await supabase
        .from('sessions')
        .select(`
          *,
          session_participants(*, users(username, id))
        `)
        .eq('id', sessionId)
        .single();

      if (data) {
        setSession(data);
        // Initialize stats for all players
        const initialAces: Record<string, number> = {};
        const initialNastyNates: Record<string, number> = {};
        const initialPegs: Record<string, number> = {};
        data.session_participants?.forEach((p: any) => {
          initialAces[p.user_id] = 0;
          initialNastyNates[p.user_id] = 0;
          initialPegs[p.user_id] = 0;
        });
        setPlayerAces(initialAces);
        setPlayerNastyNates(initialNastyNates);
        setPlayerPegs(initialPegs);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const updatePlayerAces = async (userId: string, delta: number) => {
    await viralService.haptic('light');
    setPlayerAces(prev => ({
      ...prev,
      [userId]: Math.max(0, (prev[userId] || 0) + delta),
    }));
  };

  const updatePlayerNastyNates = async (userId: string, delta: number) => {
    await viralService.haptic('light');
    setPlayerNastyNates(prev => ({
      ...prev,
      [userId]: Math.max(0, (prev[userId] || 0) + delta),
    }));
  };

  const updatePlayerPegs = async (userId: string, delta: number) => {
    await viralService.haptic('light');
    setPlayerPegs(prev => ({
      ...prev,
      [userId]: Math.max(0, (prev[userId] || 0) + delta),
    }));
  };

  const quickScore = async (t1: number, t2: number) => {
    await viralService.haptic('medium');
    setTeam1Score(t1.toString());
    setTeam2Score(t2.toString());
  };

  const toggleATP = async () => {
    await viralService.haptic('light');
    setHadATP(!hadATP);
  };

  const handleSubmit = async () => {
    await viralService.haptic('heavy');
    const score1 = parseInt(team1Score);
    const score2 = parseInt(team2Score);

    // Validation
    if (isNaN(score1) || isNaN(score2)) {
      showToast('Please enter valid scores', 'error');
      return;
    }

    if (score1 < 0 || score2 < 0) {
      showToast('Scores must be positive', 'error');
      return;
    }

    if (score1 === score2) {
      showToast('Scores cannot be tied in pickleball', 'error');
      return;
    }

    // Check for pickle (11-0 shutout)
    const isPickle = (score1 === 11 && score2 === 0) || (score2 === 11 && score1 === 0);

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create result
      const { data: result, error: resultError } = await supabase
        .from('match_results')
        .insert({
          session_id: sessionId,
          created_by: user.id,
          team1_score: score1,
          team2_score: score2,
          is_pickle: isPickle,
          had_atp: hadATP,
          verified: false, // Needs confirmations (especially if ATP)
        })
        .select()
        .single();

      if (resultError) throw resultError;

      // Determine winning team
      const winningTeam = score1 > score2 ? 1 : 2;

      // Save per-player stats to game_results
      for (const participant of session.session_participants) {
        const userId = participant.user_id;
        const team = participant.team;
        const teamScore = team === 1 ? score1 : score2;
        const aces = playerAces[userId] || 0;
        const nastyNates = playerNastyNates[userId] || 0;
        const pegs = playerPegs[userId] || 0;
        const pickled = isPickle && team === winningTeam;

        await supabase.from('game_results').insert({
          session_id: sessionId,
          user_id: userId,
          match_result_id: result.id,
          team,
          score: teamScore,
          aces,
          nasty_nates: nastyNates,
          pegs: pegs,
          pickle_trophy: pickled,
        });

        // Update aces in session_participants for backward compatibility
        if (aces > 0) {
          await supabase
            .from('session_participants')
            .update({ aces_served: aces })
            .eq('session_id', sessionId)
            .eq('user_id', userId);

          // Update user's lifetime total
          await supabase.rpc('update_user_total_aces', { p_user_id: userId });

          // Check for ace milestones and award tokens
          const { data: userData } = await supabase
            .from('users')
            .select('total_aces')
            .eq('id', userId)
            .single();

          if (userData) {
            await rewardService.checkAceMilestones(userId, userData.total_aces);
          }
        }
      }

      // Auto-confirm for creator
      await supabase
        .from('result_confirmations')
        .insert({
          match_result_id: result.id,
          user_id: user.id,
          status: 'confirmed',
        });

      // Update session status
      await supabase
        .from('sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId);

      // Award tokens
      await rewardService.awardTokens(
        user.id,
        10,
        'Logged match result',
        'match_result',
        result.id
      );

      // If pickle, celebrate!
      if (isPickle) {
        const losingTeam = score1 === 0 ? 1 : 2;
        const winningTeam = score1 === 11 ? 1 : 2;

        // Get winners
        const winners = session.session_participants
          .filter((p: any) => p.team === winningTeam)
          .map((p: any) => p.user_id);

        // Award pickle trophies
        for (const winnerId of winners) {
          await supabase.rpc('increment_pickle_trophies', { user_id: winnerId });
          await rewardService.awardTokens(
            winnerId,
            50,
            'PICKLE TROPHY! 🏆 11-0 shutout',
            'pickle_trophy',
            result.id
          );
        }

        // Create epic feed post
        await supabase
          .from('feed_posts')
          .insert({
            group_id: session.group_id,
            user_id: user.id,
            type: 'pickle_trophy',
            content: `🥒 PICKLE ALERT! 🥒\n11-0 shutout! Someone got pickled!`,
            ref_type: 'match_result',
            ref_id: result.id,
          });

        // Show achievement card and celebrate
        await viralService.celebrate('pickle');
        const { data: userData } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .single();

        setShowAchievement({
          type: 'pickle',
          userName: userData?.username || 'Player',
        });
      }

      // ATP feed post if applicable
      if (hadATP) {
        await supabase
          .from('feed_posts')
          .insert({
            group_id: session.group_id,
            user_id: user.id,
            type: 'atp_shot',
            content: `🎯 ATP SHOT! Around the post!${isPickle ? ' AND a pickle! 🥒' : ''}`,
            ref_type: 'match_result',
            ref_id: result.id,
          });

        // Show ATP achievement if no pickle (pickle takes precedence)
        if (!isPickle) {
          await viralService.celebrate('atp');
          const { data: userData } = await supabase
            .from('users')
            .select('username')
            .eq('id', user.id)
            .single();

          setShowAchievement({
            type: 'atp',
            userName: userData?.username || 'Player',
          });
        }
      }

      // Ace feed post if applicable
      const totalAces = Object.values(playerAces).reduce((sum, count) => sum + count, 0);
      if (totalAces > 0) {
        // Find top ace server
        let topAcePlayer: any = null;
        let maxAces = 0;
        for (const [userId, aceCount] of Object.entries(playerAces)) {
          if (aceCount > maxAces) {
            maxAces = aceCount;
            const player = session.session_participants?.find((p: any) => p.user_id === userId);
            topAcePlayer = player?.users;
          }
        }

        let aceContent = '';
        if (totalAces >= 5) {
          aceContent = `🔥 ACE FEST! ${totalAces} aces served!${topAcePlayer ? ` ${topAcePlayer.username} led with ${maxAces}!` : ' Absolutely dominant!'}`;
        } else if (totalAces >= 3) {
          aceContent = `⚡ ${totalAces} aces!${topAcePlayer && maxAces > 1 ? ` ${topAcePlayer.username} served ${maxAces}!` : ' Serving heat!'}`;
        } else {
          aceContent = `🎾 ${totalAces} ace${totalAces > 1 ? 's' : ''} served!${topAcePlayer ? ` by ${topAcePlayer.username}` : ''}`;
        }

        await supabase
          .from('feed_posts')
          .insert({
            group_id: session.group_id,
            user_id: user.id,
            type: 'aces',
            content: aceContent,
            ref_type: 'match_result',
            ref_id: result.id,
          });
      }

      // Regular result feed post (if not pickle, or in addition to pickle)
      if (!isPickle) {
        const aceText = totalAces > 0 ? ` 🎾 (${totalAces} ace${totalAces > 1 ? 's' : ''})` : '';
        await supabase
          .from('feed_posts')
          .insert({
            group_id: session.group_id,
            user_id: user.id,
            type: 'match_result',
            content: `Game finished: ${score1}-${score2}${hadATP ? ' 🎯 (ATP!)' : ''}${aceText}`,
            ref_type: 'match_result',
            ref_id: result.id,
          });
      }

      // Update group member stats for leaderboard
      if (session.group_id) {
        await supabase.rpc('update_group_member_stats', { p_session_id: sessionId });
      }

      // If showing achievement, don't navigate yet (user will dismiss to navigate)
      if (!showAchievement) {
        navigation.replace('RatePlayers', {
          sessionId,
          resultId: result.id,
          isPickle,
          hadATP,
        });
      }
    } catch (error: any) {
      console.error('Error logging result:', error);
      showToast(error.message || 'Failed to log result', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAchievementShare = async () => {
    if (!showAchievement) return;

    const shared = await viralService.shareAchievement(
      showAchievement.type,
      { userName: showAchievement.userName }
    );

    if (shared) {
      handleAchievementDismiss();
    }
  };

  const handleAchievementDismiss = () => {
    const achievement = showAchievement;
    setShowAchievement(null);

    // Navigate after dismissing achievement
    const { data: result } = supabase
      .from('match_results')
      .select('id')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          navigation.replace('RatePlayers', {
            sessionId,
            resultId: data.id,
            isPickle: achievement?.type === 'pickle',
            hadATP,
          });
        }
      });
  };

  if (!session) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const team1 = session.session_participants?.filter((p: any) => p.team === 1) || [];
  const team2 = session.session_participants?.filter((p: any) => p.team === 2) || [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Log Result</Text>
        <Text style={styles.subtitle}>{session.format} @ {session.location_name}</Text>
      </View>

      {/* Teams */}
      <View style={styles.teams}>
        <View style={styles.team}>
          <Text style={styles.teamLabel}>Team 1</Text>
          {team1.map((p: any) => (
            <Text key={p.id} style={styles.playerName}>{p.users?.username}</Text>
          ))}
        </View>
        <View style={styles.team}>
          <Text style={styles.teamLabel}>Team 2</Text>
          {team2.map((p: any) => (
            <Text key={p.id} style={styles.playerName}>{p.users?.username}</Text>
          ))}
        </View>
      </View>

      {/* Score inputs */}
      <View style={styles.scoreInputs}>
        <View style={styles.scoreColumn}>
          <Text style={styles.scoreLabel}>Team 1 Score</Text>
          <TextInput
            style={styles.scoreInput}
            value={team1Score}
            onChangeText={setTeam1Score}
            keyboardType="number-pad"
            placeholder="0"
            maxLength={2}
          />
        </View>

        <Text style={styles.scoreDivider}>-</Text>

        <View style={styles.scoreColumn}>
          <Text style={styles.scoreLabel}>Team 2 Score</Text>
          <TextInput
            style={styles.scoreInput}
            value={team2Score}
            onChangeText={setTeam2Score}
            keyboardType="number-pad"
            placeholder="0"
            maxLength={2}
          />
        </View>
      </View>

      {/* Player Stats - Quick tap counters */}
      <View style={styles.statsSection}>
        <Text style={styles.statsSectionTitle}>Player Stats</Text>
        <Text style={styles.statsHint}>Tap + to track individual achievements</Text>

        {session.session_participants?.map((participant: any) => (
          <View key={participant.user_id} style={styles.playerStatsCard}>
            <Text style={styles.playerStatsName}>{participant.users?.username}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>🎾 Aces</Text>
                <View style={styles.counterButtons}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => updatePlayerAces(participant.user_id, -1)}
                  >
                    <Text style={styles.counterButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{playerAces[participant.user_id] || 0}</Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => updatePlayerAces(participant.user_id, 1)}
                  >
                    <Text style={styles.counterButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>🔥 Nasty Nates</Text>
                <View style={styles.counterButtons}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => updatePlayerNastyNates(participant.user_id, -1)}
                  >
                    <Text style={styles.counterButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{playerNastyNates[participant.user_id] || 0}</Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => updatePlayerNastyNates(participant.user_id, 1)}
                  >
                    <Text style={styles.counterButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>💥 Pegs</Text>
                <View style={styles.counterButtons}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => updatePlayerPegs(participant.user_id, -1)}
                  >
                    <Text style={styles.counterButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{playerPegs[participant.user_id] || 0}</Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => updatePlayerPegs(participant.user_id, 1)}
                  >
                    <Text style={styles.counterButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Quick score buttons */}
      <View style={styles.quickScores}>
        <Text style={styles.quickScoresLabel}>Quick Scores</Text>
        <View style={styles.quickScoreButtons}>
          <TouchableOpacity style={styles.quickScoreButton} onPress={() => quickScore(11, 0)}>
            <Text style={styles.quickScoreText}>11-0 🥒</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickScoreButton} onPress={() => quickScore(11, 9)}>
            <Text style={styles.quickScoreText}>11-9</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickScoreButton} onPress={() => quickScore(11, 7)}>
            <Text style={styles.quickScoreText}>11-7</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickScoreButton} onPress={() => quickScore(11, 5)}>
            <Text style={styles.quickScoreText}>11-5</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.quickScoreButtons}>
          <TouchableOpacity style={styles.quickScoreButton} onPress={() => quickScore(0, 11)}>
            <Text style={styles.quickScoreText}>0-11 🥒</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickScoreButton} onPress={() => quickScore(9, 11)}>
            <Text style={styles.quickScoreText}>9-11</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickScoreButton} onPress={() => quickScore(7, 11)}>
            <Text style={styles.quickScoreText}>7-11</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickScoreButton} onPress={() => quickScore(5, 11)}>
            <Text style={styles.quickScoreText}>5-11</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ATP checkbox */}
      <TouchableOpacity
        style={styles.atpCheckbox}
        onPress={toggleATP}
      >
        <View style={[styles.checkbox, hadATP && styles.checkboxChecked]}>
          {hadATP && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.atpLabelContainer}>
          <Text style={styles.atpLabel}>🎯 ATP Shot (Around The Post)</Text>
          <Text style={styles.atpSubtext}>
            Epic shot! Requires extra confirmation from other team
          </Text>
        </View>
      </TouchableOpacity>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Submitting...' : 'Submit Result'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        {hadATP ? 'ATP shots require confirmation from the other team' : 'Other players will be asked to confirm this result'}
      </Text>

      {/* Achievement card overlay */}
      {showAchievement && (
        <AchievementCard
          type={showAchievement.type}
          userName={showAchievement.userName}
          onShare={handleAchievementShare}
          onDismiss={handleAchievementDismiss}
        />
      )}
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  teams: {
    flexDirection: 'row',
    padding: 20,
    gap: 20,
  },
  team: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  teamLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  playerName: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  scoreInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 20,
  },
  scoreColumn: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#6b7280',
  },
  scoreInput: {
    width: 100,
    height: 80,
    borderWidth: 2,
    borderColor: '#22c55e',
    borderRadius: 12,
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111827',
  },
  scoreDivider: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#d1d5db',
  },
  statsSection: {
    padding: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    color: '#374151',
  },
  statsHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
  },
  playerStatsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  playerStatsName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  counterButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  counterButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  counterButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  counterValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
    minWidth: 40,
    textAlign: 'center',
  },
  quickScores: {
    padding: 20,
    paddingTop: 0,
  },
  quickScoresLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#6b7280',
  },
  quickScoreButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  quickScoreButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  quickScoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  atpCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  checkmark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  atpLabelContainer: {
    flex: 1,
  },
  atpLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  atpSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  submitButton: {
    margin: 20,
    marginTop: 32,
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
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});
