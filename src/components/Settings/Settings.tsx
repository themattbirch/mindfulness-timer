import React, { useState } from 'react';
import { SoundSelector } from './SoundSelector';
import { AppSettings, Achievement } from '../../types/app';
import { achievements } from '../../utils/achievements';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (newSettings: AppSettings) => void;
}

export function Settings({ isOpen, onClose, settings, onSettingsChange }: SettingsProps) {
  const [view, setView] = useState<'settings' | 'achievements'>('settings');

  if (!isOpen) return null;

  const handleChange = (key: keyof AppSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const modalWrapperClasses = `
    fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50
  `;

  const modalClasses = `
    ${settings.theme === 'dark' ? 'dark bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}
    p-6 rounded-lg w-96 relative shadow-lg space-y-6
  `;

  const sectionHeaderClasses = `
    text-sm font-medium text-gray-700 dark:text-gray-200 mb-2
  `;

  return (
    <div className={modalWrapperClasses}>
      <div className={modalClasses}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 focus:outline-none"
          aria-label="Close Settings"
        >
          &times;
        </button>
        
        <div className="flex space-x-4 border-b border-gray-300 dark:border-gray-600 pb-2">
          <button
            onClick={() => setView('settings')}
            className={`pb-1 border-b-2 text-sm font-semibold 
              ${view === 'settings' ? 'border-primary text-primary' : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-primary'}`}
          >
            Settings
          </button>
          <button
            onClick={() => setView('achievements')}
            className={`pb-1 border-b-2 text-sm font-semibold 
              ${view === 'achievements' ? 'border-primary text-primary' : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-primary'}`}
          >
            Achievements
          </button>
        </div>

        {view === 'settings' && (
          <div className="space-y-4">
            {/* Timer Mode */}
            <div>
              <label className={sectionHeaderClasses}>Timer Mode</label>
              <select
                value={settings.timerMode}
                onChange={(e) => handleChange('timerMode', e.target.value)}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="focus">Focus (25 minutes)</option>
                <option value="shortBreak">Short Break (5 minutes)</option>
                <option value="longBreak">Long Break (15 minutes)</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Custom Interval if custom mode selected */}
            {settings.timerMode === 'custom' && (
              <div>
                <label className={sectionHeaderClasses}>Custom Duration (minutes)</label>
                <input
                  type="number"
                  value={settings.interval}
                  onChange={(e) => handleChange('interval', Number(e.target.value))}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-gray-200"
                  min={1}
                />
              </div>
            )}

            {/* Sound Volume */}
            <div>
              <label className={sectionHeaderClasses}>Sound Volume</label>
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
            <div className="flex items-center space-x-2">
              <input
                id="enableSounds"
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="enableSounds" className="text-sm font-medium text-gray-700 dark:text-gray-200">Enable Sounds</label>
            </div>

            {/* Enable Notifications */}
            <div className="flex items-center space-x-2">
              <input
                id="enableNotifications"
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => handleChange('notificationsEnabled', e.target.checked)}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="enableNotifications" className="text-sm font-medium text-gray-700 dark:text-gray-200">Enable Notifications</label>
            </div>

            {/* Quote Category */}
            <div>
              <label className={sectionHeaderClasses}>Quote Category</label>
              <select
                value={settings.quoteCategory}
                onChange={(e) => handleChange('quoteCategory', e.target.value)}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="all">All</option>
                <option value="motivation">Motivation</option>
                <option value="relaxation">Relaxation</option>
                <option value="gratitude">Gratitude</option>
              </select>
            </div>

            {/* Show Quotes */}
            <div className="flex items-center space-x-2">
              <input
                id="showQuotes"
                type="checkbox"
                checked={settings.showQuotes}
                onChange={(e) => handleChange('showQuotes', e.target.checked)}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="showQuotes" className="text-sm font-medium text-gray-700 dark:text-gray-200">Show Quotes</label>
            </div>

            {/* Theme Selector */}
            <div>
              <label className={sectionHeaderClasses}>Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            {/* Sound Selector */}
            <SoundSelector
              selectedSound={settings.selectedSound}
              volume={settings.soundVolume}
              onSoundSelect={(soundId) => handleChange('selectedSound', soundId)}
              onVolumeChange={(volume) => handleChange('soundVolume', volume)}
            />
          </div>
        )}

        {view === 'achievements' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Achievements</h2>
            <div className="space-y-2">
              {achievements.map((ach: Achievement) => (
                <div 
                  key={ach.id} 
                  className="p-3 border rounded-lg dark:border-gray-600 dark:bg-gray-700 bg-gray-100 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-gray-700 dark:text-gray-200">{ach.name} {ach.icon}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{ach.description}</div>
                    {ach.progress < ach.target && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Progress: {ach.progress}/{ach.target}
                      </div>
                    )}
                  </div>
                  {ach.unlockedAt ? (
                    <span className="text-green-600 dark:text-green-400 font-bold">Unlocked</span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Locked</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
