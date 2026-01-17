import { supabase } from './supabase';

/**
 * Matching Service - The brain of Pickle Chatter
 *
 * This is what beats PlayTime Scheduler:
 * - Scores compatibility between users and LFG posts
 * - Auto-creates sessions when games fill up
 * - Considers skill, location, format, and avoid lists
 */

interface UserProfile {
  id: string;
  self_level: number;
  home_lat: number | null;
  home_lng: number | null;
  preferred_format: string | null;
}

interface LFGPost {
  id: string;
  created_by: string;
  skill_min: number;
  skill_max: number;
  format: string;
  location_lat: number | null;
  location_lng: number | null;
}

class MatchingService {
  /**
   * Score compatibility between a user and an LFG post
   * Returns 0-1 score (higher = better match)
   */
  scoreCompatibility(user: UserProfile, post: LFGPost): number {
    let score = 0;
    let maxScore = 0;

    // Don't match with your own posts
    if (user.id === post.created_by) {
      return 0;
    }

    // Skill compatibility (weight: 40%)
    const skillWeight = 0.4;
    maxScore += skillWeight;

    if (user.self_level >= post.skill_min && user.self_level <= post.skill_max) {
      // Perfect match if within range
      score += skillWeight;
    } else {
      // Penalty for being outside range
      const skillDiff = Math.min(
        Math.abs(user.self_level - post.skill_min),
        Math.abs(user.self_level - post.skill_max)
      );
      score += Math.max(0, skillWeight * (1 - skillDiff / 3)); // Max 3-level tolerance
    }

    // Format compatibility (weight: 20%)
    const formatWeight = 0.2;
    maxScore += formatWeight;

    if (post.format === 'either' || user.preferred_format === 'either' ||
        post.format === user.preferred_format) {
      score += formatWeight;
    }

    // Distance compatibility (weight: 40%)
    const distanceWeight = 0.4;
    maxScore += distanceWeight;

    if (user.home_lat && user.home_lng && post.location_lat && post.location_lng) {
      const distance = this.calculateDistance(
        user.home_lat,
        user.home_lng,
        post.location_lat,
        post.location_lng
      );

      // Score based on distance (0-10 miles scale)
      if (distance <= 2) {
        score += distanceWeight; // Perfect score for ≤2 miles
      } else if (distance <= 5) {
        score += distanceWeight * 0.7; // Good for ≤5 miles
      } else if (distance <= 10) {
        score += distanceWeight * 0.4; // OK for ≤10 miles
      } else {
        score += distanceWeight * Math.max(0, 1 - distance / 30); // Decay after 10 miles
      }
    } else {
      // No location data - give neutral score
      score += distanceWeight * 0.5;
    }

    return maxScore > 0 ? score / maxScore : 0;
  }

  /**
   * Calculate distance between two lat/lng points in miles
   * Uses Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Create a session when an LFG post fills up
   */
  async createSessionFromLFG(lfgPostId: string): Promise<string | null> {
    try {
      // Get the LFG post
      const { data: post, error: postError } = await supabase
        .from('lfg_posts')
        .select(`
          *,
          lfg_time_options(*),
          lfg_claims(user_id, selected_time_option_id)
        `)
        .eq('id', lfgPostId)
        .single();

      if (postError || !post) {
        console.error('Error fetching LFG post:', postError);
        return null;
      }

      // Determine best time based on claims
      let selectedTime = post.lfg_time_options?.[0]; // Default to first option

      if (post.lfg_time_options && post.lfg_time_options.length > 1 && post.lfg_claims) {
        // Count votes for each time option
        const timeVotes: Record<string, number> = {};
        post.lfg_claims.forEach((claim: any) => {
          if (claim.selected_time_option_id) {
            timeVotes[claim.selected_time_option_id] =
              (timeVotes[claim.selected_time_option_id] || 0) + 1;
          }
        });

        // Pick time with most votes
        const topTime = Object.entries(timeVotes).sort((a, b) => b[1] - a[1])[0];
        if (topTime) {
          selectedTime = post.lfg_time_options.find((t: any) => t.id === topTime[0]);
        }
      }

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          group_id: post.group_id,
          lfg_post_id: post.id,
          start_at: selectedTime?.start_at || new Date().toISOString(),
          location_name: post.location_name,
          location_lat: post.location_lat,
          location_lng: post.location_lng,
          format: post.format,
          status: 'scheduled',
        })
        .select()
        .single();

      if (sessionError || !session) {
        console.error('Error creating session:', sessionError);
        return null;
      }

      // Add participants (creator + all claims)
      const participants = [
        { session_id: session.id, user_id: post.created_by, team: 1 },
        ...post.lfg_claims.map((claim: any, idx: number) => ({
          session_id: session.id,
          user_id: claim.user_id,
          team: idx % 2 === 0 ? 1 : 2, // Alternate teams
        })),
      ];

      const { error: participantsError } = await supabase
        .from('session_participants')
        .insert(participants);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
      }

      // Mark LFG post as filled
      await supabase
        .from('lfg_posts')
        .update({ status: 'filled' })
        .eq('id', lfgPostId);

      // Create feed post
      await supabase
        .from('feed_posts')
        .insert({
          group_id: post.group_id,
          user_id: post.created_by,
          type: 'session_created',
          content: `Game on! ${post.format} at ${post.location_name}`,
          ref_type: 'session',
          ref_id: session.id,
        });

      return session.id;
    } catch (error) {
      console.error('Error creating session from LFG:', error);
      return null;
    }
  }

  /**
   * Get recommended LFG posts for a user
   */
  async getRecommendedPosts(userId: string, groupId: string, limit: number = 5) {
    try {
      // Get user profile
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!user) return [];

      // Get open posts in group
      const { data: posts } = await supabase
        .from('lfg_posts')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'open')
        .lt('slots_filled', supabase.rpc('slots_total')); // Not full

      if (!posts) return [];

      // Score and sort
      const scoredPosts = posts
        .map(post => ({
          ...post,
          score: this.scoreCompatibility(user, post),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return scoredPosts;
    } catch (error) {
      console.error('Error getting recommended posts:', error);
      return [];
    }
  }
}

export const matchingService = new MatchingService();
