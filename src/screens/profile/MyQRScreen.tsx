import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../../services/supabase';

export default function MyQRScreen() {
  const [qrValue, setQrValue] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    loadQRCode();
  }, []);

  const loadQRCode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();

      if (data) {
        setUsername(data.username);
        setQrValue(JSON.stringify({
          type: 'user',
          userId: user.id,
          username: data.username,
        }));
      }
    } catch (error) {
      console.error('Error loading QR code:', error);
    }
  };

  if (!qrValue) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>@{username}</Text>
      <Text style={styles.subtitle}>Scan to add as friend</Text>

      <View style={styles.qrContainer}>
        <QRCode value={qrValue} size={250} />
      </View>

      <Text style={styles.hint}>
        Have a friend scan this code to add you
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 40,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  hint: {
    marginTop: 40,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
