// src/components/Settings/SoundSelector.tsx

import React, { useState, useEffect } from 'react';
import { Volume2, Play, Check } from 'lucide-react';
import { soundManager, availableSounds } from '../../utils/sounds';

interface SoundSelectorProps {
  selectedSound: string;
  volume: number;
  onSoundSelect: (soundId: string) => void;
  onVolumeChange: (volume: number) => void;
}

export function SoundSelector({ 
  selectedSound, 
  volume, 
  onSoundSelect, 
  onVolumeChange 
}: SoundSelectorProps) {
  const [previewingSound, setPreviewingSound] = useState<string | null>(null);

  useEffect(() => {
    // Preload all sounds
    availableSounds.forEach(sound => soundManager.loadSound(sound));
  }, []);

  const handlePreview = async (soundId: string) => {
    setPreviewingSound(soundId);
    await soundManager.playSound(soundId);
    setTimeout(() => setPreviewingSound(null), 1000);
  };

  return (
    <div className="space-y-4">
      {/* Volume Control */}
      <div className="flex items-center space-x-2">
        <Volume2 className="w-4 h-4 text-gray-400" />
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Sound Selection */}
      <div className="space-y-2">
        {availableSounds.map((sound) => (
          <div
            key={sound.id}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 
                     dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handlePreview(sound.id)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label={`Preview sound ${sound.name}`}
              >
                <Play className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <span className="text-sm">{sound.name}</span>
            </div>
            <button
              onClick={() => onSoundSelect(sound.id)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors
                ${sound.id === selectedSound ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              aria-label={`Select sound ${sound.name}`}
            >
              {sound.id === selectedSound && <Check className="w-4 h-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
