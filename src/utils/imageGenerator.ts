import { Achievement } from '../types/app';

export type GradientTheme = {
  name: string;
  startColor: string;
  endColor: string;
  cardColor: string;
  textColor: string;
  accentColor: string;
}

const gradientThemes: GradientTheme[] = [
  {
    name: 'Mindful Blue',
    startColor: '#F0F4FF',
    endColor: '#E6EEFF',
    cardColor: '#FFFFFF',
    textColor: '#1F2937',
    accentColor: '#3B82F6'
  },
  {
    name: 'Sunset Meditation',
    startColor: '#FFF7ED',
    endColor: '#FFEDD5',
    cardColor: '#FFFFFF',
    textColor: '#7C2D12',
    accentColor: '#EA580C'
  },
  {
    name: 'Zen Garden',
    startColor: '#F0FDF4',
    endColor: '#DCFCE7',
    cardColor: '#FFFFFF',
    textColor: '#166534',
    accentColor: '#16A34A'
  },
  {
    name: 'Night Focus',
    startColor: '#1E293B',
    endColor: '#0F172A',
    cardColor: '#334155',
    textColor: '#F8FAFC',
    accentColor: '#38BDF8'
  }
];

export const createShareableImage = async (
  achievement: Achievement,
  focusScore: number,
  themeIndex: number = 0
): Promise<string> => {
  const theme = gradientThemes[themeIndex] || gradientThemes[0];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = 1200;
  canvas.height = 630;

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, theme.startColor);
  gradient.addColorStop(1, theme.endColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Card background
  ctx.fillStyle = theme.cardColor;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, 100, 100, canvas.width - 200, canvas.height - 200, 24);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Reset shadow
  ctx.shadowColor = 'transparent';

  // Achievement icon
  ctx.font = '72px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(achievement.icon, canvas.width / 2, 220);

  // Achievement name
  ctx.font = 'bold 48px system-ui';
  ctx.fillStyle = theme.textColor;
  ctx.fillText(achievement.name, canvas.width / 2, 320);

  // Achievement description
  ctx.font = '24px system-ui';
  ctx.fillStyle = theme.textColor + '99'; // Add transparency
  wrapText(ctx, achievement.description, canvas.width / 2, 380, canvas.width - 400, 32);

  // Focus score
  ctx.font = 'bold 32px system-ui';
  ctx.fillStyle = theme.accentColor;
  ctx.fillText(`Focus Score: ${focusScore}`, canvas.width / 2, 480);

  // App name
  ctx.font = '20px system-ui';
  ctx.fillStyle = theme.textColor + '99';
  ctx.fillText('Mindfulness Timer', canvas.width / 2, canvas.height - 60);

  return canvas.toDataURL('image/png');
};

// Helper function to draw rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Helper function to wrap text
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line, x, currentY);
      line = word + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  
  ctx.fillText(line, x, currentY);
}

export const shareAchievementImage = async (
  achievement: Achievement,
  focusScore: number,
  platform: 'download' | 'twitter' | 'linkedin',
  themeIndex?: number
) => {
  try {
    const imageUrl = await createShareableImage(achievement, focusScore, themeIndex);

    switch (platform) {
      case 'download':
        const link = document.createElement('a');
        link.download = `${achievement.name.toLowerCase().replace(/\s+/g, '-')}-achievement.png`;
        link.href = imageUrl;
        link.click();
        break;

      case 'twitter':
      case 'linkedin':
        // For social media platforms
        const shareText = `I just earned the "${achievement.name}" achievement with a focus score of ${focusScore} in my mindfulness practice! 🧘‍♂️✨ #MindfulnessPractice #Meditation`;
        const shareUrl = 'https://your-extension-url.com'; // Replace with actual URL
        
        if (platform === 'twitter') {
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            '_blank'
          );
        } else {
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`,
            '_blank'
          );
        }
        break;
    }
  } catch (error) {
    console.error('Error generating achievement image:', error);
  }
};

export const getGradientThemes = () => gradientThemes; 