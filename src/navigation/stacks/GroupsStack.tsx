import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GroupsStackParamList } from '../types';

import GroupsListScreen from '../../screens/groups/GroupsListScreen';
import GroupDetailScreen from '../../screens/groups/GroupDetailScreen';
import CreateGroupScreen from '../../screens/groups/CreateGroupScreen';
import JoinGroupScreen from '../../screens/groups/JoinGroupScreen';
import GroupFeedScreen from '../../screens/groups/GroupFeedScreen';
import GroupMembersScreen from '../../screens/groups/GroupMembersScreen';
import LFGBoardScreen from '../../screens/groups/LFGBoardScreen';
import GroupAvailabilityScreen from '../../screens/groups/GroupAvailabilityScreen';
import EditGroupAvailabilityScreen from '../../screens/groups/EditGroupAvailabilityScreen';
import GroupLeaderboardScreen from '../../screens/groups/GroupLeaderboardScreen';

const Stack = createNativeStackNavigator<GroupsStackParamList>();

export default function GroupsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="GroupsList"
        component={GroupsListScreen}
        options={{ title: 'My Groups' }}
      />
      <Stack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{ title: 'Group' }}
      />
      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ title: 'Create Group' }}
      />
      <Stack.Screen
        name="JoinGroup"
        component={JoinGroupScreen}
        options={{ title: 'Join Group' }}
      />
      <Stack.Screen
        name="GroupFeed"
        component={GroupFeedScreen}
        options={{ title: 'Feed' }}
      />
      <Stack.Screen
        name="GroupMembers"
        component={GroupMembersScreen}
        options={{ title: 'Members' }}
      />
      <Stack.Screen
        name="LFGBoard"
        component={LFGBoardScreen}
        options={{ title: 'Looking For Game' }}
      />
      <Stack.Screen
        name="GroupAvailability"
        component={GroupAvailabilityScreen}
        options={{ title: 'Group Availability' }}
      />
      <Stack.Screen
        name="GroupLeaderboard"
        component={GroupLeaderboardScreen}
        options={{ title: 'Leaderboard' }}
      />
      <Stack.Screen
        name="EditGroupAvailability"
        component={EditGroupAvailabilityScreen}
        options={{ title: 'Edit Availability' }}
      />
    </Stack.Navigator>
  );
}
