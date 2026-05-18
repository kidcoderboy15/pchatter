import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';

type ScanQRScreenProps = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'ScanQR'>;
};

export default function ScanQRScreen({ navigation }: ScanQRScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

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

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          {permission.canAskAgain
            ? 'Camera access is needed to scan QR codes.'
            : 'Camera permission denied. Enable it in your device Settings.'}
        </Text>
        {permission.canAskAgain && (
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Camera Access</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      <View style={styles.overlay} pointerEvents="none">
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
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
    paddingHorizontal: 24,
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
