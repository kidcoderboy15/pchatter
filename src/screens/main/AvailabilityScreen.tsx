import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { supabase } from '../../services/supabase';
import { useToast } from '../../context/ToastContext';
import DateTimePicker from '@react-native-community/datetimepicker';

interface AvailabilitySlot {
  availability_id: string;
  available_date: string;
  start_time: string;
  end_time: string;
  preferred_location: string | null;
  notes: string | null;
  match_count: number;
}

export const AvailabilityScreen = ({ navigation }: any) => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { showToast } = useToast();

  // Form state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_my_availability_this_week', {
        p_user_id: user.id,
      });

      if (error) throw error;
      setSlots(data || []);
    } catch (error: any) {
      console.error('Error loading availability:', error);
      showToast('Failed to load availability', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async () => {
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
        showToast('Join a group first to post availability', 'info');
        return;
      }

      // Format date and times
      const dateStr = selectedDate.toISOString().split('T')[0];
      const startTimeStr = startTime.toTimeString().split(' ')[0].substring(0, 5);
      const endTimeStr = endTime.toTimeString().split(' ')[0].substring(0, 5);

      const { error } = await supabase.from('user_availability').insert({
        user_id: user.id,
        group_id: groups[0].group_id,
        available_date: dateStr,
        start_time: startTimeStr,
        end_time: endTimeStr,
        preferred_location: location || null,
        notes: notes || null,
      });

      if (error) throw error;

      showToast('Availability added!', 'success');
      setShowAddModal(false);
      resetForm();
      loadAvailability();
    } catch (error: any) {
      console.error('Error adding availability:', error);
      showToast(error.message || 'Failed to add availability', 'error');
    }
  };

  const handleRemoveSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('user_availability')
        .update({ active: false })
        .eq('id', slotId);

      if (error) throw error;

      showToast('Availability removed', 'success');
      loadAvailability();
    } catch (error: any) {
      console.error('Error removing availability:', error);
      showToast('Failed to remove availability', 'error');
    }
  };

  const confirmRemove = (slotId: string) => {
    Alert.alert(
      'Remove Availability',
      'Are you sure you want to remove this time slot?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => handleRemoveSlot(slotId) },
      ]
    );
  };

  const resetForm = () => {
    setSelectedDate(new Date());
    setStartTime(new Date());
    setEndTime(new Date());
    setLocation('');
    setNotes('');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const viewMatches = (slot: AvailabilitySlot) => {
    navigation.navigate('AvailabilityMatches', {
      date: slot.available_date,
      startTime: slot.start_time,
      endTime: slot.end_time,
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Availability</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Availability</Text>
        <Text style={styles.subtitle}>Post when you're free this week</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {slots.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No availability posted</Text>
            <Text style={styles.emptyText}>
              Add time slots when you're free to play.{'\n'}
              Others will see when you match!
            </Text>
          </View>
        ) : (
          slots.map((slot) => (
            <View key={slot.availability_id} style={styles.slotCard}>
              <View style={styles.slotHeader}>
                <Text style={styles.slotDate}>{formatDate(slot.available_date)}</Text>
                {slot.match_count > 0 && (
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchBadgeText}>
                      {slot.match_count} {slot.match_count === 1 ? 'match' : 'matches'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.slotTime}>
                <Text style={styles.timeIcon}>🕐</Text>
                <Text style={styles.timeText}>
                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                </Text>
              </View>

              {slot.preferred_location && (
                <View style={styles.slotDetail}>
                  <Text style={styles.detailIcon}>📍</Text>
                  <Text style={styles.detailText}>{slot.preferred_location}</Text>
                </View>
              )}

              {slot.notes && (
                <View style={styles.slotDetail}>
                  <Text style={styles.detailIcon}>💬</Text>
                  <Text style={styles.detailText}>{slot.notes}</Text>
                </View>
              )}

              <View style={styles.slotActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.matchesButton]}
                  onPress={() => viewMatches(slot)}
                  disabled={slot.match_count === 0}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      slot.match_count === 0 && styles.actionButtonTextDisabled,
                    ]}
                  >
                    View Matches
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.removeButton]}
                  onPress={() => confirmRemove(slot.availability_id)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Text style={styles.fabText}>+ Add Time Slot</Text>
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Availability</Text>
            <TouchableOpacity onPress={handleAddSlot}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.inputText}>{selectedDate.toDateString()}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                minimumDate={new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) setSelectedDate(date);
                }}
              />
            )}

            <Text style={styles.label}>Start Time</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Text style={styles.inputText}>{startTime.toLocaleTimeString()}</Text>
            </TouchableOpacity>

            {showStartTimePicker && (
              <DateTimePicker
                value={startTime}
                mode="time"
                onChange={(event, time) => {
                  setShowStartTimePicker(Platform.OS === 'ios');
                  if (time) setStartTime(time);
                }}
              />
            )}

            <Text style={styles.label}>End Time</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Text style={styles.inputText}>{endTime.toLocaleTimeString()}</Text>
            </TouchableOpacity>

            {showEndTimePicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                onChange={(event, time) => {
                  setShowEndTimePicker(Platform.OS === 'ios');
                  if (time) setEndTime(time);
                }}
              />
            )}

            <Text style={styles.label}>Location (Optional)</Text>
            <TouchableOpacity style={styles.input}>
              <Text
                style={[styles.inputText, !location && styles.inputPlaceholder]}
                onPress={() => {}}
              >
                {location || 'e.g., Riverside Courts'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Notes (Optional)</Text>
            <TouchableOpacity style={[styles.input, styles.textArea]}>
              <Text
                style={[styles.inputText, !notes && styles.inputPlaceholder]}
                onPress={() => {}}
              >
                {notes || 'e.g., Prefer doubles'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
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
  slotCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  slotDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  matchBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  slotTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  timeText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  slotDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  slotActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  matchesButton: {
    backgroundColor: '#22c55e',
  },
  removeButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  actionButtonTextDisabled: {
    opacity: 0.5,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minHeight: 56,
    justifyContent: 'center',
  },
  fabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  textArea: {
    minHeight: 88,
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  inputText: {
    fontSize: 16,
    color: '#111827',
  },
  inputPlaceholder: {
    color: '#9ca3af',
  },
});
