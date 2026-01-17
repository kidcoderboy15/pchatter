import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';

import ProfileScreen from '../../screens/profile/ProfileScreen';
import EditProfileScreen from '../../screens/profile/EditProfileScreen';
import ScanQRScreen from '../../screens/profile/ScanQRScreen';
import MyQRScreen from '../../screens/profile/MyQRScreen';
import FriendsScreen from '../../screens/profile/FriendsScreen';
import SettingsScreen from '../../screens/profile/SettingsScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen
        name="ScanQR"
        component={ScanQRScreen}
        options={{ title: 'Scan QR Code' }}
      />
      <Stack.Screen
        name="MyQR"
        component={MyQRScreen}
        options={{ title: 'My QR Code' }}
      />
      <Stack.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ title: 'Friends' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
}
