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
