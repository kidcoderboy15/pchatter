import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../navigation/types';
import * as Location from 'expo-location';

type LocationScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Location'>;
};

export default function LocationScreen({ navigation }: LocationScreenProps) {
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is needed to find nearby players');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address.city) {
        setCity(address.city);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get your location');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigation.navigate('Availability');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Where do you play?</Text>
      <Text style={styles.subtitle}>
        We'll help you find players nearby
      </Text>

      <Text style={styles.label}>City</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your city"
        value={city}
        onChangeText={setCity}
      />

      <TouchableOpacity
        style={styles.locationButton}
        onPress={handleUseCurrentLocation}
        disabled={loading}
      >
        <Text style={styles.locationButtonText}>
          {loading ? 'Getting location...' : 'Use current location'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={handleContinue}>
        <Text style={styles.skipText}>Skip for now</Text>
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
  locationButton: {
    borderWidth: 1,
    borderColor: '#22c55e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  locationButtonText: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
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
