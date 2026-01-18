import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';
import { PlayFormat } from '../../types/database';
import { useToast } from '../../context/ToastContext';

type CreateLFGScreenProps = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'CreateLFG'>;
  route: RouteProp<HomeStackParamList, 'CreateLFG'>;
};

const FORMATS: PlayFormat[] = ['doubles', 'singles', 'either'];

export default function CreateLFGScreen({ navigation, route }: CreateLFGScreenProps) {
  const { groupId } = route.params;
  const { showToast } = useToast();
  const [format, setFormat] = useState<PlayFormat>('doubles');
  const [slotsTotal, setSlotsTotal] = useState('4');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [timeOptions, setTimeOptions] = useState(['']);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!location) {
      showToast('Please enter a location', 'error');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create LFG post
      const { data: lfgPost, error: lfgError } = await supabase
        .from('lfg_posts')
        .insert({
          group_id: groupId,
          created_by: user.id,
          format,
          slots_total: parseInt(slotsTotal),
          slots_filled: 1, // Creator is automatically in
          location_name: location,
          notes,
          status: 'open',
        })
        .select()
        .single();

      if (lfgError) throw lfgError;

      // Create time options
      const validTimes = timeOptions.filter((t) => t.length > 0);
      if (validTimes.length > 0) {
        await supabase.from('lfg_time_options').insert(
          validTimes.map((time) => ({
            lfg_post_id: lfgPost.id,
            start_at: new Date(time).toISOString(),
          }))
        );
      }

      // Auto-claim spot for creator
      await supabase.from('lfg_claims').insert({
        lfg_post_id: lfgPost.id,
        user_id: user.id,
        status: 'joined',
      });

      showToast('LFG post created!', 'success');
      navigation.goBack();
    } catch (error: any) {
      showToast(error.message || 'Failed to create LFG post', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Format</Text>
      <View style={styles.formatContainer}>
        {FORMATS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.formatButton, format === f && styles.formatButtonActive]}
            onPress={() => setFormat(f)}
          >
            <Text style={[styles.formatText, format === f && styles.formatTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Total Slots</Text>
      <TextInput
        style={styles.input}
        placeholder="4"
        value={slotsTotal}
        onChangeText={setSlotsTotal}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        placeholder="Court name or address"
        value={location}
        onChangeText={setLocation}
      />

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Any additional details..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create LFG Post'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: '#374151',
  },
  formatContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  formatButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  formatButtonActive: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  formatText: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  formatTextActive: {
    color: '#22c55e',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
