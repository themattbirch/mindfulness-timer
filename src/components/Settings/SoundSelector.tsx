import { useState, useEffect } from 'react';
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
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <Play className="w-4 h-4" />
              </button>
              <span className="text-sm">{sound.name}</span>
            </div>
            <button
              onClick={() => onSoundSelect(sound.id)}
              className={`p-2 rounded-full ${
                selectedSound === sound.id
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                  : 'text-gray-400'
              }`}
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 