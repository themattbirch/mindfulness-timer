import { Achievement } from '../types/app';

export const achievements: Achievement[] = [
  {
    id: 'first-session',
    name: 'First Step',
    description: 'Complete your first mindfulness session',
    icon: '🌱',
    target: 1,
    progress: 0,
    unlockedAt: null
  },
  {
    id: 'streak-7',
    name: 'Weekly Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    target: 7,
    progress: 0,
    unlockedAt: null
  },
  {
    id: 'total-hours-10',
    name: 'Mindfulness Explorer',
    description: 'Accumulate 10 hours of mindfulness practice',
    icon: '⭐',
    target: 600, // minutes
    progress: 0,
    unlockedAt: null
  },
  {
    id: 'perfect-week',
    name: 'Perfect Week',
    description: 'Complete all weekly goals',
    icon: '🎯',
    target: 1,
    progress: 0,
    unlockedAt: null
  },
  {
    id: 'focus-master',
    name: 'Focus Master',
    description: 'Achieve a focus score of 90+',
    icon: '🧠',
    target: 90,
    progress: 0,
    unlockedAt: null
  }
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