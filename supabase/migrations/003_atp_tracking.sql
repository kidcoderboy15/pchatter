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
