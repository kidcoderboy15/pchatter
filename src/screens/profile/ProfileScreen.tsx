import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';
import { User } from '../../types/database';
import { viralService } from '../../services/viralService';
import { rewardService } from '../../services/rewardService';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'ProfileScreen'>;
};

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [tokenBalance, setTokenBalance] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (data) setUser(data);

      // Load token balance
      const balance = await rewardService.getBalance(authUser.id);
      setTokenBalance(balance);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  const handleInviteFriends = async () => {
    if (!user) return;
    await viralService.haptic('light');
    const shared = await viralService.shareInvite(user.username, user.id);
    if (shared) {
      await viralService.haptic('success');
      Alert.alert(
        '🎁 Invite Sent!',
        `Earn 75 tokens when your friend signs up + 50 more when they play their first game!`,
        [{ text: 'Nice!', style: 'default' }]
      );
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.username[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.username}>@{user.username}</Text>
        {user.display_name && <Text style={styles.displayName}>{user.display_name}</Text>}
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.self_level}</Text>
          <Text style={styles.statLabel}>Self Level</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.pickle_trophy_count}</Text>
          <Text style={styles.statLabel}>Pickles</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.aceValue]}>🎾 {user.total_aces || 0}</Text>
          <Text style={styles.statLabel}>Aces</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{(user.show_rate * 100).toFixed(0)}%</Text>
          <Text style={styles.statLabel}>Show Rate</Text>
        </View>
      </View>

      {/* Token Balance Card */}
      <View style={styles.tokenCard}>
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenLabel}>Token Balance</Text>
          <Text style={styles.tokenValue}>💰 {tokenBalance}</Text>
          <Text style={styles.tokenHint}>Earn tokens by playing & inviting friends!</Text>
        </View>
        <TouchableOpacity
          style={styles.merchStoreButton}
          onPress={async () => {
            await viralService.haptic('medium');
            navigation.navigate('MerchStore');
          }}
        >
          <Text style={styles.merchStoreButtonText}>🛍️ Merch Store</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.menuItem, styles.inviteButton]}
          onPress={handleInviteFriends}
        >
          <Text style={[styles.menuItemText, styles.inviteButtonText]}>📤 Invite Friends to Pickle Chatter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('MyQR')}
        >
          <Text style={styles.menuItemText}>My QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('ScanQR')}
        >
          <Text style={styles.menuItemText}>Scan QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Friends')}
        >
          <Text style={styles.menuItemText}>Friends</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.menuItemText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.menuItemText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
          <Text style={[styles.menuItemText, styles.dangerText]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 16,
    color: '#6b7280',
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 1,
    paddingVertical: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  aceValue: {
    color: '#22c55e',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  tokenCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  tokenInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tokenLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  tokenValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 8,
  },
  tokenHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  merchStoreButton: {
    backgroundColor: '#22c55e',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  merchStoreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
  },
  menuItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
  },
  dangerText: {
    color: '#ef4444',
  },
  inviteButton: {
    backgroundColor: '#22c55e',
    borderBottomWidth: 0,
  },
  inviteButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
