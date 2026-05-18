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
  photo_url TEXT,
  available_date DATE,
  start_time TIME,
  end_time TIME,
  preferred_location TEXT,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.id as availability_id,
    u.id as user_id,
    u.username,
    u.display_name,
    u.photo_url,
    ua.available_date,
    ua.start_time,
    ua.end_time,
    ua.preferred_location,
    ua.notes
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
  ORDER BY ua.start_time;
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
