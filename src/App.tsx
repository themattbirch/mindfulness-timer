import React, { useState, useEffect, useCallback, CSSProperties } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import './App.css';
import { Timer } from './components/Timer/Timer';
import { Quote as QuoteComponent } from './components/Quote/Quote';
import { Settings } from './components/Settings/Settings';
import { getStorageData, setStorageData } from './utils/storage';
import { AppSettings, TimerState } from './types/app';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Joyride, { CallBackProps, Step } from 'react-joyride';
import { v4 as uuidv4 } from 'uuid';
import { Tooltip } from './Tooltip';

const FULL_WIDTH = 380;  // Slightly smaller width
const FULL_HEIGHT = 600; // Reduced height for better proportions
const CIRCLE_SIZE = 80;
const ENLARGED_WIDTH = 600;  // For enlarged state
const ENLARGED_HEIGHT = 400; // For enlarged state

const Z_INDEX = {
  BASE: 1000,
  JOYRIDE: 1100,
  OVERLAY: 1050
};


export default function App() {
  const [settings, setSettings] = useState<AppSettings>({
    interval: 15,
    soundEnabled: true,
    theme: 'light',
    soundVolume: 50,
    autoStartTimer: false,
    showQuotes: true,
    quoteChangeInterval: 60,
    selectedSound: 'gentle-bell',
    timerMode: 'focus',
    quoteCategory: 'all',
    minimalMode: false
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEnlarged, setIsEnlarged] = useState(false);

  // Timer state
  const [timerState, setTimerState] = useState<TimerState>({
    isActive: false,
    isPaused: false,
    timeLeft: 0,
    mode: 'focus',
    interval: 15,
    isBlinking: false,
    startTime: null,
    endTime: null
  });

  // Minimal mode if timer is active & not paused
  const isShrunk = timerState.isActive && !timerState.isPaused;

useEffect(() => {
  if (isShrunk) {
    document.documentElement.style.width = `${CIRCLE_SIZE}px`;
    document.documentElement.style.height = `${CIRCLE_SIZE}px`;
    document.body.style.width = `${CIRCLE_SIZE}px`;
    document.body.style.height = `${CIRCLE_SIZE}px`;
  } else {
    document.documentElement.style.width = `${FULL_WIDTH}px`;
    document.documentElement.style.height = `${FULL_HEIGHT}px`;
    document.body.style.width = `${FULL_WIDTH}px`;
    document.body.style.height = `${FULL_HEIGHT}px`;
  }
}, [isShrunk]);

  // Joyride steps
  const steps: Step[] = [
    {
      target: '.start-button',
      content: 'Click the green button above to start your Mindfulness Timer session.',
      disableBeacon: true
    },
    {
      target: '.card-area',
      content: 'Click anywhere on the window to pause the timer when it’s running.',
      disableBeacon: true
    },
    {
      target: '.quote-area',
      content: 'A random motivational quote will be shown before timer is started. And when timer is completed.',
      disableBeacon: true
    },
    {
      target: '.settings-button',
      content: 'Adjust your preferences and timer settings here.',
      disableBeacon: true
    }
  ];
  const [run, setRun] = useState(false);

  function handleJoyrideCallback(data: CallBackProps) {
    const { status } = data;
    if (['finished', 'skipped'].includes(status)) setRun(false);
  }

  // Apply theme
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Load settings & timer state on mount
  useEffect(() => {
    const loadData = async () => {
      const data = await getStorageData([
        'interval',
        'soundEnabled',
        'theme',
        'soundVolume',
        'autoStartTimer',
        'showQuotes',
        'quoteChangeInterval',
        'selectedSound',
        'timerMode',
        'quoteCategory',
        'timerState',
        'minimalMode'
      ]);

      const newSettings: AppSettings = {
        interval: data.interval ?? 15,
        soundEnabled: data.soundEnabled ?? true,
        theme: data.theme ?? 'light',
        soundVolume: data.soundVolume ?? 50,
        autoStartTimer: data.autoStartTimer ?? false,
        showQuotes: data.showQuotes ?? true,
        quoteChangeInterval: data.quoteChangeInterval ?? 60,
        selectedSound: data.selectedSound ?? 'gentle-bell',
        timerMode: data.timerMode ?? 'focus',
        quoteCategory: data.quoteCategory ?? 'all',
        minimalMode: data.minimalMode ?? false
      };
      setSettings(newSettings);

      // If no timerState stored, use defaults
      const storedTimerState: TimerState = data.timerState || {
        isActive: false,
        isPaused: false,
        timeLeft: getModeSeconds(newSettings),
        mode: newSettings.timerMode,
        interval: newSettings.interval,
        isBlinking: false,
        startTime: null,
        endTime: null
      };
      setTimerState(storedTimerState);

      // Auto-start if enabled
      if (newSettings.autoStartTimer && !storedTimerState.isActive) {
        handleStartTimer();
      }
    };
    loadData();
  }, []);

  // Listen for messages from background
  useEffect(() => {
    const messageListener = (message: any) => {
      switch (message.action) {
        case 'updateTime':
          setTimerState(prev => ({ ...prev, timeLeft: message.timeLeft }));
          break;
        case 'resetTime':
          setTimerState({
            isActive: false,
            isPaused: false,
            timeLeft: message.timeLeft,
            mode: 'focus',
            interval: 15,
            isBlinking: false,
            startTime: null,
            endTime: null
          });
          break;
        case 'stopTime':
          setTimerState({
            isActive: false,
            isPaused: false,
            timeLeft: 0,
            mode: 'focus',
            interval: 15,
            isBlinking: false,
            startTime: null,
            endTime: null
          });
          break;
        case 'timerCompleted':
          handleTimerComplete();
          break;
        default:
          break;
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  /**
   * Local timer decrement if active:
   * - We re-check the background storage for endTime
   * - If endTime is in the future, we compute (endTime - Date.now()) / 1000
   * - This ensures the timer keeps running if the user closes the popup
   */
  useEffect(() => {
    let intervalId: number | undefined;
    if (timerState.isActive && !timerState.isPaused) {
      intervalId = window.setInterval(async () => {
        const data = await getStorageData(['timerState']);
        const current = data.timerState as TimerState;

        // If there's no current timer or the user paused it, stop interval
        if (!current || !current.isActive || current.isPaused) {
          clearInterval(intervalId);
          return;
        }

        // If we have an endTime, use that to compute the remaining time
        if (typeof current.endTime === 'number') {
          const now = Date.now();
          const timeLeftMs = current.endTime - now;
          let newTimeLeft = Math.max(0, Math.floor(timeLeftMs / 1000));

          // If timeLeft is 0 or negative => timer is done
          if (newTimeLeft <= 0) {
            newTimeLeft = 0;
            clearInterval(intervalId);
            handleTimerComplete();
          }

          setTimerState(prev => ({
            ...prev,
            timeLeft: newTimeLeft,
            isActive: current.isActive,
            isPaused: current.isPaused,
            startTime: current.startTime ?? null,
            endTime: current.endTime ?? null
          }));
        }
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timerState.isActive, timerState.isPaused]);

  const [quoteChangeCounter, setQuoteChangeCounter] = useState(0);

  // Timer complete logic
  async function handleTimerComplete() {
    if (settings.soundEnabled) {
      playSound(settings.selectedSound);
    }
    // Start blinking
    setTimerState(prev => ({ ...prev, isActive: false, isPaused: false, timeLeft: 0, isBlinking: true }));
    // Force quote change
    setQuoteChangeCounter(prev => prev + 1);
  }

  // Utility: format time
  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // Utility: compute mode seconds
  function getModeSeconds(s: AppSettings) {
    switch (s.timerMode) {
      case 'focus':
        return 25 * 60;
      case 'shortBreak':
        return 5 * 60;
      case 'longBreak':
        return 15 * 60;
      case 'custom':
        return s.interval * 60;
      default:
        return 15 * 60;
    }
  }

  // Reset Timer
  function handleResetTimer() {
    chrome.runtime.sendMessage({ action: 'resetTimer' });
    setTimerState({
      isActive: false,
      isPaused: false,
      timeLeft: getModeSeconds(settings),
      mode: settings.timerMode,
      interval: settings.interval,
      isBlinking: false,
      startTime: null,
      endTime: null
    });
  }

  // Start Timer
  function handleStartTimer() {
    chrome.runtime.sendMessage({
      action: 'startTimer',
      interval: settings.interval,
      mode: settings.timerMode
    });
    setTimerState({
      isActive: true,
      isPaused: false,
      timeLeft: getModeSeconds(settings),
      mode: settings.timerMode,
      interval: settings.interval,
      isBlinking: false,
      startTime: null,
      endTime: null
    });
  }

  // Resume Timer
  function handleResumeTimer() {
    chrome.runtime.sendMessage({ action: 'resumeTimer' });
    setTimerState(prev => ({ ...prev, isActive: true, isPaused: false }));
  }

  // Pause Timer
  function handlePauseTimer() {
    chrome.runtime.sendMessage({ action: 'pauseTimer' });
    setTimerState(prev => ({ ...prev, isPaused: true }));
  }

  // Circle click in minimal mode
  function handleCircleClick() {
    // If the timer is 0:00 and blinking => reset
    if (timerState.timeLeft === 0 && timerState.isBlinking) {
      handleResetTimer();
      setTimerState(prev => ({ ...prev, isBlinking: false }));
    } else {
      // Otherwise, just pause
      handlePauseTimer();
    }
  }

  // Global container click => pause if active
  function handleGlobalClick() {
    if (timerState.isActive && !timerState.isPaused) {
      handlePauseTimer();
    }
  }

  // Sound playback
  const playSound = useCallback((soundName: string) => {
    const soundUrl = chrome.runtime.getURL(`sounds/${soundName}.mp3`);
    console.log(`Attempting to play sound: ${soundName} from URL: ${soundUrl}`);
    const audio = new Audio(soundUrl);
    audio.volume = settings.soundVolume / 100;
    audio.play().catch(err => {
      console.error(`Failed to play sound "${soundName}":`, err);
    });
  }, [settings.soundVolume]);

  // Container style logic
  const containerStyle: CSSProperties = isEnlarged
  ? {
      position: 'fixed',
      width: ENLARGED_WIDTH,
      height: ENLARGED_HEIGHT,
      zIndex: Z_INDEX.BASE,
      minWidth: '600px',  // Add minimum dimensions
      minHeight: '400px',
      overflowY: 'hidden',
      transition: 'width 0.5s ease, height 0.5s ease',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }
  : isShrunk
  ? {
      position: 'fixed',
      width: `${CIRCLE_SIZE}px`,
      height: `${CIRCLE_SIZE}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      transition: 'width 0.3s ease, height 0.3s ease',
      zIndex: Z_INDEX.BASE,
      borderRadius: '50%',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: 0  // Remove padding in shrunk mode
    }
  : {
       position: 'fixed',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden', 
      overflowY: 'hidden',
      transition: 'width 0.5s ease, height 0.5s ease',
      zIndex: Z_INDEX.BASE,
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '20px'
    };


// The return statement remains the same but with a background color on the outer container:
return (
  <div style={containerStyle} onClick={handleGlobalClick}>
    <Joyride
  steps={!isShrunk ? steps : []}
  run={!isShrunk && run}
  callback={handleJoyrideCallback}
  showSkipButton
  continuous
  styles={{
    options: {
      zIndex: Z_INDEX.JOYRIDE,
      overlayColor: 'rgba(0, 0, 0, 0.5)',
    },
    overlay: {
      zIndex: Z_INDEX.OVERLAY
    },
    tooltip: {
      zIndex: Z_INDEX.JOYRIDE
    },
    spotlight: {
      zIndex: Z_INDEX.OVERLAY
    }
  }}
  showProgress
  hideCloseButton
  disableOverlayClose
  scrollToFirstStep
/>

    {/* Single outer container */}
    <div
      className={`w-full h-full bg-white dark:bg-gray-900 text-black dark:text-white ${
        isShrunk ? 'flex items-center justify-center' : 'relative'
      }`}
    >
      {/* Settings Modal */}
      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={async (newSettings) => {
          setSettings(newSettings);
          await setStorageData(newSettings);
          if (!timerState.isActive && !timerState.isPaused) {
            setTimerState(prev => ({
              ...prev,
              timeLeft: getModeSeconds(newSettings),
              interval: newSettings.interval,
              mode: newSettings.timerMode
            }));
          }
        }}
      />

      {!isSettingsOpen && (
        <>
          {isShrunk ? (
            // Minimal Mode (small circle)
            <div
              className={`w-20 h-20 bg-primary rounded-full flex flex-col items-center justify-center cursor-pointer transition-transform ${
                timerState.timeLeft === 0 ? 'animate-ping' : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleCircleClick();
              }}
            >
              <span className="text-white font-bold text-sm">
                {formatTime(timerState.timeLeft)}
              </span>
              {timerState.isActive && !timerState.isPaused && (
                <span className="text-xs text-white mt-1">Pause</span>
              )}
            </div>
          ) : (
            // Full Mode
         <div className="w-full max-w-sm flex flex-col">
  <div className="relative border card-area border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 bg-white dark:bg-gray-900 flex flex-col items-center">
    {/* Top buttons container */}
    <div className="absolute top-4 w-full flex justify-between px-4">
  {/* Theme Toggle */}
  <Tooltip text="Theme">
    <button
      className="theme-toggle-button p-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-full transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
        setSettings(prev => ({ ...prev, theme: newTheme }));
        chrome.storage.sync.set({ theme: newTheme });
      }}
      aria-label="Toggle Theme"
    >
      {settings.theme === 'dark' ? '☀️' : '🌙'}
    </button>
  </Tooltip>

  {/* Settings */}
  <Tooltip text="Settings">
    <button
      className="settings-button p-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-full transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        setIsSettingsOpen(true);
      }}
      aria-label="Open Settings"
    >
      <SettingsIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
    </button>
  </Tooltip>
</div>

                 <h1 className="text-3xl font-bold text-center mt-12 mb-6">
      Mindful Browsing Timer
    </h1>

                  {/* Timer + Quotes section - adjust spacing */}
    <div className="flex flex-col items-center space-y-4 w-full">
      <Timer
        timeLeft={timerState.timeLeft}
        isActive={timerState.isActive}
        isPaused={timerState.isPaused}
        mode={timerState.mode}
        onStart={timerState.isPaused ? handleResumeTimer : handleStartTimer}
        onStop={handlePauseTimer}
        onComplete={handleTimerComplete}
        isShrunk={false}
        isBlinking={timerState.isBlinking}
      />

      {/* Quote with adjusted spacing */}
        {settings.showQuotes && (
        <div className="mt-2">
          <QuoteComponent
            changeInterval={settings.quoteChangeInterval}
            category={settings.quoteCategory}
            forceChange={quoteChangeCounter}
          />
        </div>
      )}
    </div>

                 {/* Buttons container - adjust spacing */}
      <div className="flex flex-col items-center space-y-3 mt-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleResetTimer();
          }}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          aria-label="Reset Timer"
        >
          Reset Timer
        </button>

        <Tooltip text="Guided tour of the app">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRun(true);
            }}
            className="px-4 py-2 bg-secondary hover:bg-secondary-light text-white rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-secondary-light"
          >
            Start Onboarding
          </button>
        </Tooltip>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}