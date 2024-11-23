import { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface TimerProps {
  interval: number;
  onComplete?: () => void;
}

export function Timer({ interval, onComplete }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(interval * 60);
  const [isRunning, setIsRunning] = useState(false);
  
  const progress = ((interval * 60 - timeLeft) / (interval * 60)) * 100;
  const circumference = 2 * Math.PI * 90; // circle radius is 90

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onComplete?.();
            return interval * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, interval, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(interval * 60);
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative">
        <svg className="w-48 h-48 transform -rotate-90">
          {/* Background circle */}
          <circle
            className="text-gray-200"
            strokeWidth="4"
            stroke="currentColor"
            fill="transparent"
            r="90"
            cx="96"
            cy="96"
          />
          {/* Progress circle */}
          <circle
            className="text-blue-600 transition-all duration-300"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * ((100 - progress) / 100)}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="90"
            cx="96"
            cy="96"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold tabular-nums">
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleStartPause}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors
            ${isRunning 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-black hover:bg-gray-800 text-white'
            }`}
        >
          {isRunning ? (
            <><Pause className="w-4 h-4 mr-2" /> Pause</>
          ) : (
            <><Play className="w-4 h-4 mr-2" /> Start</>
          )}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center px-4 py-2 rounded-lg border border-gray-300 
                   hover:bg-gray-100 transition-colors"
        >
          <RotateCcw className="w-4 h-4 mr-2" /> Reset
        </button>
      </div>
    </div>
  );
} 