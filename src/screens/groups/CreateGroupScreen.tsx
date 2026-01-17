import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GroupsStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';
import * as Crypto from 'expo-crypto';
import { GroupType } from '../../types/database';

type CreateGroupScreenProps = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'CreateGroup'>;
};

export default function CreateGroupScreen({ navigation }: CreateGroupScreenProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<GroupType>('private');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const generateJoinCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreate = async () => {
    if (!name) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const joinCode = generateJoinCode();
      let passwordHash = null;

      if (password) {
        passwordHash = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          password
        );
      }

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name,
          type,
          join_code: joinCode,
          password_hash: passwordHash,
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: user.id,
        role: 'admin',
      });

      Alert.alert('Success', `Group created! Join code: ${joinCode}`);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Group Name</Text>
      <TextInput
        style={styles.input}
        placeholder="My Pickleball Crew"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Type</Text>
      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[styles.typeButton, type === 'private' && styles.typeButtonActive]}
          onPress={() => setType('private')}
        >
          <Text style={[styles.typeText, type === 'private' && styles.typeTextActive]}>
            Private
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, type === 'public' && styles.typeButtonActive]}
          onPress={() => setType('public')}
        >
          <Text style={[styles.typeText, type === 'public' && styles.typeTextActive]}>
            Public
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Password (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Leave blank for no password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creating...' : 'Create Group'}
        </Text>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  typeText: {
    fontSize: 14,
    color: '#6b7280',
  },
  typeTextActive: {
    color: '#22c55e',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
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
