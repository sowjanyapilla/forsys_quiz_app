
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LeaderboardEntry } from "./LeaderboardDisplay";

interface CurrentUserPerformanceProps {
  currentUserEntry: LeaderboardEntry;
  totalQuestions: number;
  formatTime: (seconds: number) => string;
}

export const CurrentUserPerformance = ({ 
  currentUserEntry, 
  totalQuestions, 
  formatTime 
}: CurrentUserPerformanceProps) => {
  return (
    <Card className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700">
      <CardHeader>
        <CardTitle className="text-center">Your Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">#{currentUserEntry.rank}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Rank</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{currentUserEntry.score}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {currentUserEntry.correct_count}/{totalQuestions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Correct</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {formatTime(currentUserEntry.time_taken)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Time</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
