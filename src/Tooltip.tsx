// src/Tooltip.tsx

import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 text-white text-xs rounded py-1 px-2 pointer-events-none">
        {text}
      </div>
    </div>
  );
};
