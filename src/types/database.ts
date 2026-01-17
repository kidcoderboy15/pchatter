// Database types matching the schema

export type PlayFormat = 'doubles' | 'singles' | 'either';
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';
export type GroupType = 'private' | 'public';
export type GroupRole = 'member' | 'admin' | 'mod';
export type LFGStatus = 'open' | 'filled' | 'cancelled' | 'expired';
export type ClaimStatus = 'joined' | 'left' | 'kicked';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';
export type ConfirmationStatus = 'confirmed' | 'disputed';

export interface User {
  id: string;
  username: string;
  display_name?: string;
  photo_url?: string;
  phone?: string;
  email?: string;
  home_lat?: number;
  home_lng?: number;
  home_city?: string;
  self_level: number; // 1-6
  preferred_format?: PlayFormat;
  pickle_trophy_count: number;
  show_rate: number;
  cancel_count: number;
  created_at: string;
  last_active_at: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendshipStatus;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  type: GroupType;
  join_code: string;
  password_hash?: string;
  geo_lat?: number;
  geo_lng?: number;
  geo_radius_miles?: number;
  created_by?: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
}

export interface AvailabilityBlock {
  id: string;
  user_id: string;
  day_of_week: number; // 0-6
  start_time_local: string;
  end_time_local: string;
  timezone: string;
  active: boolean;
  created_at: string;
}

export interface LFGPost {
  id: string;
  group_id: string;
  created_by: string;
  format: PlayFormat;
  slots_total: number;
  slots_filled: number;
  skill_min?: number;
  skill_max?: number;
  location_name?: string;
  location_lat?: number;
  location_lng?: number;
  notes?: string;
  status: LFGStatus;
  created_at: string;
  expires_at?: string;
}

export interface LFGTimeOption {
  id: string;
  lfg_post_id: string;
  start_at: string;
}

export interface LFGClaim {
  id: string;
  lfg_post_id: string;
  user_id: string;
  selected_time_option_id?: string;
  status: ClaimStatus;
  created_at: string;
}

export interface Session {
  id: string;
  group_id: string;
  lfg_post_id?: string;
  start_at: string;
  location_name?: string;
  location_lat?: number;
  location_lng?: number;
  format: 'doubles' | 'singles';
  status: SessionStatus;
  created_at: string;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  team?: number;
  checked_in: boolean;
  created_at: string;
}

export interface MatchResult {
  id: string;
  session_id: string;
  created_by: string;
  team1_score: number;
  team2_score: number;
  verified: boolean;
  is_pickle: boolean;
  created_at: string;
}

export interface ResultConfirmation {
  id: string;
  match_result_id: string;
  user_id: string;
  status: ConfirmationStatus;
  created_at: string;
}

export interface PeerRating {
  id: string;
  session_id: string;
  rater_id: string;
  rated_user_id: string;
  skill_level?: number;
  sportsmanship?: number;
  notes?: string;
  created_at: string;
}

export interface ConsensusLevel {
  id: string;
  user_id: string;
  group_id?: string;
  consensus_level?: number;
  confidence?: number;
  rating_count: number;
  updated_at: string;
}

export interface AvoidListEntry {
  id: string;
  user_id: string;
  avoided_user_id: string;
  scope_group_id?: string;
  created_at: string;
}

export interface TokenLedgerEntry {
  id: string;
  user_id: string;
  delta: number;
  reason: string;
  ref_type?: string;
  ref_id?: string;
  created_at: string;
}

export interface TokenBalance {
  user_id: string;
  balance: number;
  updated_at: string;
}

export interface FeedPost {
  id: string;
  group_id: string;
  user_id?: string;
  type: string;
  content?: string;
  ref_type?: string;
  ref_id?: string;
  created_at: string;
}
