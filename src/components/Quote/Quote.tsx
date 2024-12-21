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
    text: "There are three ways to ultimate success: The first way is to be kind. The second way is to be kind. The third way is to be kind.",
    author: "Mister Rogers",
    category: "kindness",
  },
  {
    id: '2',
    text: "Success is peace of mind, which is a direct result of self-satisfaction in knowing you made the effort to become the best of which you are capable.",
    author: "John Wooden",
    category: "success",
  },
  {
    id: '3',
    text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.",
    author: "Thich Nhat Hanh",
    category: "presence",
  },
  {
    id: '4',
    text: "I never dreamed about success. I worked for it.",
    author: "Estée Lauder",
    category: "success",
  },
  {
    id: '5',
    text: "Success is not final; failure is not fatal: It is the courage to continue that counts.",
    author: "Winston Churchill",
    category: "success",
  },
  {
    id: '6',
    text: "Breathing in, I calm my body. Breathing out, I smile.",
    author: "Thich Nhat Hanh",
    category: "breathing",
  },
  {
    id: '7',
    text: "Success usually comes to those who are too busy to be looking for it.",
    author: "Henry David Thoreau",
    category: "success",
  },
  {
    id: '8',
    text: "Mindfulness isn't difficult, we just need to remember to do it.",
    author: "Sharon Salzberg",
    category: "mindfulness",
  },
  {
    id: '9',
    text: "Develop success from failures. Discouragement and failure are two of the surest stepping stones to success.",
    author: "Dale Carnegie",
    category: "success",
  },
  {
    id: '10',
    text: "The road to success and the road to failure are almost exactly the same.",
    author: "Colin R. Davis",
    category: "success",
  },
  {
    id: '11',
    text: "Success is getting what you want; happiness is wanting what you get.",
    author: "W. P. Kinsella",
    category: "success",
  },
  {
    id: '12',
    text: "It is better to fail in originality than to succeed in imitation.",
    author: "Herman Melville",
    category: "success",
  },
  {
    id: '13',
    text: "Nothing in the world can take the place of persistence. Talent will not; nothing is more common than unsuccessful men with talent. Genius will not; unrewarded genius is almost a proverb. Education will not; the world is full of educated derelicts. The slogan 'Press On' has solved and always will solve the problems of the human race.",
    author: "Calvin Coolidge",
    category: "persistence",
  }
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
    <div className="relative quote-area bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center transition-all">
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