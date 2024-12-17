import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import './App.css';
import { Timer } from './components/Timer/Timer';
import { Quote } from './components/Quote/Quote';
import { Settings } from './components/Settings/Settings';
import { Notification } from './components/Notification/Notification';
import { getStorageData, setStorageData } from './utils/storage';
import { playSound } from './utils/sounds';
import { AppSettings } from './types/app';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Joyride, { CallBackProps, Step } from 'react-joyride';

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
  const [notification, setNotification] = useState<{ isVisible: boolean; quote: { text: string; author: string } } | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isShrunk = isTimerActive && !isPaused;

  const [timeLeft, setTimeLeft] = useState(getModeSeconds(settings));
  const prevMode = useRef(settings.timerMode);
  const prevInterval = useRef(settings.interval);

  const steps: Step[] = [
    {
      target: '.actual-timer-start-button',
      content: 'Click here to start your mindfulness session timer.',
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
  }

  function getRandomQuote() {
    const quotes = [
      { text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
      { text: "Take a deep breath and relax.", author: "Unknown" },
      { text: "Stay present and mindful.", author: "Thich Nhat Hanh" }
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  function handleTakeBreak() { setNotification(null); }
  function handleSnooze() {
    setNotification(null);
    setTimeout(() => handleTimerComplete(), 5 * 60 * 1000);
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
    setTimeLeft(getModeSeconds(settings));
    setIsTimerActive(true);
    setIsPaused(false);
    chrome.runtime.sendMessage({ action: 'startTimer', interval: timeLeft / 60 });
    toast.success(`Timer started: ${settings.timerMode.replace(/([A-Z])/g, ' $1')}`);
  }

  function handlePauseTimer() {
    setIsTimerActive(false);
    setIsPaused(true);
    toast.info('Timer paused.');
  }

  function handleResumeTimer() {
    setIsTimerActive(true);
    setIsPaused(false);
    toast.success('Timer resumed.');
  }

  const handleCircleClick = () => {
    setIsPaused(false);
    setIsTimerActive(false);
  };

  // Global click handler: If timer is active and not paused, pause on any click
  function handleGlobalClick() {
    if (isTimerActive && !isPaused) {
      handlePauseTimer();
    }
  }

  // For minimal mode: small container, just the circle, centered.
  // For full mode: allow auto height, with max-height and overflow-y-auto so the content fits and we can scroll if needed.
  const containerStyle: CSSProperties = isShrunk
  ? {
      width: 72, // pixels
      height: 72, // pixels
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }
  : {
      width: 320, // pixels
      height: 'auto',
      maxHeight: 600, // pixels
      overflowY: 'auto',
    };

  return (
    <div style={containerStyle} onClick={handleGlobalClick}>
      <Joyride
        steps={steps}
        run={run}
        callback={handleJoyrideCallback}
        showSkipButton
        continuous
        styles={{ options: { zIndex: 10000 } }}
        showProgress
        hideCloseButton
        disableOverlayClose
        scrollToFirstStep
      />

      {/* When not shrunk, we want to ensure we have padding at top so gear icon shows */}
      <div className={`w-full ${isShrunk ? '' : 'bg-white dark:bg-gray-900 text-black dark:text-white pt-12 pb-6 px-4'}`}>
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
              <div
                className="w-16 h-16 bg-primary rounded-full flex items-center justify-center cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCircleClick();
                }}
              >
                <span className="text-white font-bold text-sm">{formatTime(timeLeft)}</span>
              </div>
            ) : (
              <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 space-y-4 bg-transparent">
                <button
                  className="settings-button absolute top-2 right-2 p-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-full transition-colors"
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

                <div className="flex flex-col items-center space-y-2">
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

                  {/* Show "Click anywhere..." only in full mode, active, not paused */}
                  {isTimerActive && !isPaused && !isShrunk && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Click anywhere to pause timer
                    </p>
                  )}

                  {settings.showQuotes && (
                    <Quote
                      changeInterval={settings.quoteChangeInterval}
                      category={settings.quoteCategory}
                    />
                  )}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRun(true);
                    }}
                    className="px-4 py-2 bg-secondary hover:bg-secondary-light text-white rounded-lg"
                  >
                    Start Onboarding
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {notification?.isVisible && (
          <Notification
            quote={notification.quote}
            onClose={() => setNotification(null)}
            onTakeBreak={handleTakeBreak}
            onSnooze={handleSnooze}
          />
        )}
      </div>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
