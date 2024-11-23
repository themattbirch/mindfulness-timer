import { useState } from 'react';
import { Clock, Trophy, Target, Calendar, Zap } from 'lucide-react';
import { Statistics as StatsType } from '../../types/app';
import { StatisticsChart } from './StatisticsChart';

interface StatisticsProps {
  statistics: StatsType;
}

export function Statistics({ statistics }: StatisticsProps) {
  const [selectedView, setSelectedView] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-medium">Total Time</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {Math.round(statistics.totalMinutes / 60)}h {statistics.totalMinutes % 60}m
          </p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-medium">Current Streak</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {statistics.dailyStreak} days
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            Best: {statistics.bestStreak} days
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-medium">Completion Rate</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {Math.round(statistics.completionRate * 100)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h3 className="font-medium">Total Sessions</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {statistics.totalSessions}
          </p>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-medium">Avg. Duration</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {Math.round(statistics.averageSessionDuration)} min
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Session History</h3>
          <div className="flex space-x-2">
            {['daily', 'weekly', 'monthly'].map((view) => (
              <button
                key={view}
                onClick={() => setSelectedView(view as typeof selectedView)}
                className={`px-3 py-1 rounded-md text-sm ${
                  selectedView === view
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <StatisticsChart data={statistics.sessionHistory} view={selectedView} />
      </div>
    </div>
  );
} 