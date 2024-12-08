// src/utils/achievements.ts

import { Achievement } from '../types/app';

export const achievements: Achievement[] = [
  {
    id: 'first-session',
    name: 'First Session',
    description: 'Complete your first mindfulness session.',
    icon: '🎉',
    target: 1,
    progress: 0,
    unlockedAt: null
  },
  {
    id: 'ten-sessions',
    name: 'Consistent Practitioner',
    description: 'Complete 10 mindfulness sessions.',
    icon: '🏆',
    target: 10,
    progress: 0,
    unlockedAt: null
  },
  // Add more achievements as needed...
];


export const calculateFocusScore = (
  completionRate: number,
  streak: number,
  sessionDuration: number
): number => {
  const streakBonus = Math.min(streak * 2, 20); // Max 20 points from streak
  const completionBonus = completionRate * 60; // Max 60 points from completion rate
  const durationBonus = Math.min(sessionDuration / 30, 20); // Max 20 points from duration

  return Math.round(streakBonus + completionBonus + durationBonus);
}; 