
-- ============================================================
-- 001_initial_schema.sql
-- ============================================================

-- Pickle Chatter Initial Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  home_lat DOUBLE PRECISION,
  home_lng DOUBLE PRECISION,
  home_city TEXT,
  self_level INT NOT NULL CHECK (self_level BETWEEN 1 AND 6),
  preferred_format TEXT CHECK (preferred_format IN ('doubles', 'singles', 'either')),
  pickle_trophy_count INT DEFAULT 0,
  show_rate DECIMAL(3,2) DEFAULT 1.0,
  cancel_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- FRIENDSHIPS TABLE
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- GROUPS TABLE
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('private', 'public')),
  join_code TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  geo_lat DOUBLE PRECISION,
  geo_lng DOUBLE PRECISION,
  geo_radius_miles DOUBLE PRECISION,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GROUP MEMBERS TABLE
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('member', 'admin', 'mod')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- AVAILABILITY BLOCKS TABLE
CREATE TABLE availability_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
  start_time_local TIME,
  end_time_local TIME,
  timezone TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LFG POSTS TABLE
CREATE TABLE lfg_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('doubles', 'singles', 'either')),
  slots_total INT NOT NULL,
  slots_filled INT DEFAULT 0,
  skill_min INT CHECK (skill_min BETWEEN 1 AND 6),
  skill_max INT CHECK (skill_max BETWEEN 1 AND 6),
  location_name TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('open', 'filled', 'cancelled', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- LFG TIME OPTIONS TABLE
CREATE TABLE lfg_time_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lfg_post_id UUID NOT NULL REFERENCES lfg_posts(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL
);

-- LFG CLAIMS TABLE
CREATE TABLE lfg_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lfg_post_id UUID NOT NULL REFERENCES lfg_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  selected_time_option_id UUID REFERENCES lfg_time_options(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('joined', 'left', 'kicked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lfg_post_id, user_id)
);

-- SESSIONS TABLE
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  lfg_post_id UUID REFERENCES lfg_posts(id) ON DELETE SET NULL,
  start_at TIMESTAMPTZ NOT NULL,
  location_name TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  format TEXT NOT NULL CHECK (format IN ('doubles', 'singles')),
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SESSION PARTICIPANTS TABLE
CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team INT CHECK (team IN (1, 2)),
  checked_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- MATCH RESULTS TABLE
CREATE TABLE match_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team1_score INT NOT NULL,
  team2_score INT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  is_pickle BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RESULT CONFIRMATIONS TABLE
CREATE TABLE result_confirmations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_result_id UUID NOT NULL REFERENCES match_results(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'disputed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_result_id, user_id)
);

-- PEER RATINGS TABLE
CREATE TABLE peer_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_level INT CHECK (skill_level BETWEEN 1 AND 6),
  sportsmanship INT CHECK (sportsmanship BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, rater_id, rated_user_id)
);

-- CONSENSUS LEVELS TABLE (computed/cached)
CREATE TABLE consensus_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  consensus_level INT CHECK (consensus_level BETWEEN 1 AND 6),
  confidence DECIMAL(3,2),
  rating_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

-- AVOID LIST TABLE
CREATE TABLE avoid_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  avoided_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope_group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, avoided_user_id, scope_group_id)
);

-- TOKEN LEDGER TABLE
CREATE TABLE token_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta INT NOT NULL,
  reason TEXT NOT NULL,
  ref_type TEXT,
  ref_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TOKEN BALANCES TABLE (computed/cached)
CREATE TABLE token_balances (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FEED POSTS TABLE
CREATE TABLE feed_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  content TEXT,
  ref_type TEXT,
  ref_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES for performance
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_availability_user_id ON availability_blocks(user_id);
CREATE INDEX idx_lfg_posts_group_id ON lfg_posts(group_id);
CREATE INDEX idx_lfg_posts_status ON lfg_posts(status);
CREATE INDEX idx_lfg_claims_post_id ON lfg_claims(lfg_post_id);
CREATE INDEX idx_lfg_claims_user_id ON lfg_claims(user_id);
CREATE INDEX idx_sessions_group_id ON sessions(group_id);
CREATE INDEX idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX idx_session_participants_user_id ON session_participants(user_id);
CREATE INDEX idx_match_results_session_id ON match_results(session_id);
CREATE INDEX idx_peer_ratings_rated_user_id ON peer_ratings(rated_user_id);
CREATE INDEX idx_token_ledger_user_id ON token_ledger(user_id);
CREATE INDEX idx_feed_posts_group_id ON feed_posts(group_id);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lfg_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lfg_time_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE lfg_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE consensus_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE avoid_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can read their own data and group data they're part of)
-- Users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::uuid = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::uuid = id);

-- Groups - members can view
CREATE POLICY "Group members can view group" ON groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid)
  );

-- More policies will be added as needed...


-- ============================================================
-- 002_functions.sql
-- ============================================================

-- Database functions for Pickle Chatter

