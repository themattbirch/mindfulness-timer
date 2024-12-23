import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
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
    availableSounds.forEach(sound => soundManager.loadSound(sound));
  }, []);

  const handlePreview = async (soundId: string) => {
    if (previewingSound) return; // Prevent multiple previews at once
    setPreviewingSound(soundId);
    await soundManager.playSound(soundId);
    setTimeout(() => setPreviewingSound(null), 1000);
  };

  return (
    <div className="space-y-4 pl-2 w-full">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Select Your Sound:
        </label>
        
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-sm text-gray-700 dark:text-gray-200 min-w-[60px]">Volume:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="flex-grow"
          />
        </div>

        <div className="space-y-3"> 
          {availableSounds.map((sound) => (
            <div key={sound.id} className="flex items-center space-x-3 py-1">
              <input
                type="radio"
                id={sound.id}
                name="soundSelect"
                value={sound.id}
                checked={sound.id === selectedSound}
                onChange={() => onSoundSelect(sound.id)}
                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
              />
              <label
                htmlFor={sound.id}
                className="flex-grow text-sm text-gray-700 dark:text-gray-200"
              >
                {sound.name}
              </label>
              <button
                onClick={() => handlePreview(sound.id)}
                className={`flex items-center px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors ${
                  previewingSound === sound.id ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={previewingSound !== null}
                aria-label={`Preview ${sound.name}`}
              >
                <Play className="w-3 h-3 mr-1" />
                Preview
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
