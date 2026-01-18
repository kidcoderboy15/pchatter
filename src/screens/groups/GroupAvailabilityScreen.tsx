import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { GroupsStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';
import { viralService } from '../../services/viralService';

type GroupAvailabilityScreenProps = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'GroupAvailability'>;
  route: RouteProp<GroupsStackParamList, 'GroupAvailability'>;
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_BLOCKS = ['Morning', 'Afternoon', 'Evening'];

interface AvailabilityData {
  [day: number]: {
    [block: string]: string[]; // Array of usernames
  };
}

export default function GroupAvailabilityScreen({ navigation, route }: GroupAvailabilityScreenProps) {
  const { groupId } = route.params;
  const [availability, setAvailability] = useState<AvailabilityData>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, [groupId]);

  const loadAvailability = async () => {
    try {
      // Get group members' availability
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          users!inner(
            id,
            username,
            availability_blocks!inner(
              day_of_week,
              start_time_local,
              end_time_local
            )
          )
        `)
        .eq('group_id', groupId);

      if (error) throw error;

      // Process availability into grid format
      const availabilityGrid: AvailabilityData = {};

      data?.forEach((member: any) => {
        const username = member.users.username;
        member.users.availability_blocks?.forEach((block: any) => {
          const day = block.day_of_week;
          const timeBlock = getTimeBlockFromTime(block.start_time_local);

          if (!availabilityGrid[day]) {
            availabilityGrid[day] = {};
          }
          if (!availabilityGrid[day][timeBlock]) {
            availabilityGrid[day][timeBlock] = [];
          }
          availabilityGrid[day][timeBlock].push(username);
        });
      });

      setAvailability(availabilityGrid);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getTimeBlockFromTime = (time: string): string => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAvailability();
  };

  const handleEditMyAvailability = async () => {
    await viralService.haptic('medium');
    // Navigate to edit availability screen (we'll create this next)
    navigation.navigate('EditGroupAvailability', { groupId });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading availability...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Group Availability</Text>
        <Text style={styles.subtitle}>See when members are free to play</Text>
      </View>

      <TouchableOpacity style={styles.editButton} onPress={handleEditMyAvailability}>
        <Text style={styles.editButtonText}>✏️ Edit My Availability</Text>
      </TouchableOpacity>

      <View style={styles.grid}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.dayHeaderCell} />
          {TIME_BLOCKS.map((block) => (
            <View key={block} style={styles.timeHeaderCell}>
              <Text style={styles.timeHeaderText}>{block}</Text>
            </View>
          ))}
        </View>

        {/* Availability grid */}
        {DAYS.map((day, dayIndex) => (
          <View key={day} style={styles.row}>
            <View style={styles.dayCell}>
              <Text style={styles.dayText}>{day.slice(0, 3)}</Text>
            </View>
            {TIME_BLOCKS.map((block) => {
              const users = availability[dayIndex]?.[block] || [];
              const count = users.length;

              return (
                <TouchableOpacity
                  key={block}
                  style={[
                    styles.cell,
                    count > 0 && styles.cellWithUsers,
                    count >= 4 && styles.cellPopular,
                  ]}
                  onPress={async () => {
                    if (count > 0) {
                      await viralService.haptic('light');
                      // Could show a modal with full list
                    }
                  }}
                >
                  {count > 0 && (
                    <>
                      <Text style={styles.cellCount}>{count}</Text>
                      <Text style={styles.cellLabel}>
                        {count === 1 ? 'player' : 'players'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend:</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.cellWithUsers]} />
          <Text style={styles.legendText}>1-3 players available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.cellPopular]} />
          <Text style={styles.legendText}>4+ players (enough for doubles!)</Text>
        </View>
      </View>

      <Text style={styles.hint}>
        💡 Tap a time slot to see who's available
      </Text>
    </ScrollView>
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
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#6b7280',
  },
  editButton: {
    margin: 16,
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  grid: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeaderCell: {
    width: 60,
  },
  timeHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  timeHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dayCell: {
    width: 60,
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  cell: {
    flex: 1,
    height: 50,
    marginHorizontal: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellWithUsers: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  cellPopular: {
    backgroundColor: '#22c55e',
    borderColor: '#16a34a',
  },
  cellCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
  },
  cellLabel: {
    fontSize: 9,
    color: '#166534',
    marginTop: 2,
  },
  legend: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    color: '#374151',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    color: '#6b7280',
  },
  hint: {
    textAlign: 'center',
    fontSize: 13,
    color: '#9ca3af',
    padding: 16,
    paddingBottom: 32,
  },
});
