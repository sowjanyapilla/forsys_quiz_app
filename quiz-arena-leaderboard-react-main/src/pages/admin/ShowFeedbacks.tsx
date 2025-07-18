import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Feedback {
  id: string;
  feedback_text: string;
  user_name: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;;

const ShowFeedbacks = () => {
  const { quizId } = useParams();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      const token = localStorage.getItem("quiz_token");
      const res = await fetch(`${API_BASE_URL}/admin/feedbacks?quiz_id=${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setFeedbacks(data);
    };

    fetchFeedbacks();
  }, [quizId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-300">
          💬 Feedbacks Overview
        </h1>
        <Button asChild variant="outline" className="text-sm">
          <Link to="/admin">← Back to Dashboard</Link>
        </Button>
      </div>

      <Card className="bg-white shadow-lg dark:bg-gray-800">
        <CardHeader className="bg-blue-100 dark:bg-blue-800 rounded-t-md">
          <CardTitle className="text-blue-900 dark:text-white text-lg">
            Feedbacks for Quiz ID: {quizId}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {feedbacks.length > 0 ? (
            feedbacks.map((f) => (
              <div
                key={f.id}
                className="border border-gray-200 dark:border-gray-700 rounded p-4 bg-gray-50 dark:bg-gray-900"
              >
                <p className="font-semibold text-purple-700 dark:text-purple-300">
                  {f.user_name}
                </p>
                <p className="text-gray-700 dark:text-gray-300">{f.feedback_text}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center">No feedbacks available for this quiz.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShowFeedbacks;