-- Function to increment pickle trophy count
CREATE OR REPLACE FUNCTION increment_pickle_trophies(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET pickle_trophy_count = pickle_trophy_count + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate consensus level for a user in a group
CREATE OR REPLACE FUNCTION calculate_consensus_level(p_user_id UUID, p_group_id UUID)
RETURNS TABLE(consensus_level INT, confidence DECIMAL, rating_count INT) AS $$
DECLARE
  v_ratings INT[];
  v_median INT;
  v_count INT;
  v_confidence DECIMAL;
BEGIN
  -- Get last 20 skill ratings for user in sessions within this group
  SELECT array_agg(skill_level ORDER BY created_at DESC)
  INTO v_ratings
  FROM (
    SELECT pr.skill_level, pr.created_at
    FROM peer_ratings pr
    JOIN sessions s ON pr.session_id = s.id
    WHERE pr.rated_user_id = p_user_id
      AND s.group_id = p_group_id
      AND pr.skill_level IS NOT NULL
    ORDER BY pr.created_at DESC
    LIMIT 20
  ) recent_ratings;

  v_count := array_length(v_ratings, 1);

  -- Need at least 5 ratings for consensus
  IF v_count < 5 THEN
    RETURN QUERY SELECT NULL::INT, NULL::DECIMAL, COALESCE(v_count, 0);
    RETURN;
  END IF;

  -- Calculate median (sort array and pick middle value)
  v_ratings := array_sort(v_ratings);
  IF v_count % 2 = 0 THEN
    v_median := (v_ratings[v_count/2] + v_ratings[v_count/2 + 1]) / 2;
  ELSE
    v_median := v_ratings[(v_count + 1) / 2];
  END IF;

  -- Calculate confidence (higher with more ratings, max at 20)
  v_confidence := LEAST(v_count / 20.0, 1.0);

  RETURN QUERY SELECT v_median, v_confidence, v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update consensus levels (can be run periodically)
CREATE OR REPLACE FUNCTION update_all_consensus_levels()
RETURNS void AS $$
DECLARE
  rec RECORD;
  consensus_data RECORD;
BEGIN
  FOR rec IN
    SELECT DISTINCT pr.rated_user_id, s.group_id
    FROM peer_ratings pr
    JOIN sessions s ON pr.session_id = s.id
  LOOP
    SELECT * INTO consensus_data
    FROM calculate_consensus_level(rec.rated_user_id, rec.group_id);

    IF consensus_data.consensus_level IS NOT NULL THEN
      INSERT INTO consensus_levels (user_id, group_id, consensus_level, confidence, rating_count)
      VALUES (rec.rated_user_id, rec.group_id, consensus_data.consensus_level, consensus_data.confidence, consensus_data.rating_count)
      ON CONFLICT (user_id, group_id)
      DO UPDATE SET
        consensus_level = consensus_data.consensus_level,
        confidence = consensus_data.confidence,
        rating_count = consensus_data.rating_count,
        updated_at = NOW();
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Helper function to sort arrays (needed for median calculation)
CREATE OR REPLACE FUNCTION array_sort(arr INT[])
RETURNS INT[] AS $$
  SELECT array_agg(val ORDER BY val)
  FROM unnest(arr) AS val;
$$ LANGUAGE sql IMMUTABLE;


-- ============================================================
-- 003_atp_tracking.sql
-- ============================================================

-- Add ATP (Around The Post) tracking to match results

-- Add ATP flag to match_results
ALTER TABLE match_results
ADD COLUMN had_atp BOOLEAN DEFAULT FALSE;

-- Add comment for clarity
COMMENT ON COLUMN match_results.had_atp IS 'True if match had an Around The Post shot (requires extra confirmation)';

-- Update verification logic: ATP results need at least one cross-team confirmation
-- This will be enforced in the application logic, but we can add a helper view

CREATE OR REPLACE VIEW verified_results AS
SELECT
  mr.id,
  mr.session_id,
  mr.team1_score,
  mr.team2_score,
  mr.is_pickle,
  mr.had_atp,
  mr.verified,
  mr.created_by,
  COUNT(DISTINCT rc.user_id) as confirmation_count,
  COUNT(DISTINCT CASE WHEN sp.team != creator_team.team THEN rc.user_id END) as cross_team_confirmations
FROM match_results mr
LEFT JOIN result_confirmations rc ON rc.match_result_id = mr.id AND rc.status = 'confirmed'
LEFT JOIN session_participants sp ON sp.user_id = rc.user_id AND sp.session_id = mr.session_id
LEFT JOIN session_participants creator_team ON creator_team.user_id = mr.created_by AND creator_team.session_id = mr.session_id
GROUP BY mr.id, mr.session_id, mr.team1_score, mr.team2_score, mr.is_pickle, mr.had_atp, mr.verified, mr.created_by;

COMMENT ON VIEW verified_results IS 'Shows match results with confirmation counts, including cross-team confirmations';


-- ============================================================
-- 004_ace_tracking.sql
-- ============================================================

-- Add ace tracking to match results

-- Add ace count columns (per team)
ALTER TABLE match_results
ADD COLUMN team1_aces INT DEFAULT 0 CHECK (team1_aces >= 0),
ADD COLUMN team2_aces INT DEFAULT 0 CHECK (team2_aces >= 0);

-- Add comments
COMMENT ON COLUMN match_results.team1_aces IS 'Number of aces by team 1 (unreturnable serves)';
COMMENT ON COLUMN match_results.team2_aces IS 'Number of aces by team 2 (unreturnable serves)';

-- Update verified_results view to include aces
DROP VIEW IF EXISTS verified_results;

CREATE OR REPLACE VIEW verified_results AS
SELECT
  mr.id,
  mr.session_id,
  mr.team1_score,
  mr.team2_score,
  mr.team1_aces,
  mr.team2_aces,
  mr.is_pickle,
  mr.had_atp,
  mr.verified,
  mr.created_by,
  COUNT(DISTINCT rc.user_id) as confirmation_count,
  COUNT(DISTINCT CASE WHEN sp.team != creator_team.team THEN rc.user_id END) as cross_team_confirmations
FROM match_results mr
LEFT JOIN result_confirmations rc ON rc.match_result_id = mr.id AND rc.status = 'confirmed'
LEFT JOIN session_participants sp ON sp.user_id = rc.user_id AND sp.session_id = mr.session_id
LEFT JOIN session_participants creator_team ON creator_team.user_id = mr.created_by AND creator_team.session_id = mr.session_id
GROUP BY mr.id, mr.session_id, mr.team1_score, mr.team2_score, mr.team1_aces, mr.team2_aces, mr.is_pickle, mr.had_atp, mr.verified, mr.created_by;

COMMENT ON VIEW verified_results IS 'Shows match results with confirmation counts and ace tracking';


-- ============================================================
-- 005_aces_per_player.sql
-- ============================================================

-- Refactor ace tracking from team-based to player-based

-- First, remove team-based ace columns from match_results
ALTER TABLE match_results
DROP COLUMN IF EXISTS team1_aces,
DROP COLUMN IF EXISTS team2_aces;

-- Add aces_served to session_participants (per player, per session)
ALTER TABLE session_participants
ADD COLUMN aces_served INT DEFAULT 0 CHECK (aces_served >= 0);

COMMENT ON COLUMN session_participants.aces_served IS 'Number of aces this player served in this session';

-- Add total_aces to users table for lifetime badge
ALTER TABLE users
ADD COLUMN total_aces INT DEFAULT 0 CHECK (total_aces >= 0);

COMMENT ON COLUMN users.total_aces IS 'Lifetime total aces served across all sessions';

-- Update verified_results view (remove team aces since we removed those columns)
DROP VIEW IF EXISTS verified_results;

CREATE OR REPLACE VIEW verified_results AS
SELECT
  mr.id,
  mr.session_id,
  mr.team1_score,
  mr.team2_score,
  mr.is_pickle,
  mr.had_atp,
  mr.verified,
  mr.created_by,
  COUNT(DISTINCT rc.user_id) as confirmation_count,
  COUNT(DISTINCT CASE WHEN sp.team != creator_team.team THEN rc.user_id END) as cross_team_confirmations
FROM match_results mr
LEFT JOIN result_confirmations rc ON rc.match_result_id = mr.id AND rc.status = 'confirmed'
LEFT JOIN session_participants sp ON sp.user_id = rc.user_id AND sp.session_id = mr.session_id
LEFT JOIN session_participants creator_team ON creator_team.user_id = mr.created_by AND creator_team.session_id = mr.session_id
GROUP BY mr.id, mr.session_id, mr.team1_score, mr.team2_score, mr.is_pickle, mr.had_atp, mr.verified, mr.created_by;

COMMENT ON VIEW verified_results IS 'Shows match results with confirmation counts (aces now tracked per player)';

-- Function to update user's total aces
CREATE OR REPLACE FUNCTION update_user_total_aces(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET total_aces = (
    SELECT COALESCE(SUM(aces_served), 0)
    FROM session_participants
    WHERE user_id = p_user_id
  )
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_user_total_aces IS 'Recalculates and updates a user''s lifetime total aces';


-- ============================================================
-- 006_merch_store.sql
-- ============================================================

-- Add merch store and enhanced token rewards

-- Create merch_orders table for token redemption
CREATE TABLE IF NOT EXISTS merch_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  cost INTEGER NOT NULL,
  shipping_info JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  shipped_at TIMESTAMPTZ,
  tracking_number TEXT
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_merch_orders_user_id ON merch_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_merch_orders_status ON merch_orders(status);

-- Enable RLS
ALTER TABLE merch_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies for merch_orders
CREATE POLICY "Users can view their own merch orders"
  ON merch_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own merch orders"
  ON merch_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add invited_by field to users for referral tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- Generate invite codes for existing users
UPDATE users SET invite_code = substring(encode(gen_random_bytes(6), 'base64'), 1, 8) WHERE invite_code IS NULL;

-- Add index for invite code lookups
CREATE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code);

COMMENT ON TABLE merch_orders IS 'Store merch redemptions with token costs';
COMMENT ON COLUMN users.invited_by IS 'User who invited this user (for referral bonuses)';
COMMENT ON COLUMN users.invite_code IS 'Unique invite code for referral tracking';


-- ============================================================
-- 007_group_specific_availability.sql
-- ============================================================

-- Make availability group-specific and add group features

-- Add group_id to availability_blocks (make it optional for backwards compat)
ALTER TABLE availability_blocks ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

-- Add index for group-based queries
CREATE INDEX IF NOT EXISTS idx_availability_blocks_group_id ON availability_blocks(group_id);
CREATE INDEX IF NOT EXISTS idx_availability_blocks_user_group ON availability_blocks(user_id, group_id);

-- Create group_member_stats for leaderboards
CREATE TABLE IF NOT EXISTS group_member_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  games_played INT DEFAULT 0,
  games_won INT DEFAULT 0,
  pickle_trophies INT DEFAULT 0,
  total_aces INT DEFAULT 0,
  show_rate DECIMAL(3,2) DEFAULT 1.0,
  last_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_member_stats_group_id ON group_member_stats(group_id);
CREATE INDEX IF NOT EXISTS idx_group_member_stats_user_id ON group_member_stats(user_id);

-- Enable RLS
ALTER TABLE group_member_stats ENABLE ROW LEVEL SECURITY;

-- RLS policy for group stats
CREATE POLICY "Group members can view group stats"
  ON group_member_stats FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- Function to update group member stats after a game
CREATE OR REPLACE FUNCTION update_group_member_stats(
  p_session_id UUID
)
RETURNS void AS $$
DECLARE
  v_group_id UUID;
  v_participant RECORD;
  v_result RECORD;
  v_winning_team INT;
BEGIN
  -- Get session group
  SELECT group_id INTO v_group_id FROM sessions WHERE id = p_session_id;

  IF v_group_id IS NULL THEN
    RETURN;
  END IF;

  -- Get match result to determine winner
  SELECT * INTO v_result FROM match_results WHERE session_id = p_session_id ORDER BY created_at DESC LIMIT 1;

  IF v_result.team1_score > v_result.team2_score THEN
    v_winning_team := 1;
  ELSE
    v_winning_team := 2;
  END IF;

  -- Update stats for each participant
  FOR v_participant IN
    SELECT sp.user_id, sp.team, sp.aces_served, u.show_rate
    FROM session_participants sp
    JOIN users u ON u.id = sp.user_id
    WHERE sp.session_id = p_session_id
  LOOP
    -- Upsert group member stats
    INSERT INTO group_member_stats (
      group_id,
      user_id,
      games_played,
      games_won,
      pickle_trophies,
      total_aces,
      show_rate,
      last_played_at
    ) VALUES (
      v_group_id,
      v_participant.user_id,
      1,
      CASE WHEN v_participant.team = v_winning_team THEN 1 ELSE 0 END,
      CASE WHEN v_result.is_pickle AND v_participant.team = v_winning_team THEN 1 ELSE 0 END,
      COALESCE(v_participant.aces_served, 0),
      v_participant.show_rate,
      NOW()
    )
    ON CONFLICT (group_id, user_id) DO UPDATE SET
      games_played = group_member_stats.games_played + 1,
      games_won = group_member_stats.games_won + CASE WHEN v_participant.team = v_winning_team THEN 1 ELSE 0 END,
      pickle_trophies = group_member_stats.pickle_trophies + CASE WHEN v_result.is_pickle AND v_participant.team = v_winning_team THEN 1 ELSE 0 END,
      total_aces = group_member_stats.total_aces + COALESCE(v_participant.aces_served, 0),
      show_rate = v_participant.show_rate,
      last_played_at = NOW(),
      updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE group_member_stats IS 'Per-group leaderboard stats for members';
COMMENT ON FUNCTION update_group_member_stats IS 'Updates group stats after a game is played';


-- ============================================================
-- 008_nasty_nates_and_pegs.sql
-- ============================================================

-- Add nasty_nates and pegs tracking to game results
-- Nasty Nate: exceptional shots/plays
-- Pegs: times hit by ball during game

-- Create game_results table for per-player game stats
CREATE TABLE IF NOT EXISTS game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_result_id UUID REFERENCES match_results(id) ON DELETE CASCADE,
  team INT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  aces INT DEFAULT 0,
  nasty_nates INT DEFAULT 0,
  pegs INT DEFAULT 0,
  pickle_trophy BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_game_results_session ON game_results(session_id);
CREATE INDEX IF NOT EXISTS idx_game_results_user ON game_results(user_id);

-- Add to group member stats for leaderboards
ALTER TABLE group_member_stats ADD COLUMN IF NOT EXISTS total_nasty_nates INT DEFAULT 0;
ALTER TABLE group_member_stats ADD COLUMN IF NOT EXISTS total_pegs INT DEFAULT 0;

-- Add confirmation tracking to match_results
ALTER TABLE match_results ADD COLUMN IF NOT EXISTS needs_confirmation BOOLEAN DEFAULT true;
ALTER TABLE match_results ADD COLUMN IF NOT EXISTS confirmed_by UUID[] DEFAULT '{}';
ALTER TABLE match_results ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- Create index for faster confirmation queries
CREATE INDEX IF NOT EXISTS idx_match_results_needs_confirmation ON match_results(needs_confirmation) WHERE needs_confirmation = true;

-- Update the group stats function to include new stats
CREATE OR REPLACE FUNCTION update_group_member_stats(p_session_id UUID)
RETURNS void AS $$
DECLARE
  v_group_id UUID;
  v_winning_team INT;
  v_participant RECORD;
BEGIN
  -- Get session details
  SELECT group_id INTO v_group_id
  FROM sessions
  WHERE id = p_session_id;

  -- Get winning team from game_results
  SELECT team INTO v_winning_team
  FROM game_results
  WHERE session_id = p_session_id
  ORDER BY score DESC
  LIMIT 1;

  -- Update stats for each participant
  FOR v_participant IN
    SELECT
      sp.user_id,
      sp.team,
      sp.checked_in,
      COALESCE(gr.aces, 0) as aces,
      COALESCE(gr.nasty_nates, 0) as nasty_nates,
      COALESCE(gr.pegs, 0) as pegs,
      CASE WHEN sp.team = v_winning_team THEN 1 ELSE 0 END as won
    FROM session_participants sp
    LEFT JOIN game_results gr ON gr.user_id = sp.user_id AND gr.session_id = p_session_id
    WHERE sp.session_id = p_session_id
  LOOP
    -- Insert or update group member stats
    INSERT INTO group_member_stats (
      group_id,
      user_id,
      games_played,
      games_won,
      total_aces,
      total_nasty_nates,
      total_pegs,
      show_rate,
      last_played_at
    )
    VALUES (
      v_group_id,
      v_participant.user_id,
      1,
      v_participant.won,
      v_participant.aces,
      v_participant.nasty_nates,
      v_participant.pegs,
      CASE WHEN v_participant.checked_in THEN 1.0 ELSE 0.0 END,
      NOW()
    )
    ON CONFLICT (group_id, user_id) DO UPDATE SET
      games_played = group_member_stats.games_played + 1,
      games_won = group_member_stats.games_won + v_participant.won,
      total_aces = group_member_stats.total_aces + v_participant.aces,
      total_nasty_nates = group_member_stats.total_nasty_nates + v_participant.nasty_nates,
      total_pegs = group_member_stats.total_pegs + v_participant.pegs,
      show_rate = (
        (group_member_stats.show_rate * group_member_stats.games_played) +
        CASE WHEN v_participant.checked_in THEN 1.0 ELSE 0.0 END
      ) / (group_member_stats.games_played + 1),
      last_played_at = NOW();
  END LOOP;

  -- Update pickle trophy count if applicable
  FOR v_participant IN
    SELECT user_id
    FROM game_results
    WHERE session_id = p_session_id AND pickle_trophy = true
  LOOP
    UPDATE group_member_stats
    SET pickle_trophies = pickle_trophies + 1
    WHERE group_id = v_group_id AND user_id = v_participant.user_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE game_results IS 'Per-player stats for each game session';
COMMENT ON COLUMN game_results.nasty_nates IS 'Count of exceptional plays/shots (Nasty Nates)';
COMMENT ON COLUMN game_results.pegs IS 'Times player was hit by ball during game';
COMMENT ON COLUMN match_results.needs_confirmation IS 'Whether this result needs confirmation from other players';
COMMENT ON COLUMN match_results.confirmed_by IS 'Array of user IDs who have confirmed this result';


-- ============================================================
-- 009_comprehensive_rls_policies.sql
-- ============================================================

-- Comprehensive RLS Policies to fix critical security vulnerabilities
-- This migration adds all missing policies identified in the audit

-- ============================================================================
-- GROUP_MEMBERS POLICIES
-- ============================================================================
CREATE POLICY "Users can view members of their groups" ON group_members
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid)
  );

