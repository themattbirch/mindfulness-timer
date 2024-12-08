import { useState, useEffect } from 'react';
import { Bell, X, Check, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { slideAnimations, transition } from '../../utils/animations';

interface NotificationProps {
  quote: {
    text: string;
    author: string;
  };
  onClose: () => void;
  onTakeBreak: () => void;
  onSnooze: () => void;
}

export function Notification({ quote, onClose, onTakeBreak, onSnooze }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Slide in animation
    setTimeout(() => setIsVisible(true), 100);
    
    // Auto-dismiss after 30 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow animation to complete
    }, 30000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-4 right-4 w-80"
          variants={slideAnimations.fromTop}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
        >
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white">
                <Bell className="w-4 h-4" />
                <span className="font-medium">Time for a mindful break</span>
              </div>
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
  className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-gray-800 italic">{quote.text}</p>
              <p className="text-gray-600 text-sm mt-2">— {quote.author}</p>
            </div>

            {/* Actions */}
            <div className="border-t px-4 py-2 flex justify-end space-x-2">
              <button
                onClick={onSnooze}
  className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <Clock className="w-4 h-4 mr-1" />
                Snooze
              </button>
              <button
                onClick={onTakeBreak}
  className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <Check className="w-4 h-4 mr-1" />
                Take Break
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 