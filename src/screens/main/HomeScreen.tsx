import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';
import { Session, LFGPost } from '../../types/database';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'HomeScreen'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [lfgSuggestions, setLFGSuggestions] = useState<LFGPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load upcoming sessions
      const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('status', 'scheduled')
        .gte('start_at', new Date().toISOString())
        .order('start_at', { ascending: true })
        .limit(5);

      if (sessions) setUpcomingSessions(sessions);

      // Load LFG suggestions
      const { data: lfgPosts } = await supabase
        .from('lfg_posts')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(10);

      if (lfgPosts) setLFGSuggestions(lfgPosts);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        ListHeaderComponent={
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
              {upcomingSessions.length === 0 ? (
                <Text style={styles.emptyText}>No upcoming sessions</Text>
              ) : (
                upcomingSessions.map((session) => (
                  <TouchableOpacity
                    key={session.id}
                    style={styles.card}
                    onPress={() => navigation.navigate('SessionDetail', { sessionId: session.id })}
                  >
                    <Text style={styles.cardTitle}>{session.location_name || 'Session'}</Text>
                    <Text style={styles.cardSubtitle}>
                      {new Date(session.start_at).toLocaleString()}
                    </Text>
                    <Text style={styles.cardMeta}>{session.format}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Looking for Game</Text>
              {lfgSuggestions.length === 0 ? (
                <Text style={styles.emptyText}>No active LFG posts nearby</Text>
              ) : (
                lfgSuggestions.map((lfg) => (
                  <TouchableOpacity key={lfg.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{lfg.location_name || 'Game'}</Text>
                    <Text style={styles.cardSubtitle}>
                      {lfg.slots_filled}/{lfg.slots_total} players
                    </Text>
                    <Text style={styles.cardMeta}>
                      Skill: {lfg.skill_min}-{lfg.skill_max} • {lfg.format}
                    </Text>
                    {lfg.notes && <Text style={styles.notes}>{lfg.notes}</Text>}
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        }
        renderItem={null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateLFG', { groupId: '' })}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  notes: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
});
