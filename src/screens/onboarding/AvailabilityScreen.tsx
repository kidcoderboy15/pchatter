import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../navigation/types';

type AvailabilityScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Availability'>;
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_BLOCKS = ['Morning', 'Afternoon', 'Evening'];

export default function AvailabilityScreen({ navigation }: AvailabilityScreenProps) {
  const [availability, setAvailability] = useState<Set<string>>(new Set());

  const toggleAvailability = (day: number, block: string) => {
    const key = `${day}-${block}`;
    const newAvailability = new Set(availability);
    if (newAvailability.has(key)) {
      newAvailability.delete(key);
    } else {
      newAvailability.add(key);
    }
    setAvailability(newAvailability);
  };

  const handleContinue = () => {
    navigation.navigate('JoinGroup');
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>When do you play?</Text>
        <Text style={styles.subtitle}>
          Select your typical availability (you can change this later)
        </Text>

        <View style={styles.grid}>
          <View style={styles.headerRow}>
            <View style={styles.dayCell} />
            {TIME_BLOCKS.map((block) => (
              <Text key={block} style={styles.headerText}>
                {block}
              </Text>
            ))}
          </View>

          {DAYS.map((day, dayIndex) => (
            <View key={day} style={styles.row}>
              <Text style={styles.dayText}>{day}</Text>
              {TIME_BLOCKS.map((block) => {
                const key = `${dayIndex}-${block}`;
                const isSelected = availability.has(key);
                return (
                  <TouchableOpacity
                    key={block}
                    style={[styles.cell, isSelected && styles.cellSelected]}
                    onPress={() => toggleAvailability(dayIndex, block)}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

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
  grid: {
    marginBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayCell: {
    width: 50,
  },
  headerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  dayText: {
    width: 50,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  cell: {
    flex: 1,
    height: 40,
    marginHorizontal: 4,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  cellSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
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
    marginBottom: 32,
  },
  skipText: {
    color: '#6b7280',
    fontSize: 14,
  },
});
