import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { GroupsStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';

type GroupFeedScreenProps = {
  route: RouteProp<GroupsStackParamList, 'GroupFeed'>;
};

export default function GroupFeedScreen({ route }: GroupFeedScreenProps) {
  const { groupId } = route.params;
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    loadFeed();
  }, [groupId]);

  const loadFeed = async () => {
    try {
      const { data } = await supabase
        .from('feed_posts')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) setPosts(data);
    } catch (error) {
      console.error('Error loading feed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <Text style={styles.postType}>{item.type}</Text>
            {item.content && <Text style={styles.postContent}>{item.content}</Text>}
            <Text style={styles.postTime}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  postCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  postType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22c55e',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  postContent: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  postTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
