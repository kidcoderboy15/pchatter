import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { viralService } from '../services/viralService';

const { width } = Dimensions.get('window');

type AchievementType = 'pickle' | 'atp' | 'ace_milestone' | 'win_streak';

interface AchievementCardProps {
  type: AchievementType;
  userName: string;
  data?: any;
  onShare?: () => void;
  onDismiss?: () => void;
}

export default function AchievementCard({
  type,
  userName,
  data = {},
  onShare,
  onDismiss,
}: AchievementCardProps) {
  const handleShare = async () => {
    await viralService.haptic('medium');
    const shared = await viralService.shareAchievement(type, data);
    if (shared && onShare) {
      onShare();
    }
  };

  const handleDismiss = async () => {
    await viralService.haptic('light');
    if (onDismiss) {
      onDismiss();
    }
  };

  const getContent = () => {
    switch (type) {
      case 'pickle':
        return {
          emoji: '🥒',
          title: 'PICKLE TROPHY!',
          subtitle: '11-0 Shutout',
          message: 'Absolutely ruthless!',
          gradient: ['#22c55e', '#16a34a'],
        };

      case 'atp':
        return {
          emoji: '🎯',
          title: 'ATP SHOT!',
          subtitle: 'Around The Post',
          message: 'What a legend!',
          gradient: ['#3b82f6', '#2563eb'],
        };

      case 'ace_milestone':
        return {
          emoji: '🎾',
          title: `${data.totalAces} ACES!`,
          subtitle: 'Milestone Unlocked',
          message: 'Serving machine!',
          gradient: ['#f59e0b', '#d97706'],
        };

      case 'win_streak':
        return {
          emoji: '🔥',
          title: `${data.streak} WIN STREAK!`,
          subtitle: 'On Fire',
          message: 'Unstoppable!',
          gradient: ['#ef4444', '#dc2626'],
        };

      default:
        return {
          emoji: '🎾',
          title: 'Achievement!',
          subtitle: '',
          message: '',
          gradient: ['#22c55e', '#16a34a'],
        };
    }
  };

  const content = getContent();

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Card Content */}
        <View style={[styles.card, { backgroundColor: content.gradient[0] }]}>
          <Text style={styles.emoji}>{content.emoji}</Text>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.subtitle}>{content.subtitle}</Text>
          <Text style={styles.userName}>@{userName}</Text>
          <Text style={styles.message}>{content.message}</Text>

          {/* Pickle Chatter branding */}
          <View style={styles.branding}>
            <Text style={styles.brandingText}>Pickle Chatter 🥒</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>📤 Share to Social</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
          <Text style={styles.dismissButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: width - 64,
    maxWidth: 400,
  },
  card: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  branding: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  brandingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  shareButton: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  dismissButton: {
    marginTop: 12,
    padding: 16,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
