import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';

type UsernameScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Username'>;
};

export default function UsernameScreen({ navigation }: UsernameScreenProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    setLoading(true);
    try {
      // Check if username is available
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', username.toLowerCase())
        .single();

      if (existing) {
        Alert.alert('Error', 'Username is already taken');
        setLoading(false);
        return;
      }

      // Store username temporarily and move to next step
      navigation.navigate('ProfileSetup');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to check username');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose a username</Text>
      <Text style={styles.subtitle}>
        This is how other players will find you
      </Text>

      <TextInput
        style={styles.input}
        placeholder="username"
        value={username}
        onChangeText={(text) => setUsername(text.toLowerCase())}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Continue</Text>
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
});
