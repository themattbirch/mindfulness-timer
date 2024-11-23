import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Quote as QuoteType } from '../../utils/storage';

interface QuoteProps {
  changeInterval: number;
  onFavorite?: (quote: QuoteType) => void;
}

const defaultQuotes: QuoteType[] = [
  {
    id: '1',
    text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.",
    author: "Thich Nhat Hanh",
    category: "presence",
  },
  // Add more default quotes...
];

export function Quote({ changeInterval, onFavorite }: QuoteProps) {
  const [currentQuote, setCurrentQuote] = useState<QuoteType>(defaultQuotes[0]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        const newQuote = defaultQuotes[Math.floor(Math.random() * defaultQuotes.length)];
        setCurrentQuote(newQuote);
        setIsTransitioning(false);
      }, 500);
    }, changeInterval * 1000);

    return () => clearInterval(interval);
  }, [changeInterval]);

  return (
    <div className="relative">
      <div
        className={`transition-opacity duration-500 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <p className="text-center italic text-gray-800 dark:text-gray-200">
          "{currentQuote.text}"
        </p>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
          — {currentQuote.author}
        </p>
      </div>
      {onFavorite && (
        <button
          onClick={() => onFavorite(currentQuote)}
          className={`absolute -right-6 top-0 p-2 rounded-full transition-colors
            ${currentQuote.isFavorite 
              ? 'text-red-500 hover:text-red-600' 
              : 'text-gray-400 hover:text-gray-500'}`}
        >
          <Heart className="w-4 h-4" fill={currentQuote.isFavorite ? "currentColor" : "none"} />
        </button>
      )}
    </div>
  );
} 