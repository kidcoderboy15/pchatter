import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';

import HomeStack from './stacks/HomeStack';
import GroupsStack from './stacks/GroupsStack';
import ProfileStack from './stacks/ProfileStack';
import RTFStack from './stacks/RTFStack';
import RewardsScreen from '../screens/main/RewardsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: () => null, // TODO: Add icons
        }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsStack}
        options={{
          tabBarLabel: 'Groups',
          tabBarIcon: () => null,
        }}
      />
      <Tab.Screen
        name="RTF"
        component={RTFStack}
        options={{
          tabBarLabel: 'RTF',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🔥</Text>,
        }}
      />
      <Tab.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{
          tabBarLabel: 'Rewards',
          tabBarIcon: () => null,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: () => null,
        }}
      />
    </Tab.Navigator>
  );
}
