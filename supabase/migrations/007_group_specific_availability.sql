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
