import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../navigation/types';
import { PlayFormat } from '../../types/database';

type SkillLevelScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'SkillLevel'>;
};

const SKILL_LEVELS = [
  { level: 1, label: 'Beginner', description: 'Just learning the basics' },
  { level: 2, label: 'Novice', description: 'Know the rules, learning strategy' },
  { level: 3, label: 'Intermediate', description: 'Solid fundamentals' },
  { level: 4, label: 'Advanced', description: 'Competitive player' },
  { level: 5, label: 'Expert', description: 'Tournament level' },
  { level: 6, label: 'Pro', description: 'Professional/elite' },
];

const PLAY_FORMATS: { value: PlayFormat; label: string }[] = [
  { value: 'doubles', label: 'Doubles' },
  { value: 'singles', label: 'Singles' },
  { value: 'either', label: 'Either' },
];

export default function SkillLevelScreen({ navigation }: SkillLevelScreenProps) {
  const [skillLevel, setSkillLevel] = useState<number>(3);
  const [format, setFormat] = useState<PlayFormat>('doubles');

  const handleContinue = () => {
    navigation.navigate('Location');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your skill level</Text>
      <Text style={styles.subtitle}>
        Rate yourself honestly - you'll be matched with similar players
      </Text>

      <View style={styles.section}>
        {SKILL_LEVELS.map((item) => (
          <TouchableOpacity
            key={item.level}
            style={[
              styles.skillCard,
              skillLevel === item.level && styles.skillCardSelected,
            ]}
            onPress={() => setSkillLevel(item.level)}
          >
            <View style={styles.skillHeader}>
              <Text style={styles.skillLevel}>{item.level}</Text>
              <Text style={styles.skillLabel}>{item.label}</Text>
            </View>
            <Text style={styles.skillDescription}>{item.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Preferred Format</Text>
      <View style={styles.formatContainer}>
        {PLAY_FORMATS.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.formatButton,
              format === item.value && styles.formatButtonSelected,
            ]}
            onPress={() => setFormat(item.value)}
          >
            <Text
              style={[
                styles.formatText,
                format === item.value && styles.formatTextSelected,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
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
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  skillCard: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  skillCardSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  skillLevel: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 12,
    color: '#22c55e',
    width: 32,
  },
  skillLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  skillDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 44,
  },
  formatContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  formatButton: {
    flex: 1,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
  },
  formatButtonSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  formatText: {
    fontSize: 16,
    color: '#6b7280',
  },
  formatTextSelected: {
    color: '#22c55e',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
