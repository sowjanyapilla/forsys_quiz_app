import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LeaderboardDisplay } from "@/components/leaderboard/LeaderboardDisplay";

// Leaderboard Entry Interface
interface LeaderboardEntry {
  rank: number;
  username: string;
  full_name: string;
  score: number;
  correct_count: number;
  incorrect_count: number;
  not_attempted_count: number;
  time_taken: number;
  submitted_at: string;
  is_current_user: boolean;
}

// Quiz Interface
interface Quiz {
  id: string;
  title: string;
  description: string;
  total_questions: number;
}

const QuizLeaderboard = () => {
  const { id } = useParams<{ id: string }>(); // Get quiz ID from URL params
  const { user, isAdmin } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [leaderboard, setLeaderboard] = useState<{
    quiz_id: number;
    top_3: LeaderboardEntry[];
    others: LeaderboardEntry[];
  } | null>({
    quiz_id: 0,
    top_3: [],
    others: [],
  });

  const [loading, setLoading] = useState(true);

  // Helper function to fetch data
  const fetchData = async (url: string) => {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!res.ok) throw new Error(`Failed to fetch data from ${url}`);
    return await res.json();
  };

  // Fetch quiz data
  const fetchQuizData = async () => {
    try {
      const quizId = parseInt(id); // Ensure the quiz ID is a number
      const data = await fetchData(`${import.meta.env.VITE_API_BASE_URL}/quizzes/${quizId}`);
      setQuiz(data);
      await fetchLeaderboard(); // Fetch leaderboard after loading quiz data
    } catch (error) {
      console.error("Failed to fetch quiz data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    try {
      const quizId = parseInt(id); // Ensure the quiz ID is a number
      const data = await fetchData(`${import.meta.env.VITE_API_BASE_URL}/quizzes/${quizId}/leaderboard`);
      setLeaderboard(data);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    }
  };

  // UseEffect hook for initial data load
  useEffect(() => {
    fetchQuizData();
    const interval = setInterval(fetchLeaderboard, 3000); // Refresh leaderboard every 3 seconds
    return () => clearInterval(interval);
  }, [id]);

  // Show loading state if data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  // Show error if no leaderboard data found
  if (!leaderboard || leaderboard.top_3.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No leaderboard data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {quiz?.title} - Leaderboard
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-gray-600 dark:text-gray-400">Live updates</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button
                asChild
                variant="outline"
                className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
              >
                <Link to={isAdmin ? "/admin" : "/dashboard"}>
                  Back to {isAdmin ? "Admin" : "Dashboard"}
                </Link>
              </Button>
              {isAdmin && quiz?.id && quiz?.title && (
    <Button
      variant="default"
      className="bg-green-600 text-white hover:bg-green-700"
      onClick={async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/export-leaderboard?quiz_id=${quiz.id}`);
          if (!res.ok) throw new Error("Failed to export leaderboard");

          const blob = await res.blob();
          let filename = `${quiz.title.replace(/\s+/g, "_")}_leaderboard_${new Date()
            .toISOString()
            .replace(/[:.]/g, "-")}.xlsx`;

          const disposition = res.headers.get("Content-Disposition");
          if (disposition) {
            const utfMatch = disposition.match(/filename\*=UTF-8''(.+?)(;|$)/);
            if (utfMatch && utfMatch[1]) {
              filename = decodeURIComponent(utfMatch[1]);
            } else {
              const simpleMatch = disposition.match(/filename="?([^"]+)"?/);
              if (simpleMatch && simpleMatch[1]) {
                filename = simpleMatch[1];
              }
            }
          }

          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          a.click();
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Export failed:", error);
        }
      }}
    >
      📥 Export
    </Button>
  )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <LeaderboardDisplay
          entries={leaderboard}
          totalQuestions={quiz?.total_questions || 5}
          showCurrentUserPerformance={true}
          isAdmin={isAdmin}
          quizId={Number(quiz?.id)}
        />
      </div>
    </div>
  );
};

export default QuizLeaderboard;
