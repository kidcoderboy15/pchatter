import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';
import { Session, SessionParticipant, User } from '../../types/database';

type SessionDetailScreenProps = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'SessionDetail'>;
  route: RouteProp<HomeStackParamList, 'SessionDetail'>;
};

export default function SessionDetailScreen({ navigation, route }: SessionDetailScreenProps) {
  const { sessionId } = route.params;
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionData) setSession(sessionData);

      const { data: participantsData } = await supabase
        .from('session_participants')
        .select('*, users(*)')
        .eq('session_id', sessionId);

      if (participantsData) setParticipants(participantsData);
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('session_participants')
        .update({ checked_in: true })
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      Alert.alert('Success', 'Checked in!');
      loadSession();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <Text>Session not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{session.location_name}</Text>
        <Text style={styles.subtitle}>
          {new Date(session.start_at).toLocaleString()}
        </Text>
        <Text style={styles.format}>{session.format}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Players ({participants.length})</Text>
        {participants.map((p) => (
          <View key={p.id} style={styles.playerCard}>
            <View>
              <Text style={styles.playerName}>
                {p.users?.username || 'Unknown'}
              </Text>
              <Text style={styles.playerLevel}>
                Level {p.users?.self_level || '?'}
              </Text>
            </View>
            {p.checked_in && (
              <Text style={styles.checkedIn}>✓ Checked in</Text>
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCheckIn}>
        <Text style={styles.buttonText}>Check In</Text>
      </TouchableOpacity>

      {session.status === 'completed' && (
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Log Result</Text>
        </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  format: {
    fontSize: 14,
    color: '#22c55e',
    textTransform: 'capitalize',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  playerLevel: {
    fontSize: 14,
    color: '#6b7280',
  },
  checkedIn: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    margin: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#22c55e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '600',
  },
});