CREATE POLICY "Users can join groups" ON group_members
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Admins can remove members" ON group_members
  FOR DELETE USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()::uuid AND role IN ('admin', 'mod')
    )
  );

CREATE POLICY "Admins can update member roles" ON group_members
  FOR UPDATE USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()::uuid AND role = 'admin'
    )
  );

-- ============================================================================
-- AVAILABILITY_BLOCKS POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own availability" ON availability_blocks
  FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can view group members' availability" ON availability_blocks
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid)
  );

CREATE POLICY "Users can create their own availability" ON availability_blocks
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update their own availability" ON availability_blocks
  FOR UPDATE USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can delete their own availability" ON availability_blocks
  FOR DELETE USING (user_id = auth.uid()::uuid);

-- ============================================================================
-- LFG_POSTS POLICIES
-- ============================================================================
CREATE POLICY "Group members can view LFG posts" ON lfg_posts
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid)
  );

CREATE POLICY "Group members can create LFG posts" ON lfg_posts
  FOR INSERT WITH CHECK (
    created_by = auth.uid()::uuid AND
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid)
  );

CREATE POLICY "Post creators can update their posts" ON lfg_posts
  FOR UPDATE USING (created_by = auth.uid()::uuid);

CREATE POLICY "Post creators can delete their posts" ON lfg_posts
  FOR DELETE USING (created_by = auth.uid()::uuid);

