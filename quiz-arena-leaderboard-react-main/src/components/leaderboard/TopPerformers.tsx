import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LeaderboardEntry } from './LeaderboardDisplay';

interface TopPerformersProps {
  topThree: LeaderboardEntry[];
  formatTime: (seconds: number) => string;
}

export const TopPerformers = ({ topThree, formatTime }: TopPerformersProps) => {
  if (topThree.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          Top 3 Performers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center items-end gap-8 h-64">
          {topThree.map((entry, index) => (
            <div key={entry.username} className="flex flex-col items-center">
              <div className="text-lg font-bold mb-2 text-center dark:text-white">
                {entry.is_current_user ? 'You' : entry.full_name || entry.username}
              </div>
              <div
                className={`w-20 rounded-t-lg flex items-end justify-center text-white font-bold transition-all duration-500 ${index === 0 ? 'bg-gradient-to-t from-yellow-400 to-yellow-600' : index === 1 ? 'bg-gradient-to-t from-gray-400 to-gray-600' : 'bg-gradient-to-t from-orange-400 to-orange-600'}`}
                style={{
                  height: `${120 + (3 - index) * 40}px`,
                  transform: entry.is_current_user ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <div className="mb-2 text-center">
                  <div className="text-2xl mb-1">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <div className="text-lg">{entry.score}%</div>
                </div>
              </div>
              <div className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                <div>{formatTime(entry.time_taken)}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
