
import { LeaderboardEntry } from './LeaderboardDisplay';

interface ParticipantListProps {
  remainingParticipants: LeaderboardEntry[];
  totalQuestions: number;
  formatTime: (seconds: number) => string;
}

export const ParticipantList = ({
  remainingParticipants,
  totalQuestions,
  formatTime,
}: ParticipantListProps) => {
  if (remainingParticipants.length === 0) return null;

  return (
    <div className="space-y-3 px-4">
      {remainingParticipants.map((entry) => {
        const correct = entry.correct_count ?? 0;
        const incorrect = entry.incorrect_count ?? 0;
        const notAttempted = entry.not_attempted_count ?? 0;
        const scorePercentage = entry.score;

        return (
          <div
            key={entry.username}
            className="flex items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            {/* Rank */}
            <div className="w-10 text-center font-bold text-purple-600 dark:text-purple-400 text-sm">
              #{entry.rank}
            </div>

            {/* Name */}
            <div className="w-40 truncate font-semibold text-sm text-gray-800 dark:text-gray-100">
              {entry.is_current_user ? 'You' : entry.full_name ?? entry.username}
            </div>

            {/* Score Bar */}
<div className="flex-1 h-5 bg-gray-200 dark:bg-gray-700 rounded-md relative overflow-hidden">
  {scorePercentage > 0 && (
    <div
      className="h-full bg-gradient-to-r from-purple-500 to-purple-700 rounded-md transition-all duration-300"
      style={{
        width: `${scorePercentage}%`,
      }}
    />
  )}

</div>


            {/* Score & Stats */}
            <div className="flex items-center gap-3 text-xs font-medium text-gray-700 dark:text-gray-300 min-w-fit pl-2">
              <span className="text-purple-600 dark:text-purple-400">{scorePercentage}%</span>
              <span>✅ {correct}</span>
              <span>❌ {incorrect}</span>
              <span>❓ {notAttempted}</span>
              <span>⏱ {formatTime(entry.time_taken)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

