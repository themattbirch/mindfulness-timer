// src/components/Settings/Settings.tsx

import React from 'react';
import { SoundSelector } from './SoundSelector';
import { AppSettings } from '../../types/app';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (newSettings: AppSettings) => void;
}

export function Settings({ isOpen, onClose, settings, onSettingsChange }: SettingsProps) {
  if (!isOpen) return null;

  const handleChange = (key: keyof AppSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-80 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200"
          aria-label="Close Settings"
        >
          &times;
        </button>
        
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Settings</h2>

        <div className="space-y-4">
          {/* Timer Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Timer Interval (minutes)</label>
            <input
              type="number"
              value={settings.interval}
              onChange={(e) => handleChange('interval', Number(e.target.value))}
              className="w-full p-2 border rounded-lg"
              min={1}
            />
          </div>

          {/* Sound Volume */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Sound Volume</label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.soundVolume}
              onChange={(e) => handleChange('soundVolume', Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Enable Sounds */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Enable Sounds</span>
            <button
              onClick={() => handleChange('soundEnabled', !settings.soundEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${settings.soundEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
              aria-label="Toggle Sound Enabled"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {/* Enable Notifications */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Enable Notifications</span>
            <button
              onClick={() => handleChange('notificationsEnabled', !settings.notificationsEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${settings.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
              aria-label="Toggle Notifications Enabled"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {/* Timer Modes */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Timer Modes</h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Select Mode</label>
              <select
                value={settings.timerMode}
                onChange={(e) => handleChange('timerMode', e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="focus">Focus (25 minutes)</option>
                <option value="shortBreak">Short Break (5 minutes)</option>
                <option value="longBreak">Long Break (15 minutes)</option>
              </select>
            </div>

            {/* Quote Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quote Category
              </label>
              <select
                value={settings.quoteCategory}
                onChange={(e) => handleChange('quoteCategory', e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="all">All</option>
                <option value="motivation">Motivation</option>
                <option value="relaxation">Relaxation</option>
                <option value="gratitude">Gratitude</option>
                {/* Add more categories as needed */}
              </select>
            </div>
          </div>

          {/* Sound Selector */}
          <SoundSelector
            selectedSound={settings.selectedSound}
            volume={settings.soundVolume}
            onSoundSelect={(soundId) => handleChange('selectedSound', soundId)}
            onVolumeChange={(volume) => handleChange('soundVolume', volume)}
          />
        </div>
      </div>
    </div>
  );
}
