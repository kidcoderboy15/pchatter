import { supabase } from './supabase';

/**
 * Reward Service - Makes tokens actually matter
 *
 * Connects gameplay to rewards:
 * - Awards tokens for verified matches
 * - Tracks daily caps to prevent abuse
 * - Updates balances in real-time
 */

const DAILY_EARN_CAP = 300; // Max tokens per day (increased for active players)
const REWARDS = {
  MATCH_RESULT: 10,
  QUICK_CONFIRM: 5,
  PICKLE_TROPHY: 50,
  WEEKLY_STREAK: 20,
  FRIEND_INVITE: 75, // Bumped up - you get tokens when friend signs up
  REFERRAL_COMPLETE: 50, // BONUS when your invitee plays their first game
  DAILY_LOGIN: 5, // Just for opening the app
  STREAK_3_DAYS: 25,
  STREAK_7_DAYS: 75,
  STREAK_30_DAYS: 300,
  ACE_MILESTONE_10: 20, // First 10 aces
  ACE_MILESTONE_50: 50,
  ACE_MILESTONE_100: 100,
};

// Merch redemption costs (users spend tokens here)
const MERCH_COSTS = {
  STICKER_PACK: 200,      // ~1 week active play
  TOWEL: 500,             // ~2 weeks
  WATER_BOTTLE: 600,      // ~2 weeks
  HAT: 800,               // ~3 weeks
  TSHIRT: 1200,           // ~1 month
  PADDLE_COVER: 1800,     // ~2 months
  HOODIE: 2500,           // ~2-3 months
};

class RewardService {
  /**
   * Award tokens to a user (uses database function for deduplication and daily cap)
   */
  async awardTokens(
    userId: string,
    amount: number,
    reason: string,
    refType?: string,
    refId?: string
  ): Promise<boolean> {
    try {
      // Call database function that handles deduplication and daily cap
      const { data, error } = await supabase.rpc('award_tokens_safe', {
        p_user_id: userId,
        p_amount: amount,
        p_reason: reason,
        p_ref_type: refType || null,
        p_ref_id: refId || null,
      });

      if (error) {
        console.error('Error awarding tokens:', error);
        return false;
      }

      // Check result
      if (!data || !data.success) {
        if (data?.reason === 'already_awarded' || data?.reason === 'duplicate') {
          console.log(`Tokens already awarded for ${refType}:${refId}`);
        } else if (data?.reason === 'daily_cap_exceeded') {
          console.log(`User ${userId} hit daily cap`);
        }
        return false;
      }

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

  /**
   * Award tokens when user invites a friend who signs up
   */
  async awardInviteTokens(inviterId: string, inviteeId: string): Promise<void> {
    try {
      await this.awardTokens(
        inviterId,
        REWARDS.FRIEND_INVITE,
        '🎉 Friend joined via your invite!',
        'friend_invite',
        inviteeId
      );
    } catch (error) {
      console.error('Error awarding invite tokens:', error);
    }
  }

  /**
   * Award bonus when invitee completes their first game
   */
  async awardReferralComplete(inviterId: string, inviteeId: string): Promise<void> {
    try {
      await this.awardTokens(
        inviterId,
        REWARDS.REFERRAL_COMPLETE,
        '🔥 Your friend played their first game!',
        'referral_complete',
        inviteeId
      );
    } catch (error) {
      console.error('Error awarding referral completion:', error);
    }
  }

  /**
   * Award daily login bonus
   */
  async awardDailyLogin(userId: string): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if already awarded today
      const { data: todayLogin } = await supabase
        .from('token_ledger')
        .select('id')
        .eq('user_id', userId)
        .eq('reason', 'Daily login')
        .gte('created_at', today.toISOString())
        .limit(1);

      if (!todayLogin || todayLogin.length === 0) {
        await this.awardTokens(userId, REWARDS.DAILY_LOGIN, 'Daily login', 'daily_login', null);
      }
    } catch (error) {
      console.error('Error awarding daily login:', error);
    }
  }

