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
    setPreviewingSound(soundId);
    await soundManager.playSound(soundId);
    setTimeout(() => setPreviewingSound(null), 1000);
  };

  return (
    <div className="mt-4 space-y-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Select Your Sound:</h3>
      <div className="flex items-center space-x-2">
        <span className="text-gray-700 dark:text-gray-200">Volume:</span>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-full"
        />
      </div>

  <ul role="radiogroup" className="list-none m-0 p-0 space-y-2" style={{ listStyleType: 'none' }}>
        {availableSounds.map((sound) => {
          const isSelected = sound.id === selectedSound;
          return (
<li className="flex items-center space-x-3">
              <input
                type="radio"
                name="soundSelect"
                value={sound.id}
                checked={isSelected}
                onChange={() => onSoundSelect(sound.id)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                aria-checked={isSelected}
              />
               <span>{sound.name}</span>
  <button onClick={() => handlePreview(sound.id)} className="text-sm px-2 py-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded">
    <Play className="w-4 h-4 mr-1" />Preview
  </button>
</li>
          );
        })}
      </ul>
    </div>
  );
}
