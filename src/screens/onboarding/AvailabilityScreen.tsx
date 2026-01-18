import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';

type AvailabilityScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Availability'>;
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_BLOCKS = ['Morning', 'Afternoon', 'Evening'];

// Convert time block to actual time ranges
const getTimeRange = (block: string): { start: string; end: string } => {
  switch (block) {
    case 'Morning':
      return { start: '06:00:00', end: '12:00:00' };
    case 'Afternoon':
      return { start: '12:00:00', end: '18:00:00' };
    case 'Evening':
      return { start: '18:00:00', end: '22:00:00' };
    default:
      return { start: '09:00:00', end: '17:00:00' };
  }
};

export default function AvailabilityScreen({ navigation }: AvailabilityScreenProps) {
  const [availability, setAvailability] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggleAvailability = (day: number, block: string) => {
    const key = `${day}-${block}`;
    const newAvailability = new Set(availability);
    if (newAvailability.has(key)) {
      newAvailability.delete(key);
    } else {
      newAvailability.add(key);
    }
    setAvailability(newAvailability);
  };

  const handleContinue = async () => {
    if (availability.size === 0) {
      // Skip if no availability selected
      navigation.navigate('JoinGroup');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Convert availability set to database records
      const availabilityBlocks = Array.from(availability).map((key) => {
        const [dayStr, block] = key.split('-');
        const dayOfWeek = parseInt(dayStr);
        const { start, end } = getTimeRange(block);

        return {
          user_id: user.id,
          day_of_week: dayOfWeek,
          start_time_local: start,
          end_time_local: end,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          active: true,
        };
      });

      const { error } = await supabase
        .from('availability_blocks')
        .insert(availabilityBlocks);

      if (error) throw error;

      navigation.navigate('JoinGroup');
    } catch (error: any) {
      console.error('Error saving availability:', error);
      Alert.alert('Error', 'Failed to save availability. You can set it later.');
      navigation.navigate('JoinGroup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>When do you play?</Text>
        <Text style={styles.subtitle}>
          Select your typical availability (you can change this later)
        </Text>

        <View style={styles.grid}>
          <View style={styles.headerRow}>
            <View style={styles.dayCell} />
            {TIME_BLOCKS.map((block) => (
              <Text key={block} style={styles.headerText}>
                {block}
              </Text>
            ))}
          </View>

          {DAYS.map((day, dayIndex) => (
            <View key={day} style={styles.row}>
              <Text style={styles.dayText}>{day}</Text>
              {TIME_BLOCKS.map((block) => {
                const key = `${dayIndex}-${block}`;
                const isSelected = availability.has(key);
                return (
                  <TouchableOpacity
                    key={block}
                    style={[styles.cell, isSelected && styles.cellSelected]}
                    onPress={() => toggleAvailability(dayIndex, block)}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Saving...' : 'Continue'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => navigation.navigate('JoinGroup')}
        disabled={loading}
      >
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },
  grid: {
    marginBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayCell: {
    width: 50,
  },
  headerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  dayText: {
    width: 50,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  cell: {
    flex: 1,
    height: 40,
    marginHorizontal: 4,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  cellSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  button: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 16,
    padding: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  skipText: {
    color: '#6b7280',
    fontSize: 14,
  },
});
