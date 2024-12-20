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
import { AppSettings, Quote as QuoteType } from './types/app';
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
    quoteCategory: 'all'
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notification, setNotification] = useState<{ isVisible: boolean; quote: QuoteType } | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isShrunk = isTimerActive && !isPaused;

  const [timeLeft, setTimeLeft] = useState(getModeSeconds(settings));
  const prevMode = useRef(settings.timerMode);
  const prevInterval = useRef(settings.interval);

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

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  useEffect(() => {
    const loadSettings = async () => {
      const data = await getStorageData([
        'interval', 'soundEnabled', 'notificationsEnabled', 'theme',
        'soundVolume', 'autoStartTimer', 'showQuotes', 'quoteChangeInterval',
        'selectedSound', 'timerMode', 'quoteCategory'
      ]);
      const newSettings = { ...settings, ...data };
      setSettings(newSettings);

      if (!isTimerActive && !isPaused) {
        setTimeLeft(getModeSeconds(newSettings));
      }

      if (data.autoStartTimer) {
        setIsTimerActive(true);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!isTimerActive && !isPaused && (prevMode.current !== settings.timerMode || prevInterval.current !== settings.interval)) {
      setTimeLeft(getModeSeconds(settings));
      prevMode.current = settings.timerMode;
      prevInterval.current = settings.interval;
    }
  }, [settings, isTimerActive, isPaused]);

  useEffect(() => {
    let timer: number | undefined;
    if (isTimerActive && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer !== undefined) {
        clearInterval(timer);
      }
    };
  }, [isTimerActive, timeLeft]);

  async function handleTimerComplete() {
    if (settings.soundEnabled) await playSound('complete');
    if (settings.notificationsEnabled) {
      const randomQuote = getRandomQuote();
      setNotification({ isVisible: true, quote: randomQuote });
    }
    setIsTimerActive(false);
    setIsPaused(false);
    setTimeLeft(getModeSeconds(settings));
  }

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

  function handleTakeBreak() { setNotification(null); }
  function handleSnooze() {
    setNotification(null);
    setTimeout(() => handleTimerComplete(), 5 * 60 * 1000);
  }

  function handleResetTimer() {
    setTimeLeft(getModeSeconds(settings));
    setIsTimerActive(false);
    setIsPaused(false);
    chrome.runtime.sendMessage({ action: 'stopTimer' });
  }

  function getModeSeconds(s: AppSettings) {
    switch (s.timerMode) {
      case 'focus': return 25 * 60;
      case 'shortBreak': return 5 * 60;
      case 'longBreak': return 15 * 60;
      case 'custom': return s.interval * 60;
      default: return 15 * 60;
    }
  }

  function handleStartTimer() {
    setTimeLeft(getModeSeconds(settings)); // Reset to initial duration when starting fresh
    setIsTimerActive(true);
    setIsPaused(false);
    chrome.runtime.sendMessage({ action: 'startTimer', interval: timeLeft / 60 });
  }

  function handleResumeTimer() {
    setIsTimerActive(true);
    setIsPaused(false);
  }

  function handlePauseTimer() {
    setIsTimerActive(false);
    setIsPaused(true);
  }

  const handleCircleClick = () => {
    setIsTimerActive(false);
    setIsPaused(true); // Correctly set isPaused to true when pausing
  };

  function handleGlobalClick() {
    if (isTimerActive && !isPaused) {
      handlePauseTimer();
    }
  }

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
            if (!isTimerActive && !isPaused) {
              setTimeLeft(getModeSeconds(newSettings));
            }
          }}
        />

        {!isSettingsOpen && (
          <>
            {isShrunk ? (
              // Minimal mode: show the circular timer
              <div
                className={`w-16 h-16 bg-primary rounded-full flex items-center justify-center cursor-pointer transition-transform ${
                  timeLeft === 0 ? 'animate-ping' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCircleClick();
                }}
              >
                <span className="text-white font-bold text-sm">{formatTime(timeLeft)}</span>
              </div>
            ) : (
              // Full mode: settings button, and full UI
              <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 space-y-4 bg-transparent">
                   {/* Settings Button */}
                  <button
                    className="settings-button absolute top-2 right-2 p-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-full transition-colors z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSettingsOpen(true);
                    }}
                    aria-label="Open Settings"
                  >
                    <SettingsIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>

                <h1 className="text-3xl font-bold text-center">
                  Mindfulness Timer
                </h1>

                <div className="actual-timer-start-button timer-container flex flex-col items-center space-y-2">
                  <Timer
                    timeLeft={timeLeft}
                    isActive={isTimerActive}
                    isPaused={isPaused}
                    mode={settings.timerMode}
                    onStart={isPaused ? handleResumeTimer : handleStartTimer}
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
