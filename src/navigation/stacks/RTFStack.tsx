import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { RTFStackParamList } from '../types';
import { RTF_COLORS } from '../../constants/rtfTheme';

import RTFBrowseScreen from '../../screens/rtf/RTFBrowseScreen';
import RTFDetailScreen from '../../screens/rtf/RTFDetailScreen';
import RTFTrendingScreen from '../../screens/rtf/RTFTrendingScreen';
import RTFProfileScreen from '../../screens/rtf/RTFProfileScreen';

const Stack = createNativeStackNavigator<RTFStackParamList>();

// Inner tab navigator for RTF sub-sections
const RTFTab = createBottomTabNavigator();

function RTFTabNavigator() {
  return (
    <RTFTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: RTF_COLORS.bgCard,
          borderTopColor: RTF_COLORS.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: RTF_COLORS.neon,
        tabBarInactiveTintColor: RTF_COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 1,
        },
      }}
    >
      <RTFTab.Screen
        name="Browse"
        component={RTFBrowseScreen}
        options={{
          tabBarLabel: 'BROWSE',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 18 }}>👕</Text>
          ),
        }}
      />
      <RTFTab.Screen
        name="Trending"
        component={RTFTrendingScreen}
        options={{
          tabBarLabel: 'TRENDING',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 18 }}>🔥</Text>
          ),
        }}
      />
      <RTFTab.Screen
        name="MyRatings"
        component={RTFProfileScreen}
        options={{
          tabBarLabel: 'MY FITS',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 18 }}>⭐</Text>
          ),
        }}
      />
    </RTFTab.Navigator>
  );
}

export default function RTFStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: RTF_COLORS.bg },
      }}
    >
      <Stack.Screen name="RTFBrowse" component={RTFTabNavigator} />
      <Stack.Screen name="RTFDetail" component={RTFDetailScreen} />
      <Stack.Screen name="RTFTrending" component={RTFTrendingScreen} />
      <Stack.Screen name="RTFProfile" component={RTFProfileScreen} />
    </Stack.Navigator>
  );
}
