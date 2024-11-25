import { useState } from 'react';
import { Share2, Twitter, Linkedin, Download, Image } from 'lucide-react';
import { Achievement } from '../../types/app';
import { shareAchievementImage, getGradientThemes } from '../../utils/imageGenerator';

interface ShareAchievementProps {
  achievement: Achievement;
  focusScore: number;
}

export function ShareAchievement({ achievement, focusScore }: ShareAchievementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(0);
  const themes = getGradientThemes();

  const handleShare = async (platform: 'twitter' | 'linkedin' | 'download') => {
    setIsLoading(true);
    try {
      await shareAchievementImage(achievement, focusScore, platform, selectedTheme);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        {themes.map((theme, index) => (
          <button
            key={theme.name}
            onClick={() => setSelectedTheme(index)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              selectedTheme === index 
                ? 'border-blue-500 scale-110' 
                : 'border-transparent'
            }`}
            style={{
              background: `linear-gradient(135deg, ${theme.startColor}, ${theme.endColor})`
            }}
            title={theme.name}
          />
        ))}
      </div>

      <div className="flex items-center space-x-2">
        {isLoading ? (
          <div className="flex items-center justify-center p-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900" />
          </div>
        ) : (
          <>
            <button
              onClick={() => handleShare('twitter')}
              className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900 
                       text-blue-500 dark:text-blue-400 transition-colors"
              title="Share on Twitter"
            >
              <Twitter className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => handleShare('linkedin')}
              className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900 
                       text-blue-700 dark:text-blue-400 transition-colors"
              title="Share on LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => handleShare('download')}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 
                       text-gray-600 dark:text-gray-400 transition-colors"
              title="Download achievement image"
            >
              <Download className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
} 