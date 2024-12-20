// src/components/Timer/Timer.tsx

import React from 'react';
import { Tooltip } from '../../Tooltip';

interface TimerProps {
  timeLeft: number;
  isActive: boolean;
  isPaused: boolean;
  mode: 'focus' | 'shortBreak' | 'longBreak' | 'custom';
  onStart: () => void;
  onStop: () => void;
  onComplete: () => void;
  isShrunk: boolean;
}

export const Timer: React.FC<TimerProps> = ({
  timeLeft,
  isActive,
  isPaused,
  mode,
  onStart,
  onStop,
  onComplete,
  isShrunk,
}) => {
  return (
    <div className="flex flex-col items-center">
      <div className="timer-display text-4xl font-bold">
      <span className="text-gray-700 dark:text-gray-300">{formatTime(timeLeft)}</span>
      </div>
      <div className="timer-controls mt-4 flex space-x-4">
        {!isActive && !isPaused ? (
          // Timer not active and not paused: show Start
          <button
            onClick={onStart}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
            aria-label="Start Timer"
          >
            Start
          </button>
        ) : isActive && !isPaused ? (
          // Timer active and not paused: show Pause
          <button
            onClick={onStop}
            aria-label="Pause the Timer"
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            Pause
          </button>
        ) : (
          // Timer paused: show Resume
          <button
            onClick={onStart}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="Resume Timer"
          >
            Resume
          </button>
        )}
      </div>
    </div>
  );
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`; // Ensure backticks are used for template literals
}
