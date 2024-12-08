// src/App.tsx

import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import './App.css';
import { Timer } from './components/Timer/Timer';
import { Quote } from './components/Quote/Quote';
import { Settings } from './components/Settings/Settings';
import { Notification } from './components/Notification/Notification';
import { getStorageData } from './utils/storage';
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
    quoteCategory: 'all',
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    quote: { text: string; author: string };
  } | null>(null);

  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isShrunk, setIsShrunk] = useState(false);
  const [run, setRun] = useState(false);

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
        'quoteCategory',
      ]);
      setSettings(prev => ({ ...prev, ...data }));

      if (data.autoStartTimer) {
        setIsTimerActive(true);
        setIsShrunk(true);
      }
    };

    loadSettings();
  }, []);

  const quotes = [
    {
      text: "Take a deep breath and relax.",
      author: "Unknown"
    },
    {
      text: "Stay present and mindful.",
      author: "Thich Nhat Hanh"
    },
    {
      text: "Breathe. Let go. And remind yourself that this very moment is the only one you know you have for sure.",
      author: "Oprah Winfrey"
    }
  ];

  const handleTimerComplete = async () => {
    if (settings.soundEnabled) {
      await playSound('complete');
    }
    if (settings.notificationsEnabled) {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      
      setNotification({
        isVisible: true,
        quote: randomQuote
      });
    }
    setIsTimerActive(false);
    setIsShrunk(false);
  };

  const handleTakeBreak = () => {
    setNotification(null);
  };

  const handleSnooze = () => {
    setNotification(null);
    setTimeout(() => {
      handleTimerComplete();
    }, 5 * 60 * 1000);
  };

  const handleStartTimer = () => {
    setIsTimerActive(true);
    setIsShrunk(true);
    chrome.runtime.sendMessage({ 
      action: 'startTimer', 
      interval: settings.timerMode === 'focus' ? 25 : settings.timerMode === 'shortBreak' ? 5 : 15 
    });
    toast.success(`Timer started: ${settings.timerMode.replace(/([A-Z])/g, ' $1')}`);
  };

  const handleStopTimer = () => {
    setIsTimerActive(false);
    setIsShrunk(false);
    chrome.runtime.sendMessage({ action: 'stopTimer' });
    toast.info('Timer paused.');
  };

  const handleButtonClick = async () => {
    if (settings.soundEnabled) {
      await playSound('click');
    }
    setIsSettingsOpen(true);
  };

  const steps: Step[] = [
    {
      target: '.start-button',
      content: 'Click here to start your mindfulness session.',
      disableBeacon: true
    },
    {
      target: '.settings-button',
      content: 'Adjust your preferences and timer settings here.',
      disableBeacon: true
    }
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (['finished', 'skipped'].includes(status)) {
      setRun(false);
    }
  };

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        callback={handleJoyrideCallback}
        showSkipButton
        continuous
        styles={{
          options: {
            zIndex: 10000,
          },
        }}
        showProgress
        hideCloseButton
        disableOverlayClose
        scrollToFirstStep
      />

      <main className={`w-96 min-h-[400px] p-4 transition-colors duration-300 
        ${settings.theme === 'dark' ? 'dark bg-gray-900' : 'bg-[#F0F4FF]'}`}>
        <div className={`rounded-lg shadow-lg p-4 relative transition-all duration-300 
          ${isShrunk ? 'w-16 h-16' : 'w-full'} 
          ${settings.theme === 'dark' ? 'dark:bg-gray-800' : 'bg-white'}`}>
          
          <button 
            className="settings-button absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            onClick={handleButtonClick}
            aria-label="Open Settings"
          >
            <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          
          <Settings
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onSettingsChange={setSettings}
          />
          
          {!isShrunk && (
            <>
              <h1 className="text-2xl font-bold text-center mb-6 dark:text-white">
                Mindfulness Timer
              </h1>
              
              <div className="space-y-6">
                <Timer 
                  interval={settings.interval} 
                  onComplete={handleTimerComplete}
                  isActive={isTimerActive}
                  onStart={handleStartTimer}
                  onStop={handleStopTimer}
                  mode={settings.timerMode}
                />
                {settings.showQuotes && (
                  <Quote 
                    changeInterval={settings.quoteChangeInterval} 
                    category={settings.quoteCategory} 
                  />
                )}
              </div>
            </>
          )}

          {isShrunk && (
            <div 
              className="flex items-center justify-center w-full h-full cursor-pointer"
              onClick={() => setIsShrunk(false)}
            >
              <Timer 
                interval={settings.interval} 
                onComplete={handleTimerComplete}
                isActive={isTimerActive}
                isShrunk={true}
                mode={settings.timerMode}
              />
            </div>
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
      </main>
      
      <ToastContainer position="bottom-right" autoClose={3000} />

      <button 
        onClick={() => setRun(true)} 
        className="hidden start-button" 
        aria-label="Start Onboarding"
      >
        Start Onboarding
      </button>
    </>
  );
}
