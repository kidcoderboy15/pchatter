import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { GroupsStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';

type GroupMembersScreenProps = {
  route: RouteProp<GroupsStackParamList, 'GroupMembers'>;
};

export default function GroupMembersScreen({ route }: GroupMembersScreenProps) {
  const { groupId } = route.params;
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    loadMembers();
  }, [groupId]);

  const loadMembers = async () => {
    try {
      const { data } = await supabase
        .from('group_members')
        .select('*, users(*)')
        .eq('group_id', groupId)
        .order('role', { ascending: true });

      if (data) setMembers(data);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.memberCard}>
            <View>
              <Text style={styles.username}>{item.users?.username || 'Unknown'}</Text>
              <Text style={styles.level}>Level {item.users?.self_level || '?'}</Text>
            </View>
            <Text style={styles.role}>{item.role}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  level: {
    fontSize: 14,
    color: '#6b7280',
  },
  role: {
    fontSize: 14,
    color: '#22c55e',
    textTransform: 'capitalize',
  },
});
