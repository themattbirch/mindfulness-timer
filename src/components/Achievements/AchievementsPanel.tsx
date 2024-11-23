import { useState } from 'react';
import { Trophy, Target, Award } from 'lucide-react';
import { Achievement, Statistics } from '../../types/app';
import { ShareAchievement } from './ShareAchievement';

interface AchievementsPanelProps {
  achievements: Achievement[];
  statistics: Statistics;
  weeklyGoal: number;
  monthlyGoal: number;
}

export function AchievementsPanel({ 
  achievements, 
  statistics, 
  weeklyGoal, 
  monthlyGoal 
}: AchievementsPanelProps) {
  const [selectedTab, setSelectedTab] = useState<'achievements' | 'goals'>('achievements');

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setSelectedTab('achievements')}
          className={`flex items-center px-4 py-2 rounded-lg ${
            selectedTab === 'achievements'
              ? 'bg-blue-100 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          <Trophy className="w-4 h-4 mr-2" />
          Achievements
        </button>
        <button
          onClick={() => setSelectedTab('goals')}
          className={`flex items-center px-4 py-2 rounded-lg ${
            selectedTab === 'goals'
              ? 'bg-blue-100 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          <Target className="w-4 h-4 mr-2" />
          Goals
        </button>
      </div>

      {selectedTab === 'achievements' ? (
        <div className="grid gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border ${
                achievement.unlockedAt
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{achievement.icon}</span>
                <div>
                  <h3 className="font-medium">{achievement.name}</h3>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>
                {achievement.unlockedAt && (
                  <Award className="w-5 h-5 text-green-500 ml-auto" />
                )}
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 rounded-full h-2"
                    style={{
                      width: `${(achievement.progress / achievement.target) * 100}%`
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-600">
                    {achievement.progress} / {achievement.target}
                  </p>
                  {achievement.unlockedAt && (
                    <ShareAchievement 
                      achievement={achievement}
                      focusScore={statistics.focusScore}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium mb-2">Weekly Goal</h3>
            <div className="flex items-center justify-between">
              <p>{statistics.weeklyMinutes} / {weeklyGoal} minutes</p>
              <span className="text-sm text-blue-600">
                {Math.round((statistics.weeklyMinutes / weeklyGoal) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 rounded-full h-2"
                style={{
                  width: `${(statistics.weeklyMinutes / weeklyGoal) * 100}%`
                }}
              />
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-medium mb-2">Monthly Goal</h3>
            <div className="flex items-center justify-between">
              <p>{statistics.monthlyMinutes} / {monthlyGoal} minutes</p>
              <span className="text-sm text-purple-600">
                {Math.round((statistics.monthlyMinutes / monthlyGoal) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-purple-600 rounded-full h-2"
                style={{
                  width: `${(statistics.monthlyMinutes / monthlyGoal) * 100}%`
                }}
              />
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium mb-2">Focus Score</h3>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">{statistics.focusScore}</p>
              <span className="text-sm text-green-600">
                {statistics.focusScore >= 90 ? 'Master' : 
                 statistics.focusScore >= 70 ? 'Advanced' : 
                 statistics.focusScore >= 50 ? 'Intermediate' : 'Beginner'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 