-- ============================================================================
-- LFG_TIME_OPTIONS POLICIES
-- ============================================================================
CREATE POLICY "Users can view time options for visible LFG posts" ON lfg_time_options
  FOR SELECT USING (
    lfg_post_id IN (
      SELECT id FROM lfg_posts WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid
      )
    )
  );

CREATE POLICY "Post creators can manage time options" ON lfg_time_options
  FOR ALL USING (
    lfg_post_id IN (SELECT id FROM lfg_posts WHERE created_by = auth.uid()::uuid)
  );

-- ============================================================================
-- LFG_CLAIMS POLICIES
-- ============================================================================
CREATE POLICY "Users can view claims for visible LFG posts" ON lfg_claims
  FOR SELECT USING (
    lfg_post_id IN (
      SELECT id FROM lfg_posts WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid
      )
    )
  );

CREATE POLICY "Users can claim LFG spots" ON lfg_claims
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update their own claims" ON lfg_claims
  FOR UPDATE USING (user_id = auth.uid()::uuid);

-- ============================================================================
-- SESSIONS POLICIES
-- ============================================================================
CREATE POLICY "Group members can view sessions" ON sessions
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid)
  );

CREATE POLICY "Group members can create sessions" ON sessions
  FOR INSERT WITH CHECK (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid)
  );

