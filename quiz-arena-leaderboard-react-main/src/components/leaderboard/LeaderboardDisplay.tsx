import { CurrentUserPerformance } from './CurrentUserPerformance';
import { TopPerformers } from './TopPerformers';
import { Legend } from './Legend';
import { ParticipantList } from './ParticipantList';
import { formatTime } from "@/utils/time"; 

export interface LeaderboardEntry {
  rank?: number;
  username: string;
  full_name?: string;
  email?: string;
  score: number;
  correct_count: number | null;
  incorrect_count: number | null;
  not_attempted_count: number | null;
  time_taken: number;
  submitted_at: string;
  is_current_user?: boolean;
}

interface LeaderboardDisplayProps {
  entries:
    | LeaderboardEntry[]
    | { quiz_id: number; top_3: LeaderboardEntry[]; others: LeaderboardEntry[] };
  totalQuestions: number;
  showCurrentUserPerformance?: boolean;
  isAdmin?: boolean;
  quizId?: number; 
}

export const LeaderboardDisplay = ({
  entries,
  totalQuestions,
  showCurrentUserPerformance = false,
  isAdmin = false,
}: LeaderboardDisplayProps) => {
  let combinedEntries: LeaderboardEntry[] = [];

  if ("top_3" in entries && "others" in entries) {
    combinedEntries = [...entries.top_3, ...entries.others];
  } else {
    combinedEntries = entries as LeaderboardEntry[];
  }

  // Normalize values
  combinedEntries = combinedEntries.map((entry) => ({
    ...entry,
    correct_count: entry.correct_count ?? 0,
    incorrect_count: entry.incorrect_count ?? 0,
    not_attempted_count: entry.not_attempted_count ?? 0,
  }));

  // Sort by score and time
  combinedEntries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.time_taken - b.time_taken;
  });

  // Assign rank
  combinedEntries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  const topThree = combinedEntries.slice(0, 3);
  const remainingParticipants = combinedEntries.slice(3);
  const currentUserEntry = combinedEntries.find((entry) => entry.is_current_user);
  
  return (
      
    <div className="min-h-screen p-4 space-y-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Current User Performance */}
      {!isAdmin && showCurrentUserPerformance && currentUserEntry && (
        <CurrentUserPerformance
          currentUserEntry={currentUserEntry}
          totalQuestions={totalQuestions}
          formatTime={formatTime}
        />
      )}

      {/* Top 3 Performers */}
      <TopPerformers topThree={topThree} formatTime={formatTime} />

      {/* Legend */}
      <Legend />

      {/* Remaining Participants */}
      <ParticipantList
        remainingParticipants={remainingParticipants}
        totalQuestions={totalQuestions}
        formatTime={formatTime}
      />

      {/* No participants fallback */}
      {combinedEntries.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400">
          No participants yet.
        </div>
      )}
    </div>
  );
};
