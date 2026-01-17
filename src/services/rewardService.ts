import { supabase } from './supabase';

/**
 * Reward Service - Makes tokens actually matter
 *
 * Connects gameplay to rewards:
 * - Awards tokens for verified matches
 * - Tracks daily caps to prevent abuse
 * - Updates balances in real-time
 */

const DAILY_EARN_CAP = 200; // Max tokens per day
const REWARDS = {
  MATCH_RESULT: 10,
  QUICK_CONFIRM: 5,
  PICKLE_TROPHY: 50,
  WEEKLY_STREAK: 20,
  FRIEND_INVITE: 15,
};

class RewardService {
  /**
   * Award tokens to a user
   */
  async awardTokens(
    userId: string,
    amount: number,
    reason: string,
    refType?: string,
    refId?: string
  ): Promise<boolean> {
    try {
      // Check daily cap
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todayTokens } = await supabase
        .from('token_ledger')
        .select('delta')
        .eq('user_id', userId)
        .gte('created_at', today.toISOString());

      const earnedToday = todayTokens?.reduce((sum, t) => sum + (t.delta > 0 ? t.delta : 0), 0) || 0;

      if (earnedToday >= DAILY_EARN_CAP) {
        console.log(`User ${userId} hit daily cap`);
        return false;
      }

      // Cap amount if it would exceed daily limit
      const cappedAmount = Math.min(amount, DAILY_EARN_CAP - earnedToday);

      // Add to ledger
      const { error: ledgerError } = await supabase
        .from('token_ledger')
        .insert({
          user_id: userId,
          delta: cappedAmount,
          reason,
          ref_type: refType || null,
          ref_id: refId || null,
        });

      if (ledgerError) throw ledgerError;

      // Update balance
      await this.updateBalance(userId);

      return true;
    } catch (error) {
      console.error('Error awarding tokens:', error);
      return false;
    }
  }

  /**
   * Update user's token balance (computed from ledger)
   */
  private async updateBalance(userId: string): Promise<void> {
    try {
      const { data: ledger } = await supabase
        .from('token_ledger')
        .select('delta')
        .eq('user_id', userId);

      const balance = ledger?.reduce((sum, t) => sum + t.delta, 0) || 0;

      await supabase
        .from('token_balances')
        .upsert({ user_id: userId, balance, updated_at: new Date().toISOString() });
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  }

  /**
   * Get user's current balance
   */
  async getBalance(userId: string): Promise<number> {
    try {
      const { data } = await supabase
        .from('token_balances')
        .select('balance')
        .eq('user_id', userId)
        .single();

      return data?.balance || 0;
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }

  /**
   * Check if user can earn more tokens today
   */
  async canEarnMore(userId: string): Promise<boolean> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('token_ledger')
        .select('delta')
        .eq('user_id', userId)
        .gte('created_at', today.toISOString());

      const earnedToday = data?.reduce((sum, t) => sum + (t.delta > 0 ? t.delta : 0), 0) || 0;

      return earnedToday < DAILY_EARN_CAP;
    } catch (error) {
      console.error('Error checking daily cap:', error);
      return false;
    }
  }

  /**
   * Award tokens for match confirmation
   */
  async awardConfirmationTokens(userId: string, resultId: string): Promise<void> {
    // Check how quickly they confirmed (within 1 hour = bonus)
    const { data: result } = await supabase
      .from('match_results')
      .select('created_at')
      .eq('id', resultId)
      .single();

    if (result) {
      const timeDiff = Date.now() - new Date(result.created_at).getTime();
      const oneHour = 60 * 60 * 1000;

      if (timeDiff < oneHour) {
        await this.awardTokens(
          userId,
          REWARDS.QUICK_CONFIRM,
          'Quick result confirmation',
          'match_result',
          resultId
        );
      }
    }
  }

  /**
   * Check and award weekly streak bonus
   */
  async checkWeeklyStreak(userId: string): Promise<void> {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const { data: sessions } = await supabase
        .from('session_participants')
        .select('session_id, sessions!inner(created_at, status)')
        .eq('user_id', userId)
        .eq('sessions.status', 'completed')
        .gte('sessions.created_at', oneWeekAgo.toISOString());

      if (sessions && sessions.length >= 3) {
        // Played 3+ games this week
        await this.awardTokens(
          userId,
          REWARDS.WEEKLY_STREAK,
          'Weekly activity streak (3+ games)',
          'weekly_streak',
          null
        );
      }
    } catch (error) {
      console.error('Error checking weekly streak:', error);
    }
  }
}

export const rewardService = new RewardService();
export { REWARDS };
