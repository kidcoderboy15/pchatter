import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GroupsStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';
import { Group } from '../../types/database';

type GroupsListScreenProps = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'GroupsList'>;
};

export default function GroupsListScreen({ navigation }: GroupsListScreenProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      const groupIds = (memberships ?? []).map((m) => m.group_id);
      if (groupIds.length === 0) {
        setGroups([]);
        return;
      }

      const { data } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);

      if (data) setGroups(data);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.groupCard}
            onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
          >
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupType}>{item.type}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No groups yet</Text>
            <Text style={styles.emptySubtext}>Join or create a group to get started</Text>
          </View>
        }
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('CreateGroup')}
        >
          <Text style={styles.buttonText}>Create Group</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('JoinGroup')}
        >
          <Text style={styles.secondaryButtonText}>Join Group</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  groupCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupType: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  buttonContainer: {
    padding: 20,
    gap: 12,
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
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#22c55e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '600',
  },
});
