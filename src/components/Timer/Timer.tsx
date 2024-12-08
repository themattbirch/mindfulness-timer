// src/components/Timer/Timer.tsx

import React, { useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';

interface TimerProps {
  interval: number;
  onComplete: () => void;
  isActive: boolean;
  onStart?: () => void; // Made optional
  onStop?: () => void;  // Made optional
  isShrunk?: boolean;
  mode: 'focus' | 'shortBreak' | 'longBreak';
}

export function Timer({ interval, onComplete, isActive, onStart, onStop, isShrunk = false, mode }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(interval * 60);
  
  useEffect(() => {
    let timer: number;
    if (isActive && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      onComplete();
    }

    return () => clearInterval(timer);
  }, [isActive, timeLeft, onComplete]);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(interval * 60);
    }
  }, [interval, isActive]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <motion.div 
      className={`flex flex-col items-center justify-center ${isShrunk ? 'w-16 h-16 bg-blue-100 rounded-full' : 'w-full'}`}
      animate={{ 
        width: isShrunk ? '4rem' : '100%',
        height: isShrunk ? '4rem' : 'auto',
        transition: { duration: 0.3 }
      }}
    >
      <div className="flex items-center justify-center">
        <span className={`text-4xl font-mono ${isShrunk ? 'text-blue-600' : 'text-gray-800 dark:text-gray-200'}`}>
          {formatTime(timeLeft)}
        </span>
      </div>
      {!isShrunk && (
        <div className="mt-4">
          <p className="text-sm text-gray-500 capitalize">{mode.replace(/([A-Z])/g, ' $1')}</p>
          {isActive ? (
            onStop && (
              <button
                onClick={onStop}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
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
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
                aria-label="Start Timer"
              >
                <Play className="w-4 h-4 mr-2" />
                Start
              </button>
            )
          )}
        </div>
      )}
    </motion.div>
  );
}
