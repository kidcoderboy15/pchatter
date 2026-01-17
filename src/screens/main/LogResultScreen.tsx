import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';
import { rewardService } from '../../services/rewardService';

type LogResultScreenProps = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'LogResult'>;
  route: RouteProp<HomeStackParamList, 'LogResult'>;
};

export default function LogResultScreen({ navigation, route }: LogResultScreenProps) {
  const { sessionId } = route.params;
  const [session, setSession] = useState<any>(null);
  const [team1Score, setTeam1Score] = useState('');
  const [team2Score, setTeam2Score] = useState('');
  const [hadATP, setHadATP] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const { data } = await supabase
        .from('sessions')
        .select(`
          *,
          session_participants(*, users(username))
        `)
        .eq('id', sessionId)
        .single();

      if (data) setSession(data);
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const handleSubmit = async () => {
    const score1 = parseInt(team1Score);
    const score2 = parseInt(team2Score);

    // Validation
    if (isNaN(score1) || isNaN(score2)) {
      Alert.alert('Error', 'Please enter valid scores');
      return;
    }

    if (score1 < 0 || score2 < 0) {
      Alert.alert('Error', 'Scores must be positive');
      return;
    }

    if (score1 === score2) {
      Alert.alert('Error', 'Scores cannot be tied in pickleball');
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
      }

      // Regular result feed post (if not pickle, or in addition to pickle)
      if (!isPickle) {
        await supabase
          .from('feed_posts')
          .insert({
            group_id: session.group_id,
            user_id: user.id,
            type: 'match_result',
            content: `Game finished: ${score1}-${score2}${hadATP ? ' 🎯 (ATP!)' : ''}`,
            ref_type: 'match_result',
            ref_id: result.id,
          });
      }

      // Navigate to rate players screen
      navigation.replace('RatePlayers', {
        sessionId,
        resultId: result.id,
        isPickle,
        hadATP,
      });
    } catch (error: any) {
      console.error('Error logging result:', error);
      Alert.alert('Error', error.message || 'Failed to log result');
    } finally {
      setLoading(false);
    }
  };

  const quickScore = (t1: number, t2: number) => {
    setTeam1Score(t1.toString());
    setTeam2Score(t2.toString());
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
        onPress={() => setHadATP(!hadATP)}
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
    padding: 12,
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
