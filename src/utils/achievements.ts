import { Achievement } from '../types/app';

export const achievements: Achievement[] = [
  {
    id: 'first-session',
    name: 'First Session',
    description: 'Complete your first mindful browsing session.',
    icon: '🎉',
    target: 1,
    progress: 0,
    unlockedAt: null
  },
  {
    id: 'ten-sessions',
    name: 'Consistent Practitioner',
    description: 'Complete 10 mindful browsing sessions.',
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
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Complete a session before 9 AM.',
    icon: '🌅',
    target: 1,
    progress: 0,
    unlockedAt: null
  },
  {
    id: 'different-modes',
    name: 'Mode Explorer',
    description: 'Try all timer modes (Focus, Short Break, Long Break).',
    icon: '🔄',
    target: 3,
    progress: 0,
    unlockedAt: null
  },
  {
    id: 'full-hour',
    name: 'Deep Dive',
    description: 'Complete a 60-minute focus session.',
    icon: '⏱️',
    target: 1,
    progress: 0,
    unlockedAt: null
  },
  {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    description: 'Complete sessions on both Saturday and Sunday.',
    icon: '🌟',
    target: 2,
    progress: 0,
    unlockedAt: null
  }
];