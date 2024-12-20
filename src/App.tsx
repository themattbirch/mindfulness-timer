// src/App.tsx

import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import './App.css';
import { Timer } from './components/Timer/Timer';
import { Quote as QuoteComponent } from './components/Quote/Quote';
import { Settings } from './components/Settings/Settings';
import { Notification } from './components/Notification/Notification';
import { getStorageData, setStorageData } from './utils/storage';
import { playSound } from './utils/sounds';
import { AppSettings, Quote as QuoteType, TimerState } from './types/app';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Joyride, { CallBackProps, Step } from 'react-joyride';
import { v4 as uuidv4 } from 'uuid';
import { Tooltip } from './Tooltip';

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
  const [timerState, setTimerState] = useState<TimerState>({
    isActive: false,
    isPaused: false,
    timeLeft: 0,
    mode: 'focus',
    interval: 15
  });
  const isShrunk = timerState.isActive && !timerState.isPaused;

  const steps: Step[] = [
    {
      target: '.actual-timer-start-button',
      content: 'Click the green button below to start your Mindfulness Timer session.',
      disableBeacon: true
    },
    {
      target: '.timer-container',
      content: "Click anywhere on the window to pause the timer when it's running.",
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

  // Apply theme based on settings
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Load settings and timer state on mount
  useEffect(() => {
    const loadData = async () => {
      const data = await getStorageData([
        'interval', 'soundEnabled', 'notificationsEnabled', 'theme',
        'soundVolume', 'autoStartTimer', 'showQuotes', 'quoteChangeInterval',
        'selectedSound', 'timerMode', 'quoteCategory',
        'timerState', 'minimalMode'
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

      const storedTimerState: TimerState = data.timerState || {
        isActive: false,
        isPaused: false,
        timeLeft: getModeSeconds(newSettings),
        mode: 'focus',
        interval: 15
      };
      setTimerState(storedTimerState);

      // If autoStartTimer is enabled, start the timer
      if (newSettings.autoStartTimer && !storedTimerState.isActive) {
        handleStartTimer();
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for messages from the background
  useEffect(() => {
    const messageListener = (message: any, sender: any, sendResponse: any) => {
      switch (message.action) {
        case 'updateTime':
          setTimerState(prev => ({
            ...prev,
            timeLeft: message.timeLeft
          }));
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
        default:
          break;
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  // Handle timer completion
  // Removed the useEffect that was causing the notification on load

  // Function to handle timer completion
  async function handleTimerComplete() {
    if (settings.soundEnabled) {
      await playSound('complete');
    }
    if (settings.notificationsEnabled) {
      const randomQuote = getRandomQuote();
      setNotification({ isVisible: true, quote: randomQuote });
    }
    // Reset timer state in the background
    await chrome.runtime.sendMessage({ action: 'resetTimer' });
  }

  // Function to get a random quote
  function getRandomQuote(): QuoteType {
    const quotes: QuoteType[] = [
      {
        id: uuidv4(),
        text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.",
        author: "Thich Nhat Hanh",
        category: "presence",
      },
      {
        id: uuidv4(),
        text: "Take a deep breath and relax.",
        author: "Unknown",
        category: "relaxation",
      },
      {
        id: uuidv4(),
        text: "Stay present and mindful.",
        author: "Thich Nhat Hanh",
        category: "mindfulness",
      },
      {
        id: uuidv4(),
        text: "Mindfulness isn't difficult, we just need to remember to do it.",
        author: "Sharon Salzberg",
        category: "mindfulness",
      },
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  // Handlers for notification actions
  function handleTakeBreak() {
    setNotification(null);
    // Opening the popup window from the background script instead
    chrome.runtime.sendMessage({ action: 'takeBreak' });
  }

  function handleSnooze() {
    setNotification(null);
    chrome.runtime.sendMessage({ action: 'snoozeTimer' });
  }

  // Function to reset the timer
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

  // Function to calculate mode seconds
  function getModeSeconds(s: AppSettings) {
    switch (s.timerMode) {
      case 'focus': return 25 * 60;
      case 'shortBreak': return 5 * 60;
      case 'longBreak': return 15 * 60;
      case 'custom': return s.interval * 60;
      default: return 15 * 60;
    }
  }

  // Handler to start the timer
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

  // Handler to resume the timer
  function handleResumeTimer() {
    chrome.runtime.sendMessage({ action: 'resumeTimer' });
    setTimerState(prev => ({
      ...prev,
      isActive: true,
      isPaused: false
    }));
  }

  // Handler to pause the timer
  function handlePauseTimer() {
    chrome.runtime.sendMessage({ action: 'pauseTimer' });
    setTimerState(prev => ({
      ...prev,
      isActive: false,
      isPaused: true
    }));
  }

  // Handler for clicking the minimized circular timer
  const handleCircleClick = () => {
    handlePauseTimer(); // Utilize the existing pause handler
  };

  // Global click handler to pause the timer when clicking outside
  function handleGlobalClick() {
    if (timerState.isActive && !timerState.isPaused) {
      handlePauseTimer();
    }
  }

  // Manage timeLeft updates while the popup is open
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

  // Apply container styles based on timer state
  const containerStyle: CSSProperties = isShrunk
    ? {
        width: 72,
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'width 0.3s ease, height 0.3s ease',
      }
    : {
        width: 320,
        maxHeight: 600,
        overflowY: 'auto',
        transition: 'width 0.3s ease, height 0.3s ease',
      };

  return (
    <div style={containerStyle} onClick={handleGlobalClick}>
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

      <div
        className={`w-full bg-white dark:bg-gray-900 text-black dark:text-white ${
          isShrunk ? 'flex items-center justify-center' : 'pt-12 pb-6 px-4 min-h-screen relative'
        }`}
      >
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
              // Minimal mode: show the circular timer
              <div
                className={`w-16 h-16 bg-primary rounded-full flex items-center justify-center cursor-pointer transition-transform ${
                  timerState.timeLeft === 0 ? 'animate-ping' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCircleClick();
                }}
              >
                <span className="text-white font-bold text-sm">{formatTime(timerState.timeLeft)}</span>
              </div>
            ) : (
              // Full mode: show theme toggle, settings button, and full UI
              <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 space-y-4 bg-transparent">
                {/* Settings and Theme Toggle Container */}
                <div className="absolute top-2 right-2 flex flex-col items-center space-y-2 z-10">
                  {/* Settings Button */}
                  <Tooltip text="Open Settings">
                    <button
                      className="settings-button p-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-full transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSettingsOpen(true);
                      }}
                      aria-label="Open Settings"
                    >
                      <SettingsIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                  </Tooltip>

                  {/* Theme Toggle Button */}
                  <Tooltip text="Toggle Light/Dark Theme">
                    <button
                      className="theme-toggle-button p-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-full transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
                        setSettings(prev => ({
                          ...prev,
                          theme: newTheme
                        }));
                        chrome.storage.sync.set({ theme: newTheme }); // Persist theme change
                      }}
                      aria-label="Toggle Theme"
                    >
                      {settings.theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                  </Tooltip>
                </div>

                <h1 className="text-3xl font-bold text-center">
                  Mindfulness Timer
                </h1>

                <div className="actual-timer-start-button timer-container flex flex-col items-center space-y-2">
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

                  {settings.showQuotes && (
                    <QuoteComponent
                      changeInterval={settings.quoteChangeInterval}
                      category={settings.quoteCategory}
                    />
                  )}
                </div>

                {settings.showQuotes && (
                  <div className="flex justify-center">
                    <Tooltip text="Reset Timer">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetTimer();
                        }}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                        aria-label="Reset Timer"
                      >
                        Reset Timer
                      </button>
                    </Tooltip>
                  </div>
                )}

                <div className="flex justify-center">
                  <Tooltip text="Start the guided tour of the app">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRun(true);
                      }}
                      className="px-4 py-2 bg-secondary hover:bg-secondary-light text-white rounded-lg shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-secondary-light"
                    >
                      Start Onboarding
                    </button>
                  </Tooltip>
                </div>
              </div>
            )}
          </>
        )}

        {/* Notification with transition */}
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

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`; // Correctly formatted with backticks
}
