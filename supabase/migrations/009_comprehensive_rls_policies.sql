-- Comprehensive RLS Policies to fix critical security vulnerabilities
-- This migration adds all missing policies identified in the audit

-- ============================================================================
-- GROUP_MEMBERS POLICIES
-- ============================================================================
CREATE POLICY "Users can view members of their groups" ON group_members
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid)
  );

CREATE POLICY "Users can join groups" ON group_members
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Admins can remove members" ON group_members
  FOR DELETE USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()::uuid AND role IN ('admin', 'mod')
    )
  );

CREATE POLICY "Admins can update member roles" ON group_members
  FOR UPDATE USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()::uuid AND role = 'admin'
    )
  );

-- ============================================================================
-- AVAILABILITY_BLOCKS POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own availability" ON availability_blocks
  FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can view group members' availability" ON availability_blocks
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid)
  );

CREATE POLICY "Users can create their own availability" ON availability_blocks
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update their own availability" ON availability_blocks
  FOR UPDATE USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can delete their own availability" ON availability_blocks
  FOR DELETE USING (user_id = auth.uid()::uuid);

-- ============================================================================
-- LFG_POSTS POLICIES
-- ============================================================================
CREATE POLICY "Group members can view LFG posts" ON lfg_posts
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid)
  );

CREATE POLICY "Group members can create LFG posts" ON lfg_posts
  FOR INSERT WITH CHECK (
    created_by = auth.uid()::uuid AND
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid)
  );

CREATE POLICY "Post creators can update their posts" ON lfg_posts
  FOR UPDATE USING (created_by = auth.uid()::uuid);

CREATE POLICY "Post creators can delete their posts" ON lfg_posts
  FOR DELETE USING (created_by = auth.uid()::uuid);

-- ============================================================================
-- LFG_TIME_OPTIONS POLICIES
-- ============================================================================
CREATE POLICY "Users can view time options for visible LFG posts" ON lfg_time_options
  FOR SELECT USING (
    lfg_post_id IN (
      SELECT id FROM lfg_posts WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid
      )
    )
  );

CREATE POLICY "Post creators can manage time options" ON lfg_time_options
  FOR ALL USING (
    lfg_post_id IN (SELECT id FROM lfg_posts WHERE created_by = auth.uid()::uuid)
  );

-- ============================================================================
-- LFG_CLAIMS POLICIES
-- ============================================================================
CREATE POLICY "Users can view claims for visible LFG posts" ON lfg_claims
  FOR SELECT USING (
    lfg_post_id IN (
      SELECT id FROM lfg_posts WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid
      )
    )
  );

CREATE POLICY "Users can claim LFG spots" ON lfg_claims
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update their own claims" ON lfg_claims
  FOR UPDATE USING (user_id = auth.uid()::uuid);

-- ============================================================================
-- SESSIONS POLICIES
-- ============================================================================
CREATE POLICY "Group members can view sessions" ON sessions
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid)
  );

CREATE POLICY "Group members can create sessions" ON sessions
  FOR INSERT WITH CHECK (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid)
  );

CREATE POLICY "Group admins can update sessions" ON sessions
  FOR UPDATE USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()::uuid AND role IN ('admin', 'mod')
    )
  );

-- ============================================================================
-- SESSION_PARTICIPANTS POLICIES
-- ============================================================================
CREATE POLICY "Users can view participants in their group sessions" ON session_participants
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM sessions WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid
      )
    )
  );

CREATE POLICY "Users can join sessions" ON session_participants
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update their own participation" ON session_participants
  FOR UPDATE USING (user_id = auth.uid()::uuid);

