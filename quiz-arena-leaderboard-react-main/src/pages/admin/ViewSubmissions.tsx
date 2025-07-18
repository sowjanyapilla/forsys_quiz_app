import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface Submission {
  id: string;
  user_id: string;
  user_name: string;
  quiz_id: string;
  quiz_title: string;
  score: number | null;
  correct_count: number | null;
  incorrect_count: number | null;
  time_taken: number | null;
  submitted_at: string;
  not_attempted_count: number | null;
}

interface Quiz {
  id: string;
  title: string;
}

const Submissions = () => {
  const [searchParams] = useSearchParams();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all-quizzes");
  const [filters, setFilters] = useState({ quiz: "", user: "", search: "" });

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        setLoading(true);
        const quizzesRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/quizzes`);
        const quizzesData = await quizzesRes.json();
        setQuizzes(quizzesData);

        const quizParam = searchParams.get("quiz");
        if (quizParam && quizParam !== "all-quizzes" && quizzesData.some((q) => q.id === quizParam)) {
          setSelectedQuiz(quizParam);
          setFilters((prev) => ({ ...prev, quiz: quizParam }));
        } else {
          setSelectedQuiz("all-quizzes");
          setFilters((prev) => ({ ...prev, quiz: "" }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadQuizzes();
  }, [searchParams]);

  useEffect(() => {
    fetchSubmissions(filters.quiz);
  }, [filters.quiz]);

  const fetchSubmissions = async (quizId?: string) => {
    try {
      setLoading(true);
      let url = `${import.meta.env.VITE_API_BASE_URL}/submissions`;
      if (quizId && quizId !== "all-quizzes") url += `?quiz=${quizId}`;
      const res = await fetch(url);
      const data = await res.json();
      setSubmissions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    const quizMatch = !filters.quiz || s.quiz_id === filters.quiz;
    const userMatch = s.user_name.toLowerCase().includes(filters.user.toLowerCase());
    const searchMatch =
      s.user_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      s.quiz_title.toLowerCase().includes(filters.search.toLowerCase());
    return quizMatch && userMatch && searchMatch;
  });

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "success";       // Green
    if (score >= 50) return "secondary";     // Neutral
    return "destructive";                    // Red
  };

  const calculateStats = () => {
    const total = filteredSubmissions.length;
    const avgScore =
      total > 0 ? Math.round(filteredSubmissions.reduce((sum, s) => sum + (s.score ?? 0), 0) / total) : 0;
    const highScores = filteredSubmissions.filter((s) => (s.score ?? 0) >= 80).length;
    return { total, avgScore, highScores };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-xl text-purple-600 dark:text-purple-300">
        Loading submissions...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              📑 Quiz Submissions
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor and analyze participant results
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <ThemeToggle />
            <Button asChild variant="outline">
              <Link to="/admin">← Back to Admin</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="shadow-lg dark:bg-gray-800">
            <CardContent className="p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">Total Submissions</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg dark:bg-gray-800">
            <CardContent className="p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">High Performers (80%+)</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {stats.highScores}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🔍 Filter Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1 font-medium text-sm">Select Quiz</label>
                <Select
                  value={selectedQuiz}
                  onValueChange={(value) => {
                    setSelectedQuiz(value);
                    setFilters((prev) => ({ ...prev, quiz: value === "all-quizzes" ? "" : value }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Quizzes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-quizzes">All Quizzes</SelectItem>
                    {quizzes.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 font-medium text-sm">Filter by User</label>
                <Input
                  placeholder="User name"
                  value={filters.user}
                  onChange={(e) => setFilters((prev) => ({ ...prev, user: e.target.value }))}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-sm">Search by quiz</label>
                <Input
                  placeholder="Search by name or quiz"
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              📋 Submissions ({filteredSubmissions.length})
              {filters.quiz && (
                <Badge variant="outline" className="ml-2">
                  {quizzes.find((q) => q.id === filters.quiz)?.title}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader >
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Quiz</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Correct</TableHead>
                    <TableHead>Incorrect</TableHead>
                    <TableHead>Unattempted</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <strong>{sub.user_name}</strong>
                        <div className="text-xs text-gray-500">ID: {sub.user_id}</div>
                      </TableCell>
                      <TableCell>{sub.quiz_title}</TableCell>
                      <TableCell>
                        <Badge className={`px-2 py-1 text-xs font-semibold rounded-full  
                            ${sub.score! >= 80 ? "bg-green-600 text-white" :
                            sub.score! >= 50 ? "bg-gray-500 text-white" :
                              "bg-red-600 text-white"}`}>
                          {sub.score !== null ? `${sub.score}%` : "N/A"}
                        </Badge>

                      </TableCell>
                      <TableCell>{sub.correct_count ?? "N/A"}</TableCell>
                      <TableCell>{sub.incorrect_count ?? "N/A"}</TableCell>
                      <TableCell>{sub.not_attempted_count ?? "N/A"}</TableCell>
                      <TableCell>{formatTime(sub.time_taken ?? 0)}</TableCell>
                      <TableCell>
                        {new Date(sub.submitted_at).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-gray-500">
                          {new Date(sub.submitted_at).toLocaleTimeString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredSubmissions.length === 0 && (
                <div className="text-center py-6 text-gray-500">No submissions found</div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Submissions;
