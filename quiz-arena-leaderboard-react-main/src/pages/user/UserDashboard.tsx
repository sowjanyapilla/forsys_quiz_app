
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useNavigate } from "react-router-dom";

interface Quiz {
  id: string;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
  time_limit: number;
  total_questions: number;
  has_attempted: boolean;
  active_till: string | null;
}

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [assignedQuizzes, setAssignedQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("quiz_token");
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/quizzes/assigned`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to load assigned quizzes");
      }
      const data: Quiz[] = await response.json();
      setAssignedQuizzes(data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const availableQuizzes = assignedQuizzes.filter((quiz) => !quiz.has_attempted);
  const completedQuizzes = assignedQuizzes.filter((quiz) => quiz.has_attempted);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Forsys Quiz
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back, {user?.full_name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
      onClick={() => {
        logout();           // 1. clear auth
        navigate("/");      // 2. redirect to Index.tsx
      }}
      variant="outline"
      className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
    >
      Logout
    </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-r from-green-400 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Total Quizzes</p>
                    <p className="text-3xl font-bold">{assignedQuizzes.length}</p>
                  </div>
                  <span className="text-4xl">📝</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-blue-400 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Available</p>
                    <p className="text-3xl font-bold">{availableQuizzes.length}</p>
                  </div>
                  <span className="text-4xl">🎯</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-400 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Completed</p>
                    <p className="text-3xl font-bold">{completedQuizzes.length}</p>
                  </div>
                  <span className="text-4xl">✅</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available Quizzes */}
          {availableQuizzes.length > 0 && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  🎯 Available Quizzes ({availableQuizzes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {availableQuizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between p-4 border dark:border-gray-600 rounded-lg bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-600 hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg dark:text-white">{quiz.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">{quiz.description}</p>
                        <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>⏱️ {quiz.time_limit} sec </span>
                          <span>
  ⏳ active till: {quiz.active_till ? new Date(quiz.active_till).toLocaleDateString() : "N/A"} 
</span>

                          <span>❓ {quiz.total_questions} questions</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={quiz.is_active ? "default" : "secondary"}>
                          {quiz.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="dark:border-gray-500 dark:text-white dark:hover:bg-gray-600"
                          >
                            <Link to={`/quiz/${quiz.id}/leaderboard`}>
                              Leaderboard
                            </Link>
                          </Button>
                          <Button
                            asChild
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            size="sm"
                            disabled={!quiz.is_active}
                          >
                            <Link to={`/quiz/${quiz.id}`}>
                              Start Quiz
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed Quizzes */}
          {completedQuizzes.length > 0 && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  ✅ Completed Quizzes ({completedQuizzes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedQuizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between p-4 border dark:border-gray-600 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 opacity-90"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                          {quiz.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">{quiz.description}</p>
                        <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-500">
                          <span>⏱️ {quiz.time_limit} minutes</span>
                          <span>❓ {quiz.total_questions} questions</span>
                          <Badge
                            variant="outline"
                            className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-400"
                          >
                            Completed
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="dark:border-gray-500 dark:text-white dark:hover:bg-gray-600"
                        >
                          <Link to={`/quiz/${quiz.id}/leaderboard`}>
                            View Leaderboard
                          </Link>
                        </Button>
                        <Button
                          disabled
                          size="sm"
                          className="bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        >
                          Quiz Completed
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Quizzes */}
          {assignedQuizzes.length === 0 && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold mb-2 dark:text-white">
                  No Quizzes Assigned
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  You don't have any quizzes assigned yet. Check back later!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
