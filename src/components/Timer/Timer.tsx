import React from 'react';
import './Timer.css';
import { TimerState } from '../../types/app'; 

interface TimerProps {
  timeLeft: number;
  isActive: boolean;
  isPaused: boolean;
  mode: 'focus' | 'shortBreak' | 'longBreak' | 'custom'; 
  onStart: () => void;
  onStop: () => void;
  onComplete: () => void;
  isShrunk: boolean;
  isBlinking: boolean;
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
  isBlinking
}) => {
  const handleClick = () => {
    if (isActive && !isPaused) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <div className={`timer-wrapper flex flex-col items-center text-center ${isBlinking ? 'blinking' : ''}`}>
      <div className="timer-display" onClick={handleClick} role="button" tabIndex={0}>
        <div className="timer-text text-4xl font-bold">
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* 
        If not shrunk => show normal Start/Pause/Resume.
        If shrunk => "||" is handled in App.tsx.
      */}
      {!isShrunk && (
        <div className="timer-buttons flex justify-center gap-4 mt-4">
          {/* Not active, not paused => Start */}
          {!isActive && !isPaused && (
            <button
              className="start-button px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-green-300"
              onClick={onStart}
              aria-label="Start Timer"
            >
              Start
            </button>
          )}

          {/* Active & not paused => Pause */}
          {isActive && !isPaused && (
            <button
              className="pause-button px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              onClick={onStop}
              aria-label="Pause Timer"
            >
              Pause
            </button>
          )}

          {/* Paused => Resume */}
          {isPaused && (
            <button
              className="resume-button px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              onClick={onStart}
              aria-label="Resume Timer"
            >
              Resume
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Helper Function
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
