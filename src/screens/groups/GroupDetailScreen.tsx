import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { GroupsStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';
import { Group } from '../../types/database';

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
          onPress={() => navigation.navigate('GroupFeed', { groupId })}
        >
          <Text style={styles.menuItemText}>Feed & Activity</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('GroupMembers', { groupId })}
        >
          <Text style={styles.menuItemText}>Members</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>LFG Board</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Leaderboard</Text>
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
    padding: 20,
  },
  menuItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
  },
});
