import React, { useState, useEffect, useCallback, CSSProperties } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import './App.css';
import { Timer } from './components/Timer/Timer';
import { Quote as QuoteComponent } from './components/Quote/Quote';
import { Settings } from './components/Settings/Settings';
import { Notification } from './components/Notification/Notification';
import { getStorageData, setStorageData } from './utils/storage';
import { AppSettings, Quote as QuoteType, TimerState } from './types/app';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Joyride, { CallBackProps, Step } from 'react-joyride';
import { v4 as uuidv4 } from 'uuid';
import { Tooltip } from './Tooltip';

// Desired full-mode popup dimensions
const FULL_WIDTH = 320;
const FULL_HEIGHT = 600;

export default function App() {
  const [settings, setSettings] = useState<AppSettings>({
    interval: 15,
    soundEnabled: true,
    notificationsEnabled: true,
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
  const [notification, setNotification] = useState<{ isVisible: boolean; quote: QuoteType } | null>(null);

  // Timer state
  const [timerState, setTimerState] = useState<TimerState>({
    isActive: false,
    isPaused: false,
    timeLeft: 0,
    mode: 'focus',
    interval: 15
  });

  // Minimal mode if timer is active & not paused
  const isShrunk = timerState.isActive && !timerState.isPaused;

  // Joyride steps
  const steps: Step[] = [
    {
      target: '.start-button',
      content: 'Click the green button below to start your Mindfulness Timer session.',
      disableBeacon: true
    },
    {
      target: '.card-area',
      content: 'Click anywhere on the window to pause the timer when it\'s running.',
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
        'notificationsEnabled',
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
        notificationsEnabled: data.notificationsEnabled ?? true,
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

      // If no timerState stored, default
      const storedTimerState: TimerState = data.timerState || {
        isActive: false,
        isPaused: false,
        timeLeft: getModeSeconds(newSettings),
        mode: newSettings.timerMode,
        interval: newSettings.interval
      };
      setTimerState(storedTimerState);

      if (newSettings.autoStartTimer && !storedTimerState.isActive) {
        handleStartTimer();
      }
    };
    loadData();
  }, []);

  // Listen for background messages
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
            interval: 15
          });
          break;
        case 'stopTime':
          setTimerState({
            isActive: false,
            isPaused: false,
            timeLeft: 0,
            mode: 'focus',
            interval: 15
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

  // Timer decrement in popup
  useEffect(() => {
    let interval: number | undefined;
    if (timerState.isActive && timerState.timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft > 0 ? prev.timeLeft - 1 : 0
        }));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState.isActive, timerState.timeLeft]);

  // Timer complete
  async function handleTimerComplete() {
    if (settings.soundEnabled) {
      playSound('complete');
    }
    if (settings.notificationsEnabled) {
      const quote = getRandomQuote();
      setNotification({ isVisible: true, quote });
    }
    // Reset in background
    chrome.runtime.sendMessage({ action: 'resetTimer' });
  }

  // Utility for random quote
  function getRandomQuote(): QuoteType {
    const quotes: QuoteType[] = [
      {
        id: uuidv4(),
        text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.",
        author: "Thich Nhat Hanh",
        category: "presence"
      },
      {
        id: uuidv4(),
        text: "Take a deep breath and relax.",
        author: "Unknown",
        category: "relaxation"
      },
      {
        id: uuidv4(),
        text: "Stay present and mindful.",
        author: "Thich Nhat Hanh",
        category: "mindfulness"
      },
      {
        id: uuidv4(),
        text: "Mindfulness isn't difficult, we just need to remember to do it.",
        author: "Sharon Salzberg",
        category: "mindfulness"
      }
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  // Notification handlers
  function handleTakeBreak() {
    setNotification(null);
    chrome.runtime.sendMessage({ action: 'takeBreak' });
  }
  function handleSnooze() {
    setNotification(null);
    chrome.runtime.sendMessage({ action: 'snoozeTimer' });
  }

  // Reset
  function handleResetTimer() {
    chrome.runtime.sendMessage({ action: 'resetTimer' });
    setTimerState({
      isActive: false,
      isPaused: false,
      timeLeft: getModeSeconds(settings),
      mode: 'focus',
      interval: 15
    });
  }

  // Start/resume/pause
  function handleStartTimer() {
    chrome.runtime.sendMessage({ action: 'startTimer', interval: settings.interval, mode: settings.timerMode });
    setTimerState({
      isActive: true,
      isPaused: false,
      timeLeft: getModeSeconds(settings),
      mode: settings.timerMode,
      interval: settings.interval
    });
  }

  function handleResumeTimer() {
    chrome.runtime.sendMessage({ action: 'resumeTimer' });
    setTimerState(prev => ({ ...prev, isActive: true, isPaused: false }));
  }

  function handlePauseTimer() {
    chrome.runtime.sendMessage({ action: 'pauseTimer' });
    setTimerState(prev => ({ ...prev, isActive: false, isPaused: true }));
  }

  // Minimal mode circle click => pause
  const handleCircleClick = () => {
    handlePauseTimer();
  };

  // Global click => pause
  function handleGlobalClick() {
    if (timerState.isActive && !timerState.isPaused) {
      handlePauseTimer();
    }
  }

  // Audio
  const playSound = useCallback((soundName: string) => {
    const audio = new Audio(chrome.runtime.getURL(`sounds/${soundName}.mp3`));
    audio.volume = settings.soundVolume / 100;
    audio.play().catch(err => console.error("Error playing sound:", err));
  }, [settings.soundVolume]);

  // getModeSeconds
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

  // Container style: 320×600 in full mode, 72×72 in minimal
  const containerStyle: CSSProperties = isShrunk
    ? {
        width: 72,
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'width 0.3s ease, height 0.3s ease'
      }
    : {
        width: FULL_WIDTH,
        height: FULL_HEIGHT,
        overflowY: 'auto',
        transition: 'width 0.3s ease, height 0.3s ease'
      };

  return (
    <div style={containerStyle} onClick={handleGlobalClick}>
      {/* Joyride Onboarding */}
      <Joyride
        steps={!isShrunk ? steps : []}
        run={!isShrunk && run}
        callback={handleJoyrideCallback}
        showSkipButton
        continuous
        styles={{ options: { zIndex: 10000 } }}
        showProgress
        hideCloseButton
        disableOverlayClose
        scrollToFirstStep
      />

      {/* Outer container: fill full area */}
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

        {/* If the settings modal is not open, show timer UI */}
        {!isSettingsOpen && (
          <>
            {isShrunk ? (
              // Minimal Mode Circle
              <div
                className={`w-16 h-16 bg-primary rounded-full flex flex-col items-center justify-center cursor-pointer transition-transform ${
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
                {/* Subtle pause indicator "||" below */}
                {timerState.isActive && !timerState.isPaused && (
                  <span className="text-xs text-white mt-1">||</span>
                )}
              </div>
            ) : (
              // Full Mode "card" area
              <div className="mx-auto my-auto w-full h-full flex flex-col items-center justify-center p-4">
                <div className="relative border card-area border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-6 w-full max-w-sm bg-transparent flex flex-col items-center">
                  {/* Top-left: Theme Toggle, Top-right: Settings */}
                  <div className="absolute top-2 left-2 z-10">
                    <Tooltip text="Switch Theme">
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
                  </div>

                  <div className="absolute top-2 right-2 z-10">
                    <Tooltip text="Open Settings">
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

                  <h1 className="text-3xl font-bold text-center mb-4">
                    Mindfulness Timer
                  </h1>

                  {/* Timer + Quotes */}
                  <div className="flex flex-col items-center space-y-4">
                    <Timer
                      timeLeft={timerState.timeLeft}
                      isActive={timerState.isActive}
                      isPaused={timerState.isPaused}
                      mode={timerState.mode}
                      onStart={timerState.isPaused ? handleResumeTimer : handleStartTimer}
                      onStop={handlePauseTimer}
                      onComplete={handleTimerComplete}
                      isShrunk={false}
                    />

                    {/* Show Quote if enabled */}
                    {settings.showQuotes && (
                      <QuoteComponent
                        changeInterval={settings.quoteChangeInterval}
                        category={settings.quoteCategory}
                      />
                    )}
                  </div>

                  {/* Reset & Onboarding Buttons */}
                  <div className="flex flex-col items-center space-y-2 mt-4">
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

                    <Tooltip text="Start the guided tour of the app">
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

        {/* Notification fade transition */}
        <div
          className={`transition-opacity duration-300 ease-in-out ${
            notification?.isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {notification?.isVisible && (
            <Notification
              quote={notification.quote}
              onClose={() => setNotification(null)}
              onTakeBreak={handleTakeBreak}
              onSnooze={handleSnooze}
            />
          )}
        </div>
      </div>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}

// Helper: format time
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