CREATE POLICY "Group admins can update sessions" ON sessions
  FOR UPDATE USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()::uuid AND role IN ('admin', 'mod')
    )
  );

-- ============================================================================
-- SESSION_PARTICIPANTS POLICIES
-- ============================================================================
CREATE POLICY "Users can view participants in their group sessions" ON session_participants
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM sessions WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid
      )
    )
  );

CREATE POLICY "Users can join sessions" ON session_participants
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update their own participation" ON session_participants
  FOR UPDATE USING (user_id = auth.uid()::uuid);

-- ============================================================================
-- MATCH_RESULTS POLICIES
-- ============================================================================
CREATE POLICY "Users can view results from their sessions" ON match_results
  FOR SELECT USING (
    session_id IN (
      SELECT session_id FROM session_participants WHERE user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Session participants can create results" ON match_results
  FOR INSERT WITH CHECK (
    created_by = auth.uid()::uuid AND
    session_id IN (
      SELECT session_id FROM session_participants WHERE user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Result creators can update their results" ON match_results
  FOR UPDATE USING (created_by = auth.uid()::uuid);

-- ============================================================================
-- RESULT_CONFIRMATIONS POLICIES
-- ============================================================================
CREATE POLICY "Users can view confirmations for their session results" ON result_confirmations
  FOR SELECT USING (
    match_result_id IN (
      SELECT id FROM match_results WHERE session_id IN (
        SELECT session_id FROM session_participants WHERE user_id = auth.uid()::uuid
      )
    )
  );

CREATE POLICY "Session participants can confirm results" ON result_confirmations
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::uuid AND
    match_result_id IN (
      SELECT id FROM match_results WHERE session_id IN (
        SELECT session_id FROM session_participants WHERE user_id = auth.uid()::uuid
      )
    )
  );

-- ============================================================================
-- GAME_RESULTS POLICIES (Missing from original schema!)
-- ============================================================================
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view game results from their sessions" ON game_results
  FOR SELECT USING (
    session_id IN (
      SELECT session_id FROM session_participants WHERE user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Session participants can log their game results" ON game_results
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT session_id FROM session_participants WHERE user_id = auth.uid()::uuid
    )
  );

-- ============================================================================
-- PEER_RATINGS POLICIES
-- ============================================================================
CREATE POLICY "Users can view ratings they gave or received" ON peer_ratings
  FOR SELECT USING (
    rater_id = auth.uid()::uuid OR rated_user_id = auth.uid()::uuid
  );

CREATE POLICY "Session participants can rate other participants" ON peer_ratings
  FOR INSERT WITH CHECK (
    rater_id = auth.uid()::uuid AND
    session_id IN (
      SELECT session_id FROM session_participants WHERE user_id = auth.uid()::uuid
    )
  );

-- ============================================================================
-- CONSENSUS_LEVELS POLICIES
-- ============================================================================
CREATE POLICY "Users can view consensus levels in their groups" ON consensus_levels
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid)
  );

-- ============================================================================
-- TOKEN_LEDGER POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own token history" ON token_ledger
  FOR SELECT USING (user_id = auth.uid()::uuid);

-- Only the app (via SECURITY DEFINER functions) can insert tokens
-- No direct INSERT policy for users

-- ============================================================================
-- TOKEN_BALANCES POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own balance" ON token_balances
  FOR SELECT USING (user_id = auth.uid()::uuid);

-- ============================================================================
-- FEED_POSTS POLICIES
-- ============================================================================
CREATE POLICY "Group members can view feed posts" ON feed_posts
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid)
  );

CREATE POLICY "Group members can create feed posts" ON feed_posts
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::uuid AND
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid)
  );

-- ============================================================================
-- GROUP_MEMBER_STATS POLICIES (From migration 007)
-- ============================================================================
ALTER TABLE group_member_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view group stats" ON group_member_stats
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid)
  );

-- Only app (via SECURITY DEFINER function) can insert/update stats
-- No direct INSERT/UPDATE policy for users