  /**
   * Check and award login streak bonuses
   */
  async checkLoginStreak(userId: string): Promise<void> {
    try {
      // Get user's login history
      const { data: loginHistory } = await supabase
        .from('token_ledger')
        .select('created_at')
        .eq('user_id', userId)
        .eq('reason', 'Daily login')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!loginHistory || loginHistory.length === 0) return;

      // Calculate current streak
      let streak = 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 1; i < loginHistory.length; i++) {
        const currentDate = new Date(loginHistory[i].created_at);
        currentDate.setHours(0, 0, 0, 0);

        const previousDate = new Date(loginHistory[i - 1].created_at);
        previousDate.setHours(0, 0, 0, 0);

        const dayDiff = Math.floor((previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
          streak++;
        } else {
          break;
        }
      }

      // Award streak bonuses (only once per streak level)
      if (streak === 3) {
        await this.awardTokens(userId, REWARDS.STREAK_3_DAYS, '🔥 3-day streak!', 'streak_3', null);
      } else if (streak === 7) {
        await this.awardTokens(userId, REWARDS.STREAK_7_DAYS, '🔥🔥 7-day streak!', 'streak_7', null);
      } else if (streak === 30) {
        await this.awardTokens(userId, REWARDS.STREAK_30_DAYS, '🔥🔥🔥 30-day streak!', 'streak_30', null);
      }
    } catch (error) {
      console.error('Error checking login streak:', error);
    }
  }

  /**
   * Check and award ace milestone bonuses
   */
  async checkAceMilestones(userId: string, totalAces: number): Promise<void> {
    try {
      // Check which milestones have been reached
      const milestones = [
        { count: 10, reward: REWARDS.ACE_MILESTONE_10, reason: '🎾 10 lifetime aces!' },
        { count: 50, reward: REWARDS.ACE_MILESTONE_50, reason: '🎾🔥 50 lifetime aces!' },
        { count: 100, reward: REWARDS.ACE_MILESTONE_100, reason: '🎾⚡ 100 lifetime aces!' },
      ];

      for (const milestone of milestones) {
        if (totalAces >= milestone.count) {
          // Check if already awarded
          const { data: existing } = await supabase
            .from('token_ledger')
            .select('id')
            .eq('user_id', userId)
            .eq('reason', milestone.reason)
            .limit(1);

          if (!existing || existing.length === 0) {
            await this.awardTokens(userId, milestone.reward, milestone.reason, 'ace_milestone', null);
          }
        }
      }
    } catch (error) {
      console.error('Error checking ace milestones:', error);
    }
  }

  /**
   * Spend tokens on merch
   */
  async redeemMerch(
    userId: string,
    merchItem: keyof typeof MERCH_COSTS,
    shippingInfo: any
  ): Promise<{ success: boolean; message: string }> {
    try {
      const cost = MERCH_COSTS[merchItem];
      const balance = await this.getBalance(userId);

      if (balance < cost) {
        return {
          success: false,
          message: `Not enough tokens. Need ${cost}, have ${balance}`,
        };
      }

      // Deduct tokens
      const { error: ledgerError } = await supabase
        .from('token_ledger')
        .insert({
          user_id: userId,
          delta: -cost,
          reason: `Redeemed: ${merchItem.replace(/_/g, ' ')}`,
          ref_type: 'merch_redemption',
          ref_id: null,
        });

      if (ledgerError) throw ledgerError;

      // Update balance
      await this.updateBalance(userId);

      // Create merch order record
      await supabase.from('merch_orders').insert({
        user_id: userId,
        item: merchItem,
        cost: cost,
        shipping_info: shippingInfo,
        status: 'pending',
      });

      return {
        success: true,
        message: `🎉 ${merchItem.replace(/_/g, ' ')} redeemed! Check your email for shipping updates.`,
      };
    } catch (error) {
      console.error('Error redeeming merch:', error);
      return {
        success: false,
        message: 'Failed to redeem merch. Please try again.',
      };
    }
  }

  /**
   * Get available merch items and costs
   */
  getMerchCatalog() {
    return Object.entries(MERCH_COSTS).map(([item, cost]) => ({
      id: item,
      name: item.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      cost,
    }));
  }
}

export const rewardService = new RewardService();
export { REWARDS, MERCH_COSTS };
