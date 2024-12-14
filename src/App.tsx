import React, { useState, useEffect, useRef } from 'react';
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
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

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

  // Manage timeLeft in parent to avoid resets on pause/resume
  const [timeLeft, setTimeLeft] = useState(settings.timerMode === 'focus' ? 25*60 : getModeSeconds(settings));
  const isShrunk = isTimerActive && !isPaused;

  // Keep track of changes to mode/interval to reset timeLeft only when not active or paused
  const prevMode = useRef(settings.timerMode);
  const prevInterval = useRef(settings.interval);

  useEffect(() => {
    const loadSettings = async () => {
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
        'quoteCategory'
      ]);
      const newSettings = { ...settings, ...data };
      setSettings(newSettings);

      // Initialize timeLeft based on the new settings (if not active/paused)
      if (!isTimerActive && !isPaused) {
        setTimeLeft(getModeSeconds(newSettings));
      }

      if (data.autoStartTimer) {
        setIsTimerActive(true);
      }
    };
    loadSettings();
  }, []);

  // Reset timeLeft if mode or interval changes while not active and not paused
  useEffect(() => {
    if (!isTimerActive && !isPaused && (prevMode.current !== settings.timerMode || prevInterval.current !== settings.interval)) {
      setTimeLeft(getModeSeconds(settings));
      prevMode.current = settings.timerMode;
      prevInterval.current = settings.interval;
    }
  }, [settings, isTimerActive, isPaused]);

  // Decrement timeLeft while active
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
      if (timer) window.clearInterval(timer);
    };
  }, [isTimerActive, timeLeft]);

  const quotes = [
    {
      text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.",
      author: "Thich Nhat Hanh"
    },
    {
      text: "Take a deep breath and relax.",
      author: "Unknown"
    },
    {
      text: "Stay present and mindful.",
      author: "Thich Nhat Hanh"
    }
  ];

  async function handleTimerComplete() {
    if (settings.soundEnabled) {
      await playSound('complete');
    }
    if (settings.notificationsEnabled) {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setNotification({ isVisible: true, quote: randomQuote });
    }
    setIsTimerActive(false);
    setIsPaused(false);
  }

  function handleTakeBreak() {
    setNotification(null);
  }

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
    if (['finished', 'skipped'].includes(status)) {
      setRun(false);
    }
  }

  // Classes for main container
  const containerClasses = isShrunk
    ? // Minimal mode: very small, horizontal layout
      'w-64 h-16 bg-white dark:bg-gray-800 flex items-center justify-start px-2 relative'
    : // Normal mode
      'w-96 min-h-[400px] bg-white dark:bg-gray-800 p-6 relative';

  return (
    <div className={`${settings.theme === 'dark' ? 'dark' : ''} h-full w-full`}>
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

      {/* Full viewport background changes with theme */}
      <div className={`h-full w-full ${settings.theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-neutral-light text-gray-900'} flex items-center justify-center`}>
        <main className={containerClasses} style={{ borderRadius: '0.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>

          <Settings
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onSettingsChange={async (newSettings) => {
              setSettings(newSettings);
              await setStorageData(newSettings);
            }}
          />

          {/* Settings Button */}
          <button
            className="settings-button absolute top-2 right-2 p-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full transition-colors"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Open Settings"
          >
            <SettingsIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>

          {!isSettingsOpen && (
            <>
              {isShrunk ? (
                // Minimal bar: [GearIcon already placed above], [Timer], [Click anywhere...]
                <div className="flex-1 flex items-center space-x-2 cursor-pointer" onClick={handlePauseTimer}>
                  <Timer
                    timeLeft={timeLeft}
                    isActive={isTimerActive}
                    mode={settings.timerMode}
                    isShrunk={true}
                    isPaused={isPaused}
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">Click anywhere to pause</span>
                </div>
              ) : (
                // Full layout
                <div className="space-y-6 pt-2">
                  <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">Mindfulness Timer</h1>
                  <div className="space-y-4">
                    <div className="flex flex-col items-center space-y-2 bg-neutral-light dark:bg-gray-700 p-4 rounded-lg">
                      <Timer
                        timeLeft={timeLeft}
                        isActive={isTimerActive}
                        isPaused={isPaused}
                        mode={settings.timerMode}
                        onComplete={handleTimerComplete}
                        onStart={isPaused ? handleResumeTimer : handleStartTimer}
                        onStop={handlePauseTimer}
                        isShrunk={false}
                      />
                      {settings.showQuotes && (
                        <Quote changeInterval={settings.quoteChangeInterval} category={settings.quoteCategory} />
                      )}
                    </div>
                    <div className="flex justify-center space-x-6">
                      <button
                        onClick={isPaused ? handleResumeTimer : handleStartTimer}
                        className="actual-timer-start-button px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light transition-colors"
                        aria-label="Start or Resume Timer"
                      >
                        {isPaused ? 'Resume Timer' : 'Start Timer'}
                      </button>
                      <button
                        onClick={() => setRun(true)}
                        className="px-4 py-2 bg-secondary hover:bg-secondary-light text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-light transition-colors"
                        aria-label="Start Onboarding"
                      >
                        Start Onboarding
                      </button>
                    </div>
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
        </main>
      </div>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}
