// src/components/Notification/Notification.tsx

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, X, Clock, Check } from 'lucide-react';
import { Quote as QuoteType } from '../../types/app';

interface NotificationProps {
  quote: QuoteType;
  onClose: () => void;
  onTakeBreak: () => void;
  onSnooze: () => void;
}

export const Notification: React.FC<NotificationProps> = ({
  quote,
  onClose,
  onTakeBreak,
  onSnooze,
}) => {
  // Removed internal isVisible state and useEffect

  const handleClose = () => {
    onClose();
  };

  // Animation variants for Framer Motion
  const slideAnimations = {
    fromTop: {
      initial: { y: -100, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -100, opacity: 0 },
    },
  };

  const transition = {
    duration: 0.3,
    ease: 'easeInOut',
  };

  return (
    <AnimatePresence>
      {/* Render only when the component is mounted */}
      <motion.div
        className="w-full p-4"
        variants={slideAnimations.fromTop}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={transition}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-white">
              <Bell className="w-4 h-4" />
              <span className="font-medium">Time for a mindful break</span>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-100 focus:outline-none"
              aria-label="Close Notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-gray-800 dark:text-gray-200 italic">"{quote.text}"</p>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">— {quote.author}</p>
          </div>

          {/* Actions */}
          <div className="border-t px-4 py-2 flex justify-end space-x-2">
            <button
              onClick={() => {
                onSnooze();
                handleClose();
              }}
              className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
              aria-label="Snooze Notification"
            >
              <Clock className="w-4 h-4 mr-1" />
              Snooze
            </button>
            <button
              onClick={() => {
                onTakeBreak();
                handleClose();
              }}
              className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
              aria-label="Take Break"
            >
              <Check className="w-4 h-4 mr-1" />
              Take Break
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