-- ============================================================================
-- FRIENDSHIPS POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own friendships" ON friendships
  FOR SELECT USING (
    user_id = auth.uid()::uuid OR friend_id = auth.uid()::uuid
  );

CREATE POLICY "Users can create friendship requests" ON friendships
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update friendships they're involved in" ON friendships
  FOR UPDATE USING (
    user_id = auth.uid()::uuid OR friend_id = auth.uid()::uuid
  );

CREATE POLICY "Users can delete their own friendships" ON friendships
  FOR DELETE USING (
    user_id = auth.uid()::uuid OR friend_id = auth.uid()::uuid
  );

-- ============================================================================
-- AVOID_LIST POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own avoid list" ON avoid_list
  FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can manage their own avoid list" ON avoid_list
  FOR ALL USING (user_id = auth.uid()::uuid);

-- ============================================================================
-- Additional security: Ensure users can see other users' profiles
-- ============================================================================
CREATE POLICY "Users can view other users' basic profiles" ON users
  FOR SELECT USING (
    -- Can view users in same groups
    id IN (
      SELECT DISTINCT gm.user_id FROM group_members gm
      WHERE gm.group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid
      )
    )
    OR id = auth.uid()::uuid
  );


-- ============================================================
-- 010_token_deduplication_and_security.sql
-- ============================================================

-- Fix token race condition and add deduplication
-- Addresses audit finding: Users can earn unlimited tokens by spamming actions

-- ============================================================================
-- Add unique constraint to prevent duplicate token awards
-- ============================================================================
ALTER TABLE token_ledger ADD CONSTRAINT unique_token_award
  UNIQUE NULLS NOT DISTINCT (user_id, ref_type, ref_id);

-- Add index for faster daily cap queries
CREATE INDEX IF NOT EXISTS idx_token_ledger_daily_cap
  ON token_ledger(user_id, created_at)
  WHERE delta > 0;

