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
