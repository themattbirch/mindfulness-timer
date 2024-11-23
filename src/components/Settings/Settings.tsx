import { useState } from 'react';
import { X, Volume2, VolumeX, Bell, BellOff, Moon, Sun, Sliders } from 'lucide-react';
import { setStorageData } from '../../utils/storage';
import { SoundSelector } from './SoundSelector';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    interval: number;
    soundEnabled: boolean;
    notificationsEnabled: boolean;
    theme: 'light' | 'dark';
    soundVolume: number;
    autoStartTimer: boolean;
    showQuotes: boolean;
    quoteChangeInterval: number;
    selectedSound: string;
  };
  onSettingsChange: (newSettings: any) => void;
}

export function Settings({ isOpen, onClose, settings, onSettingsChange }: SettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleChange = async (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    await setStorageData({ [key]: value });
    onSettingsChange(newSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-white rounded-lg shadow-lg z-10 overflow-y-auto">
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Timer Settings Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Timer</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reminder Interval
              </label>
              <select
                value={localSettings.interval}
                onChange={(e) => handleChange('interval', Number(e.target.value))}
                className="w-full p-2 border rounded-lg"
              >
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Auto-start Timer</span>
              <button
                onClick={() => handleChange('autoStartTimer', !localSettings.autoStartTimer)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${localSettings.autoStartTimer ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${localSettings.autoStartTimer ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Notifications</h3>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Desktop Notifications</span>
              <button
                onClick={() => handleChange('notificationsEnabled', !localSettings.notificationsEnabled)}
                className={`p-2 rounded-full transition-colors ${
                  localSettings.notificationsEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
                }`}
              >
                {localSettings.notificationsEnabled ? (
                  <Bell className="w-5 h-5" />
                ) : (
                  <BellOff className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Sound Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Sound Settings
              </h3>
              
              <SoundSelector
                selectedSound={localSettings.selectedSound}
                volume={localSettings.soundVolume}
                onSoundSelect={(soundId) => handleChange('selectedSound', soundId)}
                onVolumeChange={(volume) => handleChange('soundVolume', volume)}
              />
            </div>
          </div>

          {/* Quote Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Quotes</h3>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Show Quotes</span>
              <button
                onClick={() => handleChange('showQuotes', !localSettings.showQuotes)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${localSettings.showQuotes ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${localSettings.showQuotes ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>

            {localSettings.showQuotes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quote Change Interval
                </label>
                <select
                  value={localSettings.quoteChangeInterval}
                  onChange={(e) => handleChange('quoteChangeInterval', Number(e.target.value))}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                  <option value={900}>15 minutes</option>
                </select>
              </div>
            )}
          </div>

          {/* Theme Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Appearance</h3>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Theme</span>
              <button
                onClick={() => handleChange('theme', localSettings.theme === 'light' ? 'dark' : 'light')}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                {localSettings.theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 