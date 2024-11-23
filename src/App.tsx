import { useState, useEffect } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import './App.css'
import { Timer } from './components/Timer/Timer'
import { Quote } from './components/Quote/Quote'
import { Settings } from './components/Settings/Settings'
import { Notification } from './components/Notification/Notification'
import { getStorageData } from './utils/storage'
import { playSound } from './utils/sounds'
import { AppSettings } from './types/app'

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
    selectedSound: 'gentle-bell'
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    quote: { text: string; author: string };
  } | null>(null);

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
        'quoteChangeInterval'
      ]);
      setSettings(prev => ({ ...prev, ...data }));
    };
    
    loadSettings();
  }, []);

  const handleTimerComplete = async () => {
    if (settings.soundEnabled) {
      await playSound('complete');
    }
    if (settings.notificationsEnabled) {
      const randomQuote = {
        text: "Take a moment to breathe and center yourself.",
        author: "Mindfulness Timer"
      }; // We'll implement proper quote selection later
      
      setNotification({
        isVisible: true,
        quote: randomQuote
      });
    }
  };

  const handleTakeBreak = () => {
    setNotification(null);
    // Additional break logic here
  };

  const handleSnooze = () => {
    setNotification(null);
    // Implement snooze logic
    setTimeout(() => {
      handleTimerComplete();
    }, 5 * 60 * 1000); // 5 minutes snooze
  };

  const handleButtonClick = async () => {
    if (settings.soundEnabled) {
      await playSound('click');
    }
  };

  return (
    <main className={`w-96 min-h-[400px] bg-[#F0F4FF] p-4 ${settings.theme === 'dark' ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 relative">
        <button 
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          onClick={() => {
            handleButtonClick();
            setIsSettingsOpen(true);
          }}
        >
          <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        
        <Settings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSettingsChange={setSettings}
        />
        
        <h1 className="text-2xl font-bold text-center mb-6 dark:text-white">
          Mindfulness Timer
        </h1>
        
        <div className="space-y-6">
          <Timer 
            interval={settings.interval} 
            onComplete={handleTimerComplete}
          />
          {settings.showQuotes && <Quote changeInterval={settings.quoteChangeInterval} />}
        </div>

        {notification && (
          <Notification
            quote={notification.quote}
            onClose={() => setNotification(null)}
            onTakeBreak={handleTakeBreak}
            onSnooze={handleSnooze}
          />
        )}
      </div>
    </main>
  )
}