-- ============================================================================
-- Safe token award function with deduplication and daily cap
-- ============================================================================
CREATE OR REPLACE FUNCTION award_tokens_safe(
  p_user_id UUID,
  p_amount INT,
  p_reason TEXT,
  p_ref_type TEXT DEFAULT NULL,
  p_ref_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_daily_total INT;
  v_daily_cap INT := 300;
BEGIN
  -- Check if already awarded (prevents duplicates)
  IF p_ref_type IS NOT NULL AND p_ref_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM token_ledger
      WHERE user_id = p_user_id
        AND ref_type = p_ref_type
        AND ref_id = p_ref_id
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'already_awarded',
        'message', 'Tokens already awarded for this action'
      );
    END IF;
  END IF;

  -- Check daily cap (only for positive awards)
  IF p_amount > 0 THEN
    SELECT COALESCE(SUM(delta), 0) INTO v_daily_total
    FROM token_ledger
    WHERE user_id = p_user_id
      AND created_at >= CURRENT_DATE
      AND delta > 0;

    IF v_daily_total + p_amount > v_daily_cap THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'daily_cap_exceeded',
        'message', format('Would exceed daily cap of %s tokens', v_daily_cap),
        'current_total', v_daily_total,
        'cap', v_daily_cap
      );
    END IF;
  END IF;

  -- Award tokens
  INSERT INTO token_ledger (user_id, delta, reason, ref_type, ref_id)
  VALUES (p_user_id, p_amount, p_reason, p_ref_type, p_ref_id);

  -- Update balance
  INSERT INTO token_balances (user_id, balance, updated_at)
  VALUES (p_user_id, p_amount, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    balance = token_balances.balance + p_amount,
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'amount', p_amount,
    'message', 'Tokens awarded successfully'
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'duplicate',
      'message', 'Tokens already awarded for this action'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Add validation to SECURITY DEFINER functions
-- ============================================================================

-- Update increment_pickle_trophies to require session context
CREATE OR REPLACE FUNCTION increment_pickle_trophies(
  p_user_id UUID,
  p_session_id UUID
)
RETURNS void AS $$
DECLARE
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid()::uuid;

  -- Verify caller was in this session
  IF NOT EXISTS (
    SELECT 1 FROM session_participants
    WHERE session_id = p_session_id
      AND user_id = v_caller_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: caller was not in this session';
  END IF;

  -- Verify target user was in this session and on winning team
  IF NOT EXISTS (
    SELECT 1 FROM session_participants sp
    JOIN match_results mr ON mr.session_id = sp.session_id
    WHERE sp.session_id = p_session_id
      AND sp.user_id = p_user_id
      AND (
        (sp.team = 1 AND mr.team1_score > mr.team2_score AND mr.team1_score = 11 AND mr.team2_score = 0)
        OR (sp.team = 2 AND mr.team2_score > mr.team1_score AND mr.team2_score = 11 AND mr.team1_score = 0)
      )
  ) THEN
    RAISE EXCEPTION 'Unauthorized: user did not win with pickle score';
  END IF;

  UPDATE users
  SET pickle_trophy_count = pickle_trophy_count + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Add unique constraint to prevent duplicate match results per session
-- ============================================================================
ALTER TABLE match_results ADD CONSTRAINT unique_session_result
  UNIQUE(session_id);

-- ============================================================================
-- Add team composition validation function
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_session_teams(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_format TEXT;
  v_team1_count INT;
  v_team2_count INT;
  v_duplicate_check INT;
BEGIN
  -- Get session format
  SELECT format INTO v_format
  FROM sessions
  WHERE id = p_session_id;

  -- Count players per team
  SELECT
    COUNT(*) FILTER (WHERE team = 1),
    COUNT(*) FILTER (WHERE team = 2)
  INTO v_team1_count, v_team2_count
  FROM session_participants
  WHERE session_id = p_session_id;

  -- Check for duplicates (user on both teams - shouldn't be possible with unique constraint but check anyway)
  SELECT COUNT(*) INTO v_duplicate_check
  FROM (
    SELECT user_id, COUNT(*) as team_count
    FROM session_participants
    WHERE session_id = p_session_id
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF v_duplicate_check > 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'duplicate_player',
      'message', 'A player cannot be on multiple teams'
    );
  END IF;

  -- Validate team sizes based on format
  IF v_format = 'doubles' THEN
    IF v_team1_count != 2 OR v_team2_count != 2 THEN
      RETURN jsonb_build_object(
        'valid', false,
        'reason', 'invalid_team_size',
        'message', 'Doubles requires exactly 2 players per team',
        'team1_count', v_team1_count,
        'team2_count', v_team2_count
      );
    END IF;
  ELSIF v_format = 'singles' THEN
    IF v_team1_count != 1 OR v_team2_count != 1 THEN
      RETURN jsonb_build_object(
        'valid', false,
        'reason', 'invalid_team_size',
        'message', 'Singles requires exactly 1 player per team',
        'team1_count', v_team1_count,
        'team2_count', v_team2_count
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'message', 'Team composition is valid'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Add validation to update_group_member_stats
-- ============================================================================
CREATE OR REPLACE FUNCTION update_group_member_stats(p_session_id UUID)
RETURNS void AS $$
DECLARE
  v_group_id UUID;
  v_winning_team INT;
  v_participant RECORD;
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid()::uuid;

  -- Verify caller has access to this session
  IF NOT EXISTS (
    SELECT 1 FROM session_participants
    WHERE session_id = p_session_id
      AND user_id = v_caller_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: caller does not have access to this session';
  END IF;

  -- Get session details
  SELECT group_id INTO v_group_id
  FROM sessions
  WHERE id = p_session_id;

  -- Get winning team from game_results
  SELECT team INTO v_winning_team
  FROM game_results
  WHERE session_id = p_session_id
  ORDER BY score DESC
  LIMIT 1;

  -- Update stats for each participant
  FOR v_participant IN
    SELECT
      sp.user_id,
      sp.team,
      sp.checked_in,
      COALESCE(gr.aces, 0) as aces,
      COALESCE(gr.nasty_nates, 0) as nasty_nates,
      COALESCE(gr.pegs, 0) as pegs,
      CASE WHEN sp.team = v_winning_team THEN 1 ELSE 0 END as won
    FROM session_participants sp
    LEFT JOIN game_results gr ON gr.user_id = sp.user_id AND gr.session_id = p_session_id
    WHERE sp.session_id = p_session_id
  LOOP
    -- Insert or update group member stats
    INSERT INTO group_member_stats (
      group_id,
      user_id,
      games_played,
      games_won,
      total_aces,
      total_nasty_nates,
      total_pegs,
      show_rate,
      last_played_at
    )
    VALUES (
      v_group_id,
      v_participant.user_id,
      1,
      v_participant.won,
      v_participant.aces,
      v_participant.nasty_nates,
      v_participant.pegs,
      CASE WHEN v_participant.checked_in THEN 1.0 ELSE 0.0 END,
      NOW()
    )
    ON CONFLICT (group_id, user_id) DO UPDATE SET
      games_played = group_member_stats.games_played + 1,
      games_won = group_member_stats.games_won + v_participant.won,
      total_aces = group_member_stats.total_aces + v_participant.aces,
      total_nasty_nates = group_member_stats.total_nasty_nates + v_participant.nasty_nates,
      total_pegs = group_member_stats.total_pegs + v_participant.pegs,
      show_rate = (
        (group_member_stats.show_rate * group_member_stats.games_played) +
        CASE WHEN v_participant.checked_in THEN 1.0 ELSE 0.0 END
      ) / (group_member_stats.games_played + 1),
      last_played_at = NOW();
  END LOOP;

  -- Update pickle trophy count if applicable
  FOR v_participant IN
    SELECT user_id
    FROM game_results
    WHERE session_id = p_session_id AND pickle_trophy = true
  LOOP
    UPDATE group_member_stats
    SET pickle_trophies = pickle_trophies + 1
    WHERE group_id = v_group_id AND user_id = v_participant.user_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION award_tokens_safe IS 'Safely award tokens with deduplication and daily cap enforcement';
COMMENT ON FUNCTION validate_session_teams IS 'Validate team composition for a session before allowing result submission';


-- ============================================================
-- 011_performance_indexes.sql
-- ============================================================

-- Add missing performance indexes identified in audit

-- ============================================================================
-- Indexes for confirmation queries
-- ============================================================================

-- For finding pending confirmations by user
CREATE INDEX IF NOT EXISTS idx_result_confirmations_user
  ON result_confirmations(user_id, status);

-- For array containment checks on confirmed_by
CREATE INDEX IF NOT EXISTS idx_match_results_confirmed_by_gin
  ON match_results USING GIN (confirmed_by);

-- ============================================================================
-- Indexes for leaderboard queries
-- ============================================================================

-- For sorting leaderboards by different stats
CREATE INDEX IF NOT EXISTS idx_group_member_stats_games
  ON group_member_stats(group_id, games_played DESC);

CREATE INDEX IF NOT EXISTS idx_group_member_stats_wins
  ON group_member_stats(group_id, games_won DESC);

CREATE INDEX IF NOT EXISTS idx_group_member_stats_aces
  ON group_member_stats(group_id, total_aces DESC);

CREATE INDEX IF NOT EXISTS idx_group_member_stats_nasty_nates
  ON group_member_stats(group_id, total_nasty_nates DESC);

CREATE INDEX IF NOT EXISTS idx_group_member_stats_show_rate
  ON group_member_stats(group_id, show_rate DESC);

-- ============================================================================
-- Indexes for session and participant queries
-- ============================================================================

-- For finding user's sessions efficiently
CREATE INDEX IF NOT EXISTS idx_session_participants_user_session
  ON session_participants(user_id, session_id);

-- For session status queries
CREATE INDEX IF NOT EXISTS idx_sessions_status_start
  ON sessions(status, start_at) WHERE status = 'scheduled';

-- ============================================================================
-- Indexes for feed and LFG queries
-- ============================================================================

-- For feed queries with time ordering
CREATE INDEX IF NOT EXISTS idx_feed_posts_group_created
  ON feed_posts(group_id, created_at DESC);

-- For finding open LFG posts
CREATE INDEX IF NOT EXISTS idx_lfg_posts_status_created
  ON lfg_posts(group_id, status, created_at DESC) WHERE status = 'open';

-- ============================================================================
-- Indexes for availability queries
-- ============================================================================

-- For group availability lookups
CREATE INDEX IF NOT EXISTS idx_availability_group_user
  ON availability_blocks(group_id, user_id) WHERE active = true;

-- ============================================================================
-- Composite indexes for common join patterns
-- ============================================================================

-- For session participants with team info
CREATE INDEX IF NOT EXISTS idx_session_participants_session_team
  ON session_participants(session_id, team);

-- For game results by match
CREATE INDEX IF NOT EXISTS idx_game_results_match
  ON game_results(match_result_id, user_id);

COMMENT ON INDEX idx_match_results_confirmed_by_gin IS 'Speeds up array containment checks for confirmed_by';
COMMENT ON INDEX idx_sessions_status_start IS 'Optimizes queries for upcoming scheduled sessions';
COMMENT ON INDEX idx_lfg_posts_status_created IS 'Optimizes LFG board queries for open posts';


-- ============================================================
-- 012_availability_system.sql
-- ============================================================

-- Migration 012: Weekly Availability System
-- Allows users to post when they're available to play this week
-- Other users can see matches and create games together

-- ============================================================================
-- TABLES
-- ============================================================================

-- User availability slots
CREATE TABLE IF NOT EXISTS user_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  
  -- When they're available
  available_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Optional details
  preferred_location TEXT,
  notes TEXT,
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate slots for same user/time
  UNIQUE(user_id, available_date, start_time)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Query available slots by date
CREATE INDEX idx_availability_date ON user_availability(available_date) WHERE active = true;

-- Query by user
CREATE INDEX idx_availability_user ON user_availability(user_id) WHERE active = true;

-- Query by group
CREATE INDEX idx_availability_group ON user_availability(group_id) WHERE active = true;

-- Find matches (same date + overlapping time)
CREATE INDEX idx_availability_matching ON user_availability(available_date, start_time, end_time) WHERE active = true;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_availability ENABLE ROW LEVEL SECURITY;

-- Users can view availability in their groups
CREATE POLICY "Users can view availability in their groups" ON user_availability
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid
    )
  );

-- Users can create their own availability
CREATE POLICY "Users can create their own availability" ON user_availability
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

-- Users can update their own availability
CREATE POLICY "Users can update their own availability" ON user_availability
  FOR UPDATE USING (user_id = auth.uid()::uuid);

-- Users can delete their own availability
CREATE POLICY "Users can delete their own availability" ON user_availability
  FOR DELETE USING (user_id = auth.uid()::uuid);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Find matching availability (same date, overlapping times)
CREATE OR REPLACE FUNCTION find_availability_matches(
  p_user_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS TABLE (
  availability_id UUID,
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  available_date DATE,
  start_time TIME,
  end_time TIME,
  preferred_location TEXT,
  notes TEXT,
  atp_rating NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.id as availability_id,
    u.id as user_id,
    u.username,
    u.display_name,
    u.avatar_url,
    ua.available_date,
    ua.start_time,
    ua.end_time,
    ua.preferred_location,
    ua.notes,
    u.atp_rating
  FROM user_availability ua
  JOIN users u ON ua.user_id = u.id
  WHERE ua.available_date = p_date
    AND ua.active = true
    AND ua.user_id != p_user_id
    AND (
      -- Times overlap
      (ua.start_time <= p_end_time AND ua.end_time >= p_start_time)
    )
    -- Only show users in same groups
    AND ua.group_id IN (
      SELECT group_id FROM group_members WHERE user_id = p_user_id
    )
  ORDER BY ua.start_time, u.atp_rating DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's availability for the current week
CREATE OR REPLACE FUNCTION get_my_availability_this_week(p_user_id UUID)
RETURNS TABLE (
  availability_id UUID,
  available_date DATE,
  start_time TIME,
  end_time TIME,
  preferred_location TEXT,
  notes TEXT,
  match_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.id as availability_id,
    ua.available_date,
    ua.start_time,
    ua.end_time,
    ua.preferred_location,
    ua.notes,
    COUNT(DISTINCT matches.id) as match_count
  FROM user_availability ua
  LEFT JOIN user_availability matches ON (
    matches.available_date = ua.available_date
    AND matches.active = true
    AND matches.user_id != ua.user_id
    AND (matches.start_time <= ua.end_time AND matches.end_time >= ua.start_time)
    AND matches.group_id IN (
      SELECT group_id FROM group_members WHERE user_id = p_user_id
    )
  )
  WHERE ua.user_id = p_user_id
    AND ua.active = true
    AND ua.available_date >= CURRENT_DATE
    AND ua.available_date <= CURRENT_DATE + INTERVAL '7 days'
  GROUP BY ua.id, ua.available_date, ua.start_time, ua.end_time, ua.preferred_location, ua.notes
  ORDER BY ua.available_date, ua.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-expire old availability (cleanup function)
CREATE OR REPLACE FUNCTION expire_old_availability()
RETURNS void AS $$
BEGIN
  UPDATE user_availability
  SET active = false
  WHERE available_date < CURRENT_DATE
    AND active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update timestamp on changes
CREATE OR REPLACE FUNCTION update_availability_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_availability_timestamp
  BEFORE UPDATE ON user_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_availability_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_availability IS 'User availability slots for organizing pickup games';
COMMENT ON COLUMN user_availability.available_date IS 'The date they are available';
COMMENT ON COLUMN user_availability.start_time IS 'Start time of availability window';
COMMENT ON COLUMN user_availability.end_time IS 'End time of availability window';
COMMENT ON COLUMN user_availability.preferred_location IS 'Preferred court location (optional)';
COMMENT ON COLUMN user_availability.notes IS 'Additional notes like "prefer doubles" (optional)';
COMMENT ON COLUMN user_availability.active IS 'False for expired or cancelled slots';

COMMENT ON FUNCTION find_availability_matches IS 'Find other users available at the same time';
COMMENT ON FUNCTION get_my_availability_this_week IS 'Get current user availability with match counts';
COMMENT ON FUNCTION expire_old_availability IS 'Cleanup function to mark past dates as inactive';

