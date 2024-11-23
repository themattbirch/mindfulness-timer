import { useEffect, useRef } from 'react';
import { GradientTheme } from '../../utils/imageGenerator';

interface ThemePreviewProps {
  theme: GradientTheme;
  isSelected: boolean;
  onSelect: () => void;
}

export function ThemePreview({ theme, isSelected, onSelect }: ThemePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set dimensions
    canvas.width = 120;
    canvas.height = 63;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, theme.startColor);
    gradient.addColorStop(1, theme.endColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Card preview
    ctx.fillStyle = theme.cardColor;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    roundRect(ctx, 10, 10, canvas.width - 20, canvas.height - 20, 4);
    ctx.fill();

    // Text preview
    ctx.shadowBlur = 0;
    ctx.fillStyle = theme.textColor;
    ctx.font = '8px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Achievement', canvas.width / 2, canvas.height / 2);
  }, [theme]);

  return (
    <button
      onClick={onSelect}
      className={`relative rounded-lg overflow-hidden transition-all ${
        isSelected ? 'ring-2 ring-blue-500 scale-105' : 'hover:scale-105'
      }`}
    >
      <canvas ref={canvasRef} className="w-[120px] h-[63px]" />
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 px-2 py-1">
        <p className="text-xs text-white truncate">{theme.name}</p>
      </div>
    </button>
  );
}

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