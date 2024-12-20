// Tooltip.tsx
import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute bottom-full mb-2 hidden group-hover:block px-2 py-1 bg-gray-700 text-white text-sm rounded">
        {text}
      </div>
    </div>
  );
}