-- ============================================================================
-- MATCH_RESULTS POLICIES
-- ============================================================================
CREATE POLICY "Users can view results from their sessions" ON match_results
  FOR SELECT USING (
    session_id IN (
      SELECT session_id FROM session_participants WHERE user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Session participants can create results" ON match_results
  FOR INSERT WITH CHECK (
    created_by = auth.uid()::uuid AND
    session_id IN (
      SELECT session_id FROM session_participants WHERE user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Result creators can update their results" ON match_results
  FOR UPDATE USING (created_by = auth.uid()::uuid);

-- ============================================================================
-- RESULT_CONFIRMATIONS POLICIES
-- ============================================================================
CREATE POLICY "Users can view confirmations for their session results" ON result_confirmations
  FOR SELECT USING (
    match_result_id IN (
      SELECT id FROM match_results WHERE session_id IN (
        SELECT session_id FROM session_participants WHERE user_id = auth.uid()::uuid
      )
    )
  );

CREATE POLICY "Session participants can confirm results" ON result_confirmations
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::uuid AND
    match_result_id IN (
      SELECT id FROM match_results WHERE session_id IN (
        SELECT session_id FROM session_participants WHERE user_id = auth.uid()::uuid
      )
    )
  );

-- ============================================================================
-- GAME_RESULTS POLICIES (Missing from original schema!)
-- ============================================================================
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view game results from their sessions" ON game_results
  FOR SELECT USING (
    session_id IN (
      SELECT session_id FROM session_participants WHERE user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Session participants can log their game results" ON game_results
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT session_id FROM session_participants WHERE user_id = auth.uid()::uuid
    )
  );

-- ============================================================================
-- PEER_RATINGS POLICIES
-- ============================================================================
CREATE POLICY "Users can view ratings they gave or received" ON peer_ratings
  FOR SELECT USING (
    rater_id = auth.uid()::uuid OR rated_user_id = auth.uid()::uuid
  );

CREATE POLICY "Session participants can rate other participants" ON peer_ratings
  FOR INSERT WITH CHECK (
    rater_id = auth.uid()::uuid AND
    session_id IN (
      SELECT session_id FROM session_participants WHERE user_id = auth.uid()::uuid
    )
  );

-- ============================================================================
-- CONSENSUS_LEVELS POLICIES
-- ============================================================================
CREATE POLICY "Users can view consensus levels in their groups" ON consensus_levels
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid)
  );

-- ============================================================================
-- TOKEN_LEDGER POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own token history" ON token_ledger
  FOR SELECT USING (user_id = auth.uid()::uuid);

-- Only the app (via SECURITY DEFINER functions) can insert tokens
-- No direct INSERT policy for users

-- ============================================================================
-- TOKEN_BALANCES POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own balance" ON token_balances
  FOR SELECT USING (user_id = auth.uid()::uuid);

-- ============================================================================
-- FEED_POSTS POLICIES
-- ============================================================================
CREATE POLICY "Group members can view feed posts" ON feed_posts
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid)
  );

CREATE POLICY "Group members can create feed posts" ON feed_posts
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::uuid AND
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid)
  );

-- ============================================================================
-- GROUP_MEMBER_STATS POLICIES (From migration 007)
-- ============================================================================
ALTER TABLE group_member_stats ENABLE ROW LEVEL SECURITY;

-- NOTE: the SELECT policy "Group members can view group stats" is already
-- created in migration 007. Re-creating it here would fail with
-- "policy already exists", so it is intentionally omitted.

-- Only app (via SECURITY DEFINER function) can insert/update stats
-- No direct INSERT/UPDATE policy for users

-- ============================================================================
-- FRIENDSHIPS POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own friendships" ON friendships
  FOR SELECT USING (
    user_id = auth.uid()::uuid OR friend_id = auth.uid()::uuid
  );

CREATE POLICY "Users can create friendship requests" ON friendships
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update friendships they're involved in" ON friendships
  FOR UPDATE USING (
    user_id = auth.uid()::uuid OR friend_id = auth.uid()::uuid
  );

CREATE POLICY "Users can delete their own friendships" ON friendships
  FOR DELETE USING (
    user_id = auth.uid()::uuid OR friend_id = auth.uid()::uuid
  );

-- ============================================================================
-- AVOID_LIST POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own avoid list" ON avoid_list
  FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can manage their own avoid list" ON avoid_list
  FOR ALL USING (user_id = auth.uid()::uuid);

-- ============================================================================
-- Additional security: Ensure users can see other users' profiles
-- ============================================================================
CREATE POLICY "Users can view other users' basic profiles" ON users
  FOR SELECT USING (
    -- Can view users in same groups
    id IN (
      SELECT DISTINCT gm.user_id FROM group_members gm
      WHERE gm.group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()::uuid
      )
    )
    OR id = auth.uid()::uuid
  );
