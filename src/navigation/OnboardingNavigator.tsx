import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './types';

import UsernameScreen from '../screens/onboarding/UsernameScreen';
import ProfileSetupScreen from '../screens/onboarding/ProfileSetupScreen';
import SkillLevelScreen from '../screens/onboarding/SkillLevelScreen';
import LocationScreen from '../screens/onboarding/LocationScreen';
import AvailabilityScreen from '../screens/onboarding/AvailabilityScreen';
import JoinGroupScreen from '../screens/onboarding/JoinGroupScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="Username"
        component={UsernameScreen}
        options={{ title: 'Choose Username' }}
      />
      <Stack.Screen
        name="ProfileSetup"
        component={ProfileSetupScreen}
        options={{ title: 'Profile Setup' }}
      />
      <Stack.Screen
        name="SkillLevel"
        component={SkillLevelScreen}
        options={{ title: 'Skill Level' }}
      />
      <Stack.Screen
        name="Location"
        component={LocationScreen}
        options={{ title: 'Location' }}
      />
      <Stack.Screen
        name="Availability"
        component={AvailabilityScreen}
        options={{ title: 'Availability' }}
      />
      <Stack.Screen
        name="JoinGroup"
        component={JoinGroupScreen}
        options={{ title: 'Join a Group' }}
      />
    </Stack.Navigator>
  );
}
