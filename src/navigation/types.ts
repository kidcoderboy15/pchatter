// Navigation types

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  VerifyCode: { phone?: string; email?: string };
};

export type OnboardingStackParamList = {
  Username: undefined;
  ProfileSetup: undefined;
  SkillLevel: undefined;
  Location: undefined;
  Availability: undefined;
  JoinGroup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Groups: undefined;
  Profile: undefined;
  Rewards: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  CreateLFG: { groupId: string };
  SessionDetail: { sessionId: string };
  LogResult: { sessionId: string };
  ConfirmResult: { resultId: string };
  RatePlayers: { sessionId: string; resultId: string; isPickle: boolean; hadATP: boolean };
  Availability: undefined;
  AvailabilityMatches: { date: string; startTime: string; endTime: string };
};

export type GroupsStackParamList = {
  GroupsList: undefined;
  GroupDetail: { groupId: string };
  CreateGroup: undefined;
  CreateLFG: { groupId: string };
  JoinGroup: undefined;
  GroupFeed: { groupId: string };
  GroupMembers: { groupId: string };
  LFGBoard: { groupId: string };
  GroupAvailability: { groupId: string };
  EditGroupAvailability: { groupId: string };
  GroupLeaderboard: { groupId: string };
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
  ScanQR: undefined;
  MyQR: undefined;
  Friends: undefined;
  Settings: undefined;
  MerchStore: undefined;
};
