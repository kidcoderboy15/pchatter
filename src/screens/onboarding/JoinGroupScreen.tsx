import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';

type JoinGroupScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'JoinGroup'>;
};

export default function JoinGroupScreen({ navigation }: JoinGroupScreenProps) {
  const [joinCode, setJoinCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinGroup = async () => {
    if (!joinCode) {
      Alert.alert('Error', 'Please enter a join code');
      return;
    }

    setLoading(true);
    try {
      // Find group by join code
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

      // TODO: Check password if required
      // TODO: Add user to group

      Alert.alert('Success', 'Joined group successfully!');
      // This will trigger navigation to Main via RootNavigator
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Complete onboarding without joining a group
    // This will be handled by creating the user record
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a group</Text>
      <Text style={styles.subtitle}>
        Enter a join code from a friend, or skip to browse public groups
      </Text>

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
        onPress={handleJoinGroup}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Joining...' : 'Join Group'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip - I'll join later</Text>
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
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
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
  },
  skipText: {
    color: '#6b7280',
    fontSize: 14,
  },
});
