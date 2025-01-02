import React, { useState, useEffect, CSSProperties } from 'react';
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
import { Tooltip } from './Tooltip';

// ============ CONSTANTS =============
const FULL_WIDTH = 380;
const FULL_HEIGHT = 600;
const CIRCLE_SIZE = 75; 
const ENLARGED_WIDTH = 600;
const ENLARGED_HEIGHT = 400;

const Z_INDEX = {
  BASE: 1000,
  JOYRIDE: 1100,
  OVERLAY: 1050,
};

export default function App() {
  // ---------- 1) STATE -------------
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
    minimalMode: false,
  });

  const [timerState, setTimerState] = useState<TimerState>({
    isActive: false,
    isPaused: false,
    timeLeft: 0,
    mode: 'focus',
    interval: 15,
    isBlinking: false,
    startTime: null,
    endTime: null,
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShrunk, setIsShrunk] = useState(false);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [run, setRun] = useState(false);
  const [quoteChangeCounter, setQuoteChangeCounter] = useState(0);

  // ============ JOYRIDE STEPS ============
  const steps: Step[] = [
    {
      target: '.start-button',
      content: 'Click the green button above to start your Mindfulness Timer session.',
      disableBeacon: true,
    },
    {
      target: '.card-area',
      content: 'Click anywhere on the window to pause the timer when it’s running.',
      disableBeacon: true,
    },
    {
      target: '.quote-area',
      content: 'A random motivational quote will appear when the timer completes.',
      disableBeacon: true,
    },
    {
      target: '.settings-button',
      content: 'Adjust your preferences and timer settings here.',
      disableBeacon: true,
    },
      {
      target: '.kill-timer',
      content: 'Kill/close all open timers (any browser tab) by clicking this button.',
      disableBeacon: true,
    },
  ];

  function handleJoyrideCallback(data: CallBackProps) {
    const { status } = data;
    if (['finished', 'skipped'].includes(status)) {
      setRun(false);
    }
  }

  // ============ 2) THEME LOGIC ============
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // ============ 3) LOAD DATA ON MOUNT + STORAGE LISTENER ============
  useEffect(() => {
    function handleStorageChanged(changes: { [key: string]: chrome.storage.StorageChange }, area: string) {
      if (area === 'sync' && changes.timerState) {
        syncLocalTimerFromStorage();
      }
    }
    chrome.storage.onChanged.addListener(handleStorageChanged);

    (async () => {
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
        'minimalMode',
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
        minimalMode: data.minimalMode ?? false,
      };
      setSettings(newSettings);

      const storedTimerState: TimerState = data.timerState || {
        isActive: false,
        isPaused: false,
        timeLeft: getModeSeconds(newSettings),
        mode: newSettings.timerMode,
        interval: newSettings.interval,
        isBlinking: false,
        startTime: null,
        endTime: null,
      };
      setTimerState(storedTimerState);

      // Auto-start if desired
      if (newSettings.autoStartTimer && !storedTimerState.isActive) {
        handleStartTimer();
      }
    })();

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChanged);
    };
  }, []);

  // ============ 4) AUTO-SHRINK WHEN RUNNING ============
  useEffect(() => {
    if (timerState.isActive && !timerState.isPaused) {
      setIsShrunk(true);
    } else {
      setIsShrunk(false);
    }
  }, [timerState.isActive, timerState.isPaused]);

  // Apply 75×75 if shrunk
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

  // ============ 5) SYNC HELPER ============
  async function syncLocalTimerFromStorage() {
    const data = await getStorageData(['timerState']);
    const newTimer: TimerState | undefined = data.timerState;
    if (newTimer) {
      setTimerState(newTimer);
    }
  }

  // ============ 6) LISTEN FOR MESSAGES ============
  useEffect(() => {
    const messageListener = (message: any) => {
      switch (message.action) {
        case 'timerStarted':
          setTimerState({
            isActive: true,
            isPaused: false,
            timeLeft: message.timerState?.timeLeft ?? 0,
            mode: message.timerState?.mode ?? 'focus',
            interval: message.timerState?.interval ?? 15,
            isBlinking: false,
            startTime: message.timerState?.startTime ?? null,
            endTime: message.timerState?.endTime ?? null,
          });
          syncLocalTimerFromStorage();
          break;

        case 'timerPaused':
          setTimerState((prev) => ({
            ...prev,
            isActive: true,
            isPaused: true,
            timeLeft: message.timerState?.timeLeft ?? prev.timeLeft,
            startTime: message.timerState?.startTime ?? prev.startTime,
            endTime: null,
          }));
          syncLocalTimerFromStorage();
          break;

        case 'timerResumed':
          setTimerState((prev) => ({
            ...prev,
            isActive: true,
            isPaused: false,
            timeLeft: message.timerState?.timeLeft ?? prev.timeLeft,
            startTime: message.timerState?.startTime ?? prev.startTime,
            endTime: message.timerState?.endTime ?? prev.endTime,
          }));
          syncLocalTimerFromStorage();
          break;

        case 'timerReset':
          setTimerState({
            isActive: false,
            isPaused: false,
            timeLeft: getModeSeconds(settings),
            mode: settings.timerMode,
            interval: settings.interval,
            isBlinking: false,
            startTime: null,
            endTime: null,
          });
          syncLocalTimerFromStorage();
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
  }, [settings]);

  // ============ 7) 1-SECOND POLLING ============
  useEffect(() => {
    let intervalId: number | undefined;

    if (timerState.isActive && !timerState.isPaused) {
      intervalId = window.setInterval(async () => {
        const data = await getStorageData(['timerState']);
        const current: TimerState | undefined = data.timerState;
        if (!current || !current.isActive || current.isPaused) {
          clearInterval(intervalId);
          return;
        }
        if (typeof current.endTime === 'number') {
          const now = Date.now();
          const timeLeftMs = current.endTime - now;
          let newTimeLeft = Math.max(0, Math.floor(timeLeftMs / 1000));
          if (newTimeLeft <= 0) {
            newTimeLeft = 0;
            clearInterval(intervalId);
            handleTimerComplete();
          }
          setTimerState((prev) => ({
            ...prev,
            timeLeft: newTimeLeft,
            isActive: current.isActive,
            isPaused: current.isPaused,
            startTime: current.startTime ?? null,
            endTime: current.endTime ?? null,
          }));
        }
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timerState.isActive, timerState.isPaused]);

  // ============ 8) TIMER LOGIC ============
  function getModeSeconds(s: AppSettings): number {
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

  function handleTimerComplete() {
    if (settings.soundEnabled) {
      playSound(settings.selectedSound);
    }
    setTimerState((prev) => ({
      ...prev,
      isActive: false,
      isPaused: false,
      timeLeft: 0,
      isBlinking: true,
    }));
    setQuoteChangeCounter((prev) => prev + 1);
    setStorageData({
      timerState: {
        isActive: false,
        isPaused: false,
        timeLeft: 0,
        mode: settings.timerMode,
        interval: settings.interval,
        isBlinking: true,
        startTime: null,
        endTime: null,
      },
    });
  }

  function playSound(soundName: string): void {
    const soundUrl = chrome.runtime.getURL(`sounds/${soundName}.mp3`);
    const audio = new Audio(soundUrl);
    audio.volume = settings.soundVolume / 100;
    audio.play().catch((err) => {
      console.error(`Failed to play sound "${soundName}":`, err);
    });
  }

  function handleStartTimer() {
    chrome.runtime.sendMessage({
      action: 'startTimer',
      interval: settings.interval,
      mode: settings.timerMode,
    });
    setTimerState({
      isActive: true,
      isPaused: false,
      timeLeft: getModeSeconds(settings),
      mode: settings.timerMode,
      interval: settings.interval,
      isBlinking: false,
      startTime: null,
      endTime: null,
    });
  }

  function handlePauseTimer() {
    chrome.runtime.sendMessage({ action: 'pauseTimer' });
    setTimerState((prev) => ({ ...prev, isPaused: true }));
  }

  function handleResumeTimer() {
    chrome.runtime.sendMessage({ action: 'resumeTimer' });
    setTimerState((prev) => ({ ...prev, isActive: true, isPaused: false }));
  }

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
      endTime: null,
    });
  }

  async function handleRestartTimer() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'globalRestart' });
      console.log('Restart response:', response);
    } catch (err) {
      console.error('Failed to restart timer:', err);
    }
  }

  // ============ 9) NEW => STOP/KILL TIMER ============
  function handleKillTimer() {
    chrome.runtime.sendMessage({ action: 'killTimer' }, (res) => {
      console.log('Kill Timer response:', res);
    });
  }

  // ============ 10) CLICK HANDLERS ============
  function handleGlobalClick() {
    // If timer is running, clicking anywhere in the popup will pause
    if (timerState.isActive && !timerState.isPaused) {
      handlePauseTimer();
    }
  }

  function handleCircleClick() {
    // If timer ended, the circle is blinking => click to reset
    if (timerState.timeLeft === 0 && timerState.isBlinking) {
      handleResetTimer();
      setTimerState((prev) => ({ ...prev, isBlinking: false }));
    } else {
      handlePauseTimer();
    }
  }

  // ============ 11) STYLES ============
  const containerStyle: CSSProperties = isEnlarged
    ? {
        position: 'fixed',
        width: ENLARGED_WIDTH,
        height: ENLARGED_HEIGHT,
        zIndex: Z_INDEX.BASE,
        minWidth: '600px',
        minHeight: '400px',
        overflowY: 'hidden',
        transition: 'width 0.5s ease, height 0.5s ease',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }
    : isShrunk
    ? {
        position: 'fixed',
        width: `${CIRCLE_SIZE}px`,
        height: `${CIRCLE_SIZE}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2979FF',
        overflow: 'hidden',
        transition: 'width 0.3s ease, height 0.3s ease',
        zIndex: Z_INDEX.BASE,
        borderRadius: '50%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: 0,
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
        padding: '20px',
      };

  // ============ 12) RENDER ============
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
        }}
        showProgress
        hideCloseButton
        disableOverlayClose
        scrollToFirstStep
      />

      <div
        className={`w-full h-full bg-white dark:bg-gray-900 text-black dark:text-white ${
          isShrunk ? 'flex items-center justify-center' : 'relative'
        }`}
      >
        {/* SETTINGS MODAL */}
        <Settings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSettingsChange={async (newSettings) => {
            setSettings(newSettings);
            await setStorageData(newSettings);

            // If timer isn't running, update timeLeft to match new interval
            if (!timerState.isActive && !timerState.isPaused) {
              setTimerState((prev) => ({
                ...prev,
                timeLeft: getModeSeconds(newSettings),
                interval: newSettings.interval,
                mode: newSettings.timerMode,
              }));
            }
          }}
        />

        {/* MAIN UI (if not in settings mode) */}
        {!isSettingsOpen && (
          <>
            {isShrunk ? (
              // Shrunk circle
              <div
                className="w-full h-full bg-blue-500 rounded-full flex flex-col items-center justify-center cursor-pointer text-white font-bold text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCircleClick();
                }}
              >
                {/* Show mm:ss */}
                {formatTime(timerState.timeLeft)}
                {timerState.isActive && !timerState.isPaused && (
                  <div className="text-xs mt-1">Pause</div>
                )}
              </div>
            ) : (
              // Full UI
              <div className="w-full max-w-sm flex flex-col">
                <div className="relative border card-area border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 bg-white dark:bg-gray-900 flex flex-col items-center">
                  {/* TOP ROW => THEME & SETTINGS */}
                  <div className="absolute top-4 w-full flex justify-between px-4">
                    <Tooltip text="Theme">
                      <button
                        className="theme-toggle-button p-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-full transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
                          setSettings((prev) => ({ ...prev, theme: newTheme }));
                          chrome.storage.sync.set({ theme: newTheme });
                        }}
                        aria-label="Toggle Theme"
                      >
                        {settings.theme === 'dark' ? '☀️' : '🌙'}
                      </button>
                    </Tooltip>

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

                  {/* Timer */}
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

                  {/* Quote area */}
                  {settings.showQuotes && (
                    <div className="mt-2 quote-area">
                      <QuoteComponent
                        changeInterval={settings.quoteChangeInterval}
                        category={settings.quoteCategory}
                        forceChange={quoteChangeCounter}
                      />
                    </div>
                  )}

                  {/* Buttons under the quote */}
                  <div className="flex flex-col items-center space-y-3 mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResetTimer();
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                      aria-label="Reset Timer"
                    >
                      Restart Timer
                    </button>

                    {/* Horizontal row => Start Onboarding & Stop Timer side by side */}
                    <div className="flex flex-row items-center justify-center space-x-3">
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
                   
                      <Tooltip text="Stop Running Timer">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleKillTimer();
                        }}
                        className="kill-timer px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Kill Timer
                          </button>
                          </Tooltip>
                    </div>
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

// ============ HELPER FOR TIME FORMAT ============
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
