import { LeaderboardEntry } from "./LeaderboardDisplay";
import { Progress } from "@/components/ui/progress";
import { formatTime } from "@/utils/time";

interface ParticipantBarProps {
  participant: LeaderboardEntry;
  totalQuestions: number;
  formatTime: (seconds: number | null | undefined) => string;
}

export const ParticipantBar = ({
  participant,
  totalQuestions,
  formatTime,
}: ParticipantBarProps) => {
  const percent = (participant.score / (totalQuestions * 1)) * 100;

  return (
    <div className="border-b py-4 space-y-1">
      {/* Rank and Name */}
      <div className="flex items-center gap-3">
        <div className="w-12 text-center font-bold text-purple-600 dark:text-purple-300">
          #{participant.rank}
        </div>
        <div className="font-semibold">
          {participant.full_name || participant.username}
        </div>
      </div>

      {/* Progress bar + stats on the same row */}
      <div className="flex items-center gap-4">
        {/* Progress bar */}
        <div className="flex-1">
          <Progress
            value={percent}
            className="h-3 bg-gray-200 dark:bg-gray-700"
          />
        </div>

        {/* Stats next to bar */}
        <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
          <span>Score: {participant.score}</span>
          <span>✅ {participant.correct_count}</span>
          <span>❌ {participant.incorrect_count}</span>
          <span>🚫 {participant.not_attempted_count}</span>
          <span>⏱ {formatTime(participant.time_taken)}</span>
        </div>
      </div>
    </div>
  );
};
