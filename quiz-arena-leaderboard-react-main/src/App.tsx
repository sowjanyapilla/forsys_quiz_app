import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Page imports
import Index from '@/pages/Index';
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import UserDashboard from '@/pages/user/UserDashboard';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import CreateQuiz from '@/pages/admin/CreateQuiz';
import ViewSubmissions from '@/pages/admin/ViewSubmissions';
import TakeQuiz from '@/pages/quiz/TakeQuiz';
import QuizLeaderboard from '@/pages/quiz/QuizLeaderboard';
import QuizStatus from "@/pages/admin/QuizStatus";
import NotFound from '@/pages/NotFound';

import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import ShowFeedbacks from './pages/admin/ShowFeedbacks';
import OAuthCallback from '@/pages/auth/OAuthCallback';



function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background text-foreground transition-colors">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              
              {/* User Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/create-quiz"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <CreateQuiz />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/submissions"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ViewSubmissions />
                  </ProtectedRoute>
                }
              />

              <Route path="/admin/quiz-status/:quiz_id" element={<QuizStatus />} />
              <Route path="/oauth-callback" element={<OAuthCallback />} />
              
              {/* Quiz Routes */}
              <Route
                path="/quiz/:id"
                element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <TakeQuiz />
                  </ProtectedRoute>
                }
              />

              <Route path="/admin/feedbacks/:quizId" element={<ShowFeedbacks />} />

              <Route
                path="/quiz/:id/leaderboard"
                element={
                  <ProtectedRoute allowedRoles={['user', 'admin']}>
                    <QuizLeaderboard />
                  </ProtectedRoute>
                }
              />
              
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
