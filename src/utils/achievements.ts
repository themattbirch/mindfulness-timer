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
  {
    id: 'long-streak',
    name: 'Steadfast Focus',
    description: 'Maintain a daily streak for 7 days.',
    icon: '🔥',
    target: 7,
    progress: 0,
    unlockedAt: null
  }
];
