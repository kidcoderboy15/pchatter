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
  RatePlayers: { sessionId: string; resultId: string; isPickle: boolean; hadATP: boolean };
};

export type GroupsStackParamList = {
  GroupsList: undefined;
  GroupDetail: { groupId: string };
  CreateGroup: undefined;
  JoinGroup: undefined;
  GroupFeed: { groupId: string };
  GroupMembers: { groupId: string };
  LFGBoard: { groupId: string };
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
  ScanQR: undefined;
  MyQR: undefined;
  Friends: undefined;
  Settings: undefined;
};
