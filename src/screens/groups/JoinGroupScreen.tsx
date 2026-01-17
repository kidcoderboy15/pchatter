import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GroupsStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';
import * as Crypto from 'expo-crypto';

type JoinGroupScreenProps = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'JoinGroup'>;
};

export default function JoinGroupScreen({ navigation }: JoinGroupScreenProps) {
  const [joinCode, setJoinCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!joinCode) {
      Alert.alert('Error', 'Please enter a join code');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: group, error } = await supabase
        .from('groups')
        .select('*')
        .eq('join_code', joinCode.toUpperCase())
        .single();

      if (error || !group) {
        Alert.alert('Error', 'Invalid join code');
        setLoading(false);
        return;
      }

      if (group.password_hash) {
        if (!password) {
          Alert.alert('Error', 'This group requires a password');
          setLoading(false);
          return;
        }

        const passwordHash = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          password
        );

        if (passwordHash !== group.password_hash) {
          Alert.alert('Error', 'Incorrect password');
          setLoading(false);
          return;
        }
      }

      const { error: memberError } = await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: user.id,
        role: 'member',
      });

      if (memberError) throw memberError;

      Alert.alert('Success', `Joined ${group.name}!`);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Group</Text>
      <Text style={styles.subtitle}>Enter the join code from a friend or group admin</Text>

      <Text style={styles.label}>Join Code</Text>
      <TextInput
        style={styles.input}
        placeholder="ABCD1234"
        value={joinCode}
        onChangeText={(text) => setJoinCode(text.toUpperCase())}
        autoCapitalize="characters"
        autoCorrect={false}
      />

      <Text style={styles.label}>Password (if required)</Text>
      <TextInput
        style={styles.input}
        placeholder="Optional"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleJoin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Joining...' : 'Join Group'}
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
