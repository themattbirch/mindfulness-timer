export interface AppSettings {
  interval: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark';
  soundVolume: number;
  autoStartTimer: boolean;
  showQuotes: boolean;
  quoteChangeInterval: number;
  selectedSound: string;
  // Add 'custom' as a valid timer mode
  timerMode: 'focus' | 'shortBreak' | 'longBreak' | 'custom';
  quoteCategory: string;
  // Add minimalMode to fix the missing property errors
  minimalMode?: boolean;
}

export interface StorageData extends AppSettings {
  statistics: Statistics;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
  category: string;
  isFavorite?: boolean;
}

export interface Statistics {
  totalSessions: number;
  totalMinutes: number;
  dailyStreak: number;
  bestStreak: number;
  lastSessionDate: string;
  averageSessionDuration: number;
  completionRate: number;
  focusScore: number;
  weeklyMinutes: number;
  monthlyMinutes: number;
  achievements: Achievement[];
  sessionHistory: Session[];
}

export interface Session {
  date: string;
  duration: number;
  completedBreaks: number;
  skippedBreaks?: number;
  focusScore?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  progress: number;
  target: number;
}
