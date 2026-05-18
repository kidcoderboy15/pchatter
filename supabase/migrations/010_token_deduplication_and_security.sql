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

-- Update increment_pickle_trophies to require session context.
-- Drop the old single-argument version from migration 002 first: CREATE OR
-- REPLACE cannot change a function's argument list, so without this DROP the
-- old, unauthenticated version would survive as a separate overload.
DROP FUNCTION IF EXISTS increment_pickle_trophies(UUID);

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
