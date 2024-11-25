import { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Palette } from 'lucide-react';

interface TimerProps {
  interval: number;
  onComplete?: () => void;
}

// Define our theme options
const timerThemes = [
  {
    name: 'Ocean',
    sand: 'bg-blue-500',
    glass: 'border-blue-300',
    pinch: 'bg-blue-300',
    button: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    name: 'Forest',
    sand: 'bg-emerald-500',
    glass: 'border-emerald-300',
    pinch: 'bg-emerald-300',
    button: 'bg-emerald-500 hover:bg-emerald-600',
  },
  {
    name: 'Sunset',
    sand: 'bg-orange-500',
    glass: 'border-orange-300',
    pinch: 'bg-orange-300',
    button: 'bg-orange-500 hover:bg-orange-600',
  },
  {
    name: 'Purple Rain',
    sand: 'bg-purple-500',
    glass: 'border-purple-300',
    pinch: 'bg-purple-300',
    button: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    name: 'Rose Gold',
    sand: 'bg-rose-400',
    glass: 'border-rose-300',
    pinch: 'bg-rose-300',
    button: 'bg-rose-400 hover:bg-rose-500',
  }
];

export function Timer({ interval, onComplete }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(interval * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [showThemes, setShowThemes] = useState(false);
  
  const progress = ((interval * 60 - timeLeft) / (interval * 60)) * 100;
  const theme = timerThemes[selectedTheme];

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

  return (
    <div className="flex flex-col items-center">
      {/* Theme selector */}
      <div className="mb-6 relative">
        <button
          onClick={() => setShowThemes(!showThemes)}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg 
                   bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <Palette className="w-4 h-4" />
          <span>Theme</span>
        </button>

        {showThemes && (
          <div className="absolute top-full mt-2 p-2 bg-white rounded-lg shadow-lg 
                        border border-gray-200 flex space-x-2">
            {timerThemes.map((theme, index) => (
              <button
                key={theme.name}
                onClick={() => {
                  setSelectedTheme(index);
                  setShowThemes(false);
                }}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selectedTheme === index 
                    ? 'scale-110 border-gray-400' 
                    : 'border-transparent hover:scale-105'
                }`}
                title={theme.name}
              >
                <div className={`w-full h-full rounded-full ${theme.sand}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hourglass */}
      <div className="relative w-48 h-72">
        <div className="relative w-full h-full">
          <div className="absolute inset-0 flex flex-col">
            {/* Top half */}
            <div className={`h-1/2 border-2 ${theme.glass} rounded-t-full overflow-hidden 
                          backdrop-blur-sm bg-opacity-20`}>
              <div 
                className={`w-full ${theme.sand} transition-all duration-300`}
                style={{ 
                  height: `${Math.max(0, 100 - progress)}%`,
                  transition: 'height 1s linear'
                }}
              />
            </div>
            
            {/* Middle pinch */}
            <div className={`h-4 w-4 -mt-2 -mb-2 mx-auto ${theme.pinch} rotate-45 z-10`} />
            
            {/* Bottom half */}
            <div className={`h-1/2 border-2 ${theme.glass} rounded-b-full overflow-hidden 
                          backdrop-blur-sm bg-opacity-20`}>
              <div 
                className={`w-full ${theme.sand} transition-all duration-300`}
                style={{ 
                  height: `${progress}%`,
                  transition: 'height 1s linear'
                }}
              />
            </div>
          </div>

          {/* Time display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-4xl font-bold text-gray-800 bg-white 
                          bg-opacity-90 px-4 py-2 rounded-full shadow-sm`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 flex items-center space-x-4">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex items-center px-6 py-2 rounded-lg transition-colors text-white
                    ${isRunning ? 'bg-red-500 hover:bg-red-600' : theme.button}`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 mr-2" /> Pause
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" /> Start
            </>
          )}
        </button>
        
        <button
          onClick={() => {
            setIsRunning(false);
            setTimeLeft(interval * 60);
          }}
          className="flex items-center px-6 py-2 rounded-lg border border-gray-300 
                   hover:bg-gray-100 transition-colors"
        >
          <RotateCcw className="w-5 h-5 mr-2" /> Reset
        </button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Focus Session: {interval} minutes
        </p>
      </div>
    </div>
  );
} 