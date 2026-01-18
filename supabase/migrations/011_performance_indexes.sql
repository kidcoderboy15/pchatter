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
