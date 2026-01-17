import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';

type ScanQRScreenProps = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'ScanQR'>;
};

export default function ScanQRScreen({ navigation }: ScanQRScreenProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);

    try {
      const qrData = JSON.parse(data);

      if (qrData.type === 'user') {
        // Add friend
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('friendships').insert({
          user_id: user.id,
          friend_id: qrData.userId,
          status: 'accepted', // Auto-accept via QR
        });

        if (error) throw error;

        Alert.alert('Success', `Added @${qrData.username} as friend!`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else if (qrData.type === 'group') {
        // Join group
        Alert.alert('Group Invite', `Join ${qrData.groupName}?`, [
          { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
          {
            text: 'Join',
            onPress: async () => {
              // TODO: Join group logic
              navigation.goBack();
            },
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid QR code');
      setScanned(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission denied</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlay}>
        <View style={styles.scanArea} />
        <Text style={styles.hint}>Align QR code within frame</Text>
      </View>

      {scanned && (
        <TouchableOpacity style={styles.button} onPress={() => setScanned(false)}>
          <Text style={styles.buttonText}>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#22c55e',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  hint: {
    marginTop: 20,
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
