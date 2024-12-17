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
  onComplete?: () => void;
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

  // Click anywhere in the timer area to pause/resume if active
  const handleClick = () => {
    if (!onStart || !onStop) return;
    if (isActive && !isPaused) {
      onStop();
    } else if (isPaused) {
      onStart();
    }
  };

  return (
    <motion.div
      className={`flex flex-col items-center justify-center ${isShrunk ? 'bg-primary hover:bg-primary-dark rounded-full' : 'w-full space-y-2'}`}
      style={isShrunk ? {
        width: '64px',
        height: '64px',
        cursor: 'pointer',
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 50
      } : {}}
      animate={{ 
        scale: isShrunk ? 0.8 : 1,
        transition: { duration: 0.3 } 
      }}
      onClick={handleClick}
    >
      <div className="flex items-center justify-center">
        <span className={`font-mono ${isShrunk ? 'text-lg text-white' : 'text-4xl text-gray-800 dark:text-gray-100'}`}>
          {formatTime(timeLeft)}
        </span>
      </div>
      
      {isShrunk && (
        <span className="text-xs text-white mt-1">Click to pause/resume</span>
      )}

      {!isShrunk && (
        <div className="text-center space-y-2">
          <p className="text-sm text-indigo-600 dark:text-indigo-400 capitalize">
            {mode.replace(/([A-Z])/g, ' $1')}
          </p>
          {isActive ? (
            onStop && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStop();
                }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  onStart();
                }}
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
