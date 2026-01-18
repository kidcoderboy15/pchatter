import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';

import HomeScreen from '../../screens/main/HomeScreen';
import CreateLFGScreen from '../../screens/main/CreateLFGScreen';
import SessionDetailScreen from '../../screens/main/SessionDetailScreen';
import LogResultScreen from '../../screens/main/LogResultScreen';
import ConfirmResultScreen from '../../screens/main/ConfirmResultScreen';
import RatePlayersScreen from '../../screens/main/RatePlayersScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ title: 'Pickle Chatter' }}
      />
      <Stack.Screen
        name="CreateLFG"
        component={CreateLFGScreen}
        options={{ title: 'Create LFG Post' }}
      />
      <Stack.Screen
        name="SessionDetail"
        component={SessionDetailScreen}
        options={{ title: 'Session' }}
      />
      <Stack.Screen
        name="LogResult"
        component={LogResultScreen}
        options={{ title: 'Log Result' }}
      />
      <Stack.Screen
        name="ConfirmResult"
        component={ConfirmResultScreen}
        options={{ title: 'Confirm Result' }}
      />
      <Stack.Screen
        name="RatePlayers"
        component={RatePlayersScreen}
        options={{ title: 'Rate Players' }}
      />
    </Stack.Navigator>
  );
}
