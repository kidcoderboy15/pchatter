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
