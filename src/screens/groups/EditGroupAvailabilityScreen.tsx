import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { GroupsStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';
import { viralService } from '../../services/viralService';
import { useToast } from '../../context/ToastContext';

type EditGroupAvailabilityScreenProps = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'EditGroupAvailability'>;
  route: RouteProp<GroupsStackParamList, 'EditGroupAvailability'>;
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_BLOCKS = ['Morning', 'Afternoon', 'Evening'];

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

export default function EditGroupAvailabilityScreen({ navigation, route }: EditGroupAvailabilityScreenProps) {
  const { groupId } = route.params;
  const { showToast } = useToast();
  const [availability, setAvailability] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMyAvailability();
  }, [groupId]);

  const loadMyAvailability = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('user_id', user.id)
        .or(`group_id.eq.${groupId},group_id.is.null`); // Get group-specific OR global availability

      if (error) throw error;

      const selected = new Set<string>();
      data?.forEach((block) => {
        const timeBlock = getTimeBlockFromTime(block.start_time_local);
        const key = `${block.day_of_week}-${timeBlock}`;
        selected.add(key);
      });

      setAvailability(selected);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeBlockFromTime = (time: string): string => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  const toggleAvailability = async (day: number, block: string) => {
    await viralService.haptic('light');
    const key = `${day}-${block}`;
    const newAvailability = new Set(availability);
    if (newAvailability.has(key)) {
      newAvailability.delete(key);
    } else {
      newAvailability.add(key);
    }
    setAvailability(newAvailability);
  };

  const handleSave = async () => {
    setSaving(true);
    await viralService.haptic('medium');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete existing availability for this group
      await supabase
        .from('availability_blocks')
        .delete()
        .eq('user_id', user.id)
        .eq('group_id', groupId);

      if (availability.size > 0) {
        // Insert new availability blocks
        const availabilityBlocks = Array.from(availability).map((key) => {
          const [dayStr, block] = key.split('-');
          const dayOfWeek = parseInt(dayStr);
          const { start, end } = getTimeRange(block);

          return {
            user_id: user.id,
            group_id: groupId,
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
      }

      await viralService.haptic('success');
      showToast('Availability updated!', 'success');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error saving availability:', error);
      await viralService.haptic('error');
      showToast('Failed to save availability. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading your availability...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Your Availability</Text>
          <Text style={styles.subtitle}>
            When are you typically free to play in this group?
          </Text>
        </View>

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
              <Text style={styles.dayText}>{day.slice(0, 3)}</Text>
              {TIME_BLOCKS.map((block) => {
                const key = `${dayIndex}-${block}`;
                const isSelected = availability.has(key);
                return (
                  <TouchableOpacity
                    key={block}
                    style={[styles.cell, isSelected && styles.cellSelected]}
                    onPress={() => toggleAvailability(dayIndex, block)}
                  >
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.hint}>
          <Text style={styles.hintText}>
            💡 Tap cells to toggle your availability. This helps the group know when you're free!
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : '💾 Save Availability'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
  grid: {
    padding: 20,
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
    height: 50,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#16a34a',
  },
  checkmark: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  hint: {
    padding: 20,
    paddingTop: 0,
  },
  hintText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saveButton: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
