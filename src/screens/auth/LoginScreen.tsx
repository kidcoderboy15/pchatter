import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [useEmail, setUseEmail] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      if (useEmail) {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
        });
        if (error) throw error;
        navigation.navigate('VerifyCode', { email: email.trim() });
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          phone: phone.trim(),
        });
        if (error) throw error;
        navigation.navigate('VerifyCode', { phone: phone.trim() });
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pickle Chatter</Text>
      <Text style={styles.subtitle}>Find games, track results, earn trophies</Text>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, useEmail && styles.activeTab]}
          onPress={() => setUseEmail(true)}
        >
          <Text style={[styles.tabText, useEmail && styles.activeTabText]}>Email</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, !useEmail && styles.activeTab]}
          onPress={() => setUseEmail(false)}
        >
          <Text style={[styles.tabText, !useEmail && styles.activeTabText]}>Phone</Text>
        </TouchableOpacity>
      </View>

      {useEmail ? (
        <TextInput
          style={styles.input}
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      ) : (
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending...' : 'Send Code'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        We'll send you a verification code to sign in
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#22c55e',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    padding: 4,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
  },
  activeTabText: {
    color: '#22c55e',
    fontWeight: '600',
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
  disclaimer: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 16,
    fontSize: 14,
  },
});
