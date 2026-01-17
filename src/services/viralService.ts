import { Share, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Viral Service - Makes Pickle Chatter spread like wildfire
 *
 * Features:
 * - Shareable achievement cards
 * - Haptic feedback
 * - Viral invite flows
 * - Social proof
 */

class ViralService {
  /**
   * Trigger haptic feedback for different actions
   */
  async haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') {
    if (Platform.OS === 'ios') {
      try {
        switch (type) {
          case 'light':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'medium':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case 'heavy':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
          case 'success':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          case 'warning':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            break;
          case 'error':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
        }
      } catch (error) {
        // Haptics not available on this device
        console.log('Haptics not available');
      }
    }
  }

  /**
   * Share achievement to social media
   */
  async shareAchievement(
    type: 'pickle' | 'atp' | 'ace_milestone' | 'win_streak',
    data: any
  ): Promise<boolean> {
    try {
      let message = '';
      let url = 'https://picklechatter.app'; // Replace with actual deep link

      switch (type) {
        case 'pickle':
          message = `🥒 I just got PICKLED in Pickle Chatter! 11-0 shutout! 🎾\n\nJoin me: ${url}`;
          break;

        case 'atp':
          message = `🎯 ATP SHOT! Just hit an around-the-post winner in Pickle Chatter! 🔥\n\nPlay with me: ${url}`;
          break;

        case 'ace_milestone':
          const aces = data.totalAces;
          const milestone = aces >= 100 ? 100 : aces >= 50 ? 50 : 25;
          message = `🎾 ${milestone} ACE MILESTONE! 🎾\nI've served ${aces} aces in Pickle Chatter!\n\nChallenge me: ${url}`;
          break;

        case 'win_streak':
          message = `🔥 ${data.streak} GAME WIN STREAK! 🔥\nUnstoppable in Pickle Chatter!\n\nTry to beat me: ${url}`;
          break;
      }

      const result = await Share.share({
        message,
        url, // iOS only
      });

      if (result.action === Share.sharedAction) {
        await this.haptic('success');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sharing:', error);
      return false;
    }
  }

  /**
   * Generate invite link with user attribution
   */
  generateInviteLink(userId: string, userName: string): string {
    // In production, use Firebase Dynamic Links or Branch.io
    const inviteCode = btoa(userId).substring(0, 8);
    return `https://picklechatter.app/join/${inviteCode}?ref=${userName}`;
  }

  /**
   * Share invite to friends
   */
  async shareInvite(userName: string, userId: string): Promise<boolean> {
    try {
      const inviteLink = this.generateInviteLink(userId, userName);
      const message = `🎾 Join me on Pickle Chatter!\n\nFind pickleball games near you, track your stats, and compete for pickle trophies! 🥒\n\nJoin here: ${inviteLink}`;

      const result = await Share.share({ message });

      if (result.action === Share.sharedAction) {
        await this.haptic('success');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sharing invite:', error);
      return false;
    }
  }

  /**
   * Check if user hit a milestone worth celebrating
   */
  checkMilestones(user: any): Array<{ type: string; message: string; shareable: boolean }> {
    const milestones = [];

    // Ace milestones
    const totalAces = user.total_aces || 0;
    if ([25, 50, 100, 250, 500].includes(totalAces)) {
      milestones.push({
        type: 'ace_milestone',
        message: `🎾 ${totalAces} ACE MILESTONE! You're a serving machine!`,
        shareable: true,
      });
    }

    // Pickle milestones
    const pickles = user.pickle_trophy_count || 0;
    if ([1, 5, 10, 25, 50].includes(pickles)) {
      milestones.push({
        type: 'pickle_milestone',
        message: pickles === 1
          ? `🥒 First pickle trophy! The beginning of a legend!`
          : `🥒 ${pickles} PICKLE TROPHIES! Ruthless!`,
        shareable: true,
      });
    }

    return milestones;
  }

  /**
   * Trigger celebration animation with confetti
   * (requires expo-confetti or lottie)
   */
  async celebrate(type: 'pickle' | 'atp' | 'milestone') {
    // Heavy haptic for big celebrations
    await this.haptic('heavy');

    // In production, trigger confetti animation
    // This would use expo-confetti or lottie-react-native
    console.log(`🎉 Celebrating ${type}!`);
  }
}

export const viralService = new ViralService();
