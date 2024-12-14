import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Quote as QuoteType } from '../../types/app';

interface QuoteProps {
  changeInterval: number;
  category?: string; 
  onFavorite?: (quote: QuoteType) => void;
}

const defaultQuotes: QuoteType[] = [
  {
    id: '1',
    text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.",
    author: "Thich Nhat Hanh",
    category: "presence",
  },
  {
    id: '2',
    text: "Breathing in, I calm my body. Breathing out, I smile.",
    author: "Thich Nhat Hanh",
    category: "breathing",
  },
  {
    id: '3',
    text: "Mindfulness isn’t difficult, we just need to remember to do it.",
    author: "Sharon Salzberg",
    category: "mindfulness",
  },
];

export function Quote({ changeInterval, category = 'all', onFavorite }: QuoteProps) {
  const [currentQuote, setCurrentQuote] = useState<QuoteType>(defaultQuotes[0]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const filteredQuotes = category === 'all' ? defaultQuotes : defaultQuotes.filter(q => q.category === category);
    if (filteredQuotes.length === 0) return;
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        let newQuote = currentQuote;
        while (newQuote.id === currentQuote.id) {
          newQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
        }
        setCurrentQuote(newQuote);
        setIsTransitioning(false);
      }, 500);
    }, changeInterval * 1000);

    return () => clearInterval(interval);
  }, [changeInterval, category, currentQuote]);

  return (
    <div className="relative bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center transition-all">
      <div
        className={`transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
      >
        <p className="italic text-gray-800 dark:text-gray-200 text-lg">
          "{currentQuote.text}"
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          — {currentQuote.author}
        </p>
      </div>
      {onFavorite && (
        <button
          onClick={() => onFavorite(currentQuote)}
          className={`absolute -right-6 top-0 p-2 rounded-full transition-colors ${
            currentQuote.isFavorite 
              ? 'text-red-500 hover:text-red-600' 
              : 'text-gray-400 hover:text-gray-500'
          }`}
        >
          <Heart className="w-4 h-4" fill={currentQuote.isFavorite ? "currentColor" : "none"} />
        </button>
      )}
    </div>
  );
}
