import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { GroupsStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';
import { Group } from '../../types/database';
import { viralService } from '../../services/viralService';

type GroupDetailScreenProps = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'GroupDetail'>;
  route: RouteProp<GroupsStackParamList, 'GroupDetail'>;
};

export default function GroupDetailScreen({ navigation, route }: GroupDetailScreenProps) {
  const { groupId } = route.params;
  const [group, setGroup] = useState<Group | null>(null);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    loadGroup();
  }, [groupId]);

  const loadGroup = async () => {
    try {
      const { data: groupData } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupData) setGroup(groupData);

      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

      if (count) setMemberCount(count);
    } catch (error) {
      console.error('Error loading group:', error);
    }
  };

  if (!group) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{group.name}</Text>
        <Text style={styles.subtitle}>
          {group.type} • {memberCount} members
        </Text>
        <Text style={styles.joinCode}>Join Code: {group.join_code}</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={async () => {
            await viralService.haptic('light');
            navigation.navigate('LFGBoard', { groupId });
          }}
        >
          <Text style={styles.menuIcon}>🎾</Text>
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>LFG Board</Text>
            <Text style={styles.menuItemSubtext}>Find games in this group</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={async () => {
            await viralService.haptic('light');
            navigation.navigate('GroupAvailability', { groupId });
          }}
        >
          <Text style={styles.menuIcon}>📅</Text>
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>Group Availability</Text>
            <Text style={styles.menuItemSubtext}>See when members are free</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={async () => {
            await viralService.haptic('light');
            navigation.navigate('GroupLeaderboard', { groupId });
          }}
        >
          <Text style={styles.menuIcon}>🏆</Text>
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>Leaderboard</Text>
            <Text style={styles.menuItemSubtext}>Top players & stats</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={async () => {
            await viralService.haptic('light');
            navigation.navigate('GroupFeed', { groupId });
          }}
        >
          <Text style={styles.menuIcon}>📰</Text>
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>Feed & Activity</Text>
            <Text style={styles.menuItemSubtext}>Recent group highlights</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={async () => {
            await viralService.haptic('light');
            navigation.navigate('GroupMembers', { groupId });
          }}
        >
          <Text style={styles.menuIcon}>👥</Text>
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>Members</Text>
            <Text style={styles.menuItemSubtext}>{memberCount} people in this group</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  joinCode: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  menuItemSubtext: {
    fontSize: 13,
    color: '#6b7280',
  },
});
