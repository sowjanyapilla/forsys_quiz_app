
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from "react-router-dom";


interface Quiz {
  id: number;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
  total_questions: number;
  active_till: string | null;
}

interface Submission {
  id: string;
  username: string;
  full_name: string;
  quiz_title: string;
  score: number;
  submitted_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("quiz_token");
      const [quizzesRes, submissionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/quizzes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE_URL}/admin/submissions?limit=5`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (!quizzesRes.ok || !submissionsRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const quizzesData = await quizzesRes.json();
      const submissionsData = await submissionsRes.json();

      const mergedQuizzes = [
        ...quizzesData.active_quizzes.map((q: any) => ({
          ...q,
          is_active: true,
          total_questions: q.total_questions,
        })),
        ...quizzesData.inactive_quizzes.map((q: any) => ({
          ...q,
          is_active: false,
          total_questions: q.total_questions,
        })),
      ];

      setQuizzes(mergedQuizzes);
      setRecentSubmissions(submissionsData);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Could not load dashboard data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleQuizStatus = async (quizId: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("quiz_token");
      const response = await fetch(`${API_BASE_URL}/admin/toggle-quiz/${quizId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update quiz status');
      }

      toast({
        title: "Success",
        description: "Quiz status updated.",
      });

      fetchDashboardData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Could not toggle quiz status.",
        variant: "destructive",
      });
    }
  };

  const activeQuizzes = quizzes.filter((quiz) => quiz.is_active);
  const inactiveQuizzes = quizzes.filter((quiz) => !quiz.is_active);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // The rest of the component remains the same (rendering dashboard UI)

  return (
    // ... UI Code (unchanged from your version) ...
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Forsys Quiz
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome back, {user?.full_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
  onClick={() => {
    logout();         // Clear token and user
    navigate("/");    // Redirect to homepage
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
        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-green-400 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Total Quizzes</p>
                  <p className="text-3xl font-bold">{quizzes.length}</p>
                </div>
                <span className="text-4xl">📝</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-400 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Active Quizzes</p>
                  <p className="text-3xl font-bold">{activeQuizzes.length}</p>
                </div>
                <span className="text-4xl">🎯</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 mb-8">
          <Button asChild className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
            <Link to="/admin/create-quiz">Create New Quiz</Link>
          </Button>
          <Button asChild variant="outline" className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700">
            <Link to="/admin/submissions">View All Submissions</Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Active Quizzes */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <span className="text-2xl">🎯</span>
                Active Quizzes ({activeQuizzes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeQuizzes.map((quiz) => (
                  <div
  key={quiz.id}
  className="flex flex-col md:flex-row md:items-center justify-between p-4 border dark:border-gray-600 rounded-lg bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-600 hover:shadow-md transition-shadow"
>
  {/* Left side - Quiz Info */}
  <div className="flex-1 mb-4 md:mb-0">
    <h3 className="font-semibold text-lg dark:text-white">{quiz.title}</h3>
    <p className="text-gray-600 dark:text-gray-300 mb-2">{quiz.description}</p>

    {/* Meta info row */}
    <div className="flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
      <div className="flex items-center gap-1">
        <span>📅</span>
        <span>Created: {new Date(quiz.created_at).toLocaleDateString()}</span>
      </div>
      <div className="flex items-center gap-1">
        <span>⏳</span>
        <span>
          Active Till:{' '}
          {quiz.active_till ? new Date(quiz.active_till).toLocaleDateString() : 'N/A'}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span>❓</span>
        <span>{quiz.total_questions} questions</span>
      </div>
    </div>
  </div>

  {/* Right side - Actions */}
  <div className="flex flex-col items-end gap-2">
    <Switch
      checked={quiz.is_active}
      onCheckedChange={() => toggleQuizStatus(quiz.id, quiz.is_active)}
    />
    <div className="flex flex-wrap justify-end gap-2">
      <Button asChild className="px-2 py-1 text-xs" variant="outline">
        <Link to={`/quiz/${quiz.id}/leaderboard`}>Leaderboard</Link>
      </Button>
      <Button asChild className="px-2 py-1 text-xs" variant="outline">
        <Link to={`/admin/submissions?quiz=${quiz.id}`}>Submissions</Link>
      </Button>
      <Button asChild className="px-2 py-1 text-xs" variant="outline">
        <Link to={`/admin/quiz-status/${quiz.id}`}>Status</Link>
      </Button>
      <Button asChild className="px-2 py-1 text-xs" variant="outline">
        <Link to={`/admin/feedbacks/${quiz.id}`}>Feedbacks</Link>
      </Button>
    </div>
  </div>
</div>

                ))}
                {activeQuizzes.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No active quizzes. Create one to get started!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Past Quizzes */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <span className="text-2xl">📋</span>
                Inactive Quizzes ({inactiveQuizzes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inactiveQuizzes.map((quiz) => (
                  <div
  key={quiz.id}
  className="flex flex-col md:flex-row md:items-center justify-between p-4 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 opacity-75 hover:shadow-md transition-shadow"
>
  {/* Left - Quiz Info */}
  <div className="flex-1 mb-4 md:mb-0">
    <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300">{quiz.title}</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{quiz.description}</p>

    {/* Meta Info */}
    <div className="flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
      <div className="flex items-center gap-1">
        <span>📅</span>
        <span>Created: {new Date(quiz.created_at).toLocaleDateString()}</span>
      </div>
      <div className="flex items-center gap-1">
        <span>⏳</span>
        <span>
          Active Till:{' '}
          {quiz.active_till ? new Date(quiz.active_till).toLocaleDateString() : 'N/A'}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span>❓</span>
        <span>{quiz.total_questions} questions</span>
      </div>
    </div>
  </div>

  {/* Right - Toggle + Buttons */}
  <div className="flex flex-col items-end gap-2">
    <Switch
      checked={quiz.is_active}
      onCheckedChange={() => toggleQuizStatus(quiz.id, quiz.is_active)}
    />
    <div className="flex flex-wrap justify-end gap-2">
      <Button asChild className="px-2 py-1 text-xs" variant="outline">
        <Link to={`/quiz/${quiz.id}/leaderboard`}>Leaderboard</Link>
      </Button>
      <Button asChild className="px-2 py-1 text-xs" variant="outline">
        <Link to={`/admin/submissions?quiz=${quiz.id}`}>Submissions</Link>
      </Button>
      <Button asChild className="px-2 py-1 text-xs" variant="outline">
        <Link to={`/admin/quiz-status/${quiz.id}`}>Status</Link>
      </Button>
      <Button asChild className="px-2 py-1 text-xs" variant="outline">
        <Link to={`/admin/feedbacks/${quiz.id}`}>Feedbacks</Link>
      </Button>
    </div>
  </div>
</div>

                ))}
                {inactiveQuizzes.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No past quizzes yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Submissions */}
        <Card className="mt-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <span className="text-2xl">📈</span>
              Recent Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSubmissions.slice(0, 5).map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {submission.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium dark:text-white">{submission.full_name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{submission.quiz_title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={submission.score >= 80 ? "default" : "secondary"}>
                      {submission.score}%
                    </Badge>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Button asChild variant="outline" className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700">
                <Link to="/admin/submissions?quiz=all-quizzes">View All Submissions</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

  );
};

export default AdminDashboard;
