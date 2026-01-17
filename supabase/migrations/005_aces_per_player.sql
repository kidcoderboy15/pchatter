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
