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
