import React from 'react';
import { Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';

interface TimerProps {
  timeLeft: number;
  isActive: boolean;
  onStart?: () => void; 
  onStop?: () => void;  
  isShrunk?: boolean;
  mode: 'focus' | 'shortBreak' | 'longBreak' | 'custom';
  isPaused?: boolean;
  onComplete?: () => void; // not used here, parent handles complete
}

export function Timer({
  timeLeft,
  isActive,
  onStart,
  onStop,
  isShrunk = false,
  mode,
  isPaused = false
}: TimerProps) {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const modeColor = isShrunk ? 'text-blue-600' : 'text-indigo-600';

  return (
    <motion.div 
      className={`flex flex-col items-center justify-center ${isShrunk ? 'w-auto h-auto bg-transparent' : 'w-full space-y-2'}`}
      animate={{ width: isShrunk ? 'auto' : '100%', height: 'auto', transition: { duration: 0.3 } }}
    >
      <div className="flex items-center justify-center">
        <span className={`font-mono ${isShrunk ? 'text-lg' : 'text-4xl'} text-gray-800 dark:text-gray-100`}>
          {formatTime(timeLeft)}
        </span>
      </div>
      {!isShrunk && (
        <div className="text-center space-y-2">
          <p className={`text-sm ${modeColor} capitalize`}>{mode.replace(/([A-Z])/g, ' $1')}</p>
          {isActive ? (
            onStop && (
              <button
                onClick={onStop}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 mt-2"
                aria-label="Pause Timer"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </button>
            )
          ) : (
            onStart && (
              <button
                onClick={onStart}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300 mt-2"
                aria-label="Start Timer"
              >
                <Play className="w-4 h-4 mr-2" />
                {isPaused ? 'Resume' : 'Start'}
              </button>
            )
          )}
        </div>
      )}
    </motion.div>
  );
}
