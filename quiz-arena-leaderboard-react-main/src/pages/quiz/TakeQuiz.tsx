import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface Question {
  question: string;
  options: string[];
  correct: number;
  time_limit?: number;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  time_limit: number;
  questions: Question[];
  has_question_timers?: boolean;
}

const TakeQuiz = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [index: string]: number }>({});
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [pauseTimer, setPauseTimer] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const hasSubmittedRef = useRef(false);
  const [violationCount, setViolationCount] = useState(0);
  const lastViolationTimeRef = useRef<number | null>(null);
  const [quizEnded, setQuizEnded] = useState(false);

  useEffect(() => {
    const attempted = localStorage.getItem(`quiz_attempted_${id}`);
    if (attempted === "true") navigate("/dashboard", { replace: true });
  }, [id]);

  useEffect(() => {
  const disableEnter = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  document.addEventListener("keydown", disableEnter);
  return () => {
    document.removeEventListener("keydown", disableEnter);
  };
}, []);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/quizzes/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!res.ok) throw new Error("Failed to load quiz");
        const data: Quiz = await res.json();
        setQuiz(data);
        if (data.has_question_timers && data.questions[0]?.time_limit) {
          setQuestionTimeRemaining(data.questions[0].time_limit);
        }
      } catch (err) {
        toast({ title: "Error", description: "Could not load quiz.", variant: "destructive" });
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id, navigate]);

  const handleStartQuiz = async () => {
    try {
      await document.documentElement.requestFullscreen();
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/submissions/start/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("quiz_token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to start quiz");
      const data = await res.json();
      setSubmissionId(data.submission_id);
      setStartTime(new Date(data.started_at).getTime());
      setQuizStarted(true);
    } catch (err) {
      toast({ title: "Error", description: "Could not start quiz.", variant: "destructive" });
    }
  };

  const handleSubmitQuiz = useCallback(async () => {
    if (submitting || !quiz || !startTime || !submissionId || hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setSubmitting(true);

    try {
      let correctCount = 0;
      let notAttemptedCount = 0;

      quiz.questions.forEach((q, idx) => {
        if (answers[idx] === undefined) notAttemptedCount++;
        else if (answers[idx] === q.correct - 1) correctCount++;
      });

      const incorrectCount = quiz.questions.length - correctCount - notAttemptedCount;
      const score = Math.round((correctCount / quiz.questions.length) * 100);
      const timeTaken = (Date.now() - startTime) / 1000;
      const adjustedAnswers = Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v + 1]));

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/quizzes/${id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("quiz_token")}`,
        },
        body: JSON.stringify({
          submission_id: submissionId,
          answers: adjustedAnswers,
          score,
          correct_count: correctCount,
          incorrect_count: incorrectCount,
          not_attempted_count: notAttemptedCount,
          time_taken: timeTaken,
          started_at: new Date(startTime).toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Submission failed");
      localStorage.setItem(`quiz_attempted_${quiz.id}`, "true");

      setQuizEnded(true);

      if (document.fullscreenElement) {
      await document.exitFullscreen();
    }

      toast({
        title: "Quiz Submitted!",
        description: `You scored ${score}% (${correctCount}/${quiz.questions.length})`,
         className: "bg-green-600 text-white border border-green-700 shadow-md font-semibold",
      });
      setShowFeedbackModal(true);
    } catch (err) {
      toast({ title: "Submission Failed", description: "Try again later.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [submitting, quiz, answers, startTime, submissionId]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasSubmittedRef.current) {
        handleSubmitQuiz();
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [handleSubmitQuiz]);

  const handleViolation = () => {
    if (!quizStarted) return;

    const now = Date.now();
    const cooldownMs = 2000;
    if (lastViolationTimeRef.current && now - lastViolationTimeRef.current < cooldownMs) return;
    lastViolationTimeRef.current = now;

    setViolationCount((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        toast({
          title: "Quiz Ended",
          description: "You violated quiz rules too many times.",
          variant: "destructive",
        });
        handleSubmitQuiz();
      } else {
        toast({
          title: "Warning",
          description: `Violation ${next}/3. Stay in fullscreen and avoid switching tabs.`,
          variant: "destructive",
        });
        setShowResumeModal(true);
        setPauseTimer(true);
      }
      return next;
    });
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && quizStarted) handleViolation();
    };
    const handleWindowBlur = () => {
      if (quizStarted && document.visibilityState === "visible") handleViolation();
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && quizStarted && !quizEnded && document.visibilityState === "visible") handleViolation();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [quizStarted, quizEnded]);

  useEffect(() => {
    if (!quizStarted || !quiz?.has_question_timers || questionTimeRemaining <= 0 || pauseTimer) return;
    const timer = setInterval(() => {
      setQuestionTimeRemaining((prev) => {
        if (prev <= 1) {
          if (currentQuestionIndex === quiz.questions.length - 1) handleSubmitQuiz();
          else handleNextQuestion(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quizStarted, questionTimeRemaining, currentQuestionIndex, quiz, handleSubmitQuiz, pauseTimer]);

  useEffect(() => {
    if (quizStarted && quiz?.has_question_timers && quiz.questions[currentQuestionIndex]?.time_limit) {
      setQuestionTimeRemaining(quiz.questions[currentQuestionIndex].time_limit);
    }
  }, [quizStarted, currentQuestionIndex, quiz]);

  const handleAnswerChange = (index: string, answer: number) => {
    setAnswers((prev) => ({ ...prev, [index]: answer }));
  };

  const handleNextQuestion = (_autoAdvance?: boolean) => {
  if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
    setCurrentQuestionIndex((prev) => prev + 1);
  }
};

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (!quiz) return <div className="text-center mt-10">Quiz Not Found</div>;
  if (!quizStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-indigo-100 px-4 py-10">
        <Card className="w-full max-w-2xl border border-blue-200 shadow-xl bg-white rounded-xl">
          <CardHeader className="bg-indigo-50 border-b border-blue-100 rounded-t-xl px-8 pt-6 pb-4">
            <CardTitle className="text-3xl font-bold text-center text-indigo-700">{quiz.title}</CardTitle>
            <p className="text-sm text-center text-gray-600 mt-2">{quiz.description}</p>
          </CardHeader>
          <CardContent className="px-8 py-6 space-y-5 bg-white rounded-b-xl">
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 bg-blue-50 border border-blue-100 rounded-md p-4">
              <li>This quiz is time-bound and will auto-submit when time ends.</li>
              <li>Stay in fullscreen mode. You may exit a maximum of 2 times.</li>
              <li>Switching tabs or windows more than 2 times ends the quiz.</li>
              <li>Some questions have individual timers.</li>
            </ul>
            <div className="flex justify-center pt-4">
              <Button onClick={handleStartQuiz} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-md shadow-md">
                Start Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-100 py-10 px-4">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{quiz.title}</h1>
            <p>Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>
          </div>
          <div className="text-xl font-bold text-blue-600">
            {quiz.has_question_timers && <>{formatTime(questionTimeRemaining)}</>}
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </header>

      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Card className="border border-blue-200 shadow-lg bg-white rounded-xl select-none" onContextMenu={(e) => e.preventDefault()}>
          <CardHeader className="bg-indigo-50 border-b border-blue-100 rounded-t-xl px-6 py-4">
            <CardTitle className="text-xl font-bold text-indigo-700 select-none">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-5 space-y-4">
            <RadioGroup value={answers[currentQuestionIndex.toString()]?.toString() || ""} onValueChange={(val) => handleAnswerChange(currentQuestionIndex.toString(), parseInt(val))}>
              {currentQuestion.options.map((opt, idx) => (
                <div key={idx} className="flex gap-2 p-2 border border-gray-200 rounded-md hover:bg-blue-50 transition-colors">
                  <RadioGroupItem value={idx.toString()} id={`opt-${idx}`} />
                  <Label htmlFor={`opt-${idx}`} className="cursor-pointer text-gray-800 select-none" onContextMenu={(e) => e.preventDefault()}>{opt}</Label>
                </div>
              ))}
            </RadioGroup>
            <div className="mt-4 text-right">
              {currentQuestionIndex === quiz.questions.length - 1 ? (
                <Button onClick={handleSubmitQuiz} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              ) : (
                <Button onClick={() => handleNextQuestion(true)}>Next</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {showResumeModal && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-md text-center">
            <h2 className="text-xl font-bold mb-4">Fullscreen Required</h2>
            <p className="mb-4">You must remain in fullscreen during the quiz. Click below to resume.</p>
            <Button onClick={() => {
              document.documentElement.requestFullscreen();
              setShowResumeModal(false);
              setPauseTimer(false);
            }}>
              Resume Quiz
            </Button>
          </div>
        </div>
      )}

      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-2 text-center">We'd love your feedback!</h2>
            <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} className="w-full p-2 rounded border mb-4" rows={4} placeholder="Type your feedback here..." />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => navigate(`/quiz/${quiz.id}/leaderboard`)}>Skip</Button>
              <Button onClick={async () => {
                try {
                  await fetch(`${import.meta.env.VITE_API_BASE_URL}/quizzes/submit-feedback`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${localStorage.getItem("quiz_token")}`,
                    },
                    body: JSON.stringify({ quiz_id: quiz.id, feedback_text: feedbackText }),
                  });
                } catch (error) {
                  console.error("Feedback submission failed:", error);
                } finally {
                  setShowFeedbackModal(false);
                  navigate(`/quiz/${quiz.id}/leaderboard`);
                }
              }}>
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeQuiz;
