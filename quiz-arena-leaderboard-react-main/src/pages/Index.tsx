
// import { useAuth } from '@/contexts/AuthContext';
// import { Navigate } from 'react-router-dom';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Link } from 'react-router-dom';

// const Index = () => {
//   const { isAuthenticated, isAdmin } = useAuth();

//   // Redirect authenticated users to their appropriate dashboard
//   if (isAuthenticated) {
//     return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
//       <div className="container mx-auto px-4 py-16">
//         {/* Hero Section */}
//         <div className="text-center mb-16">
//           <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
//             Quiz Arena
//           </h1>
//           <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
//             Challenge yourself, compete with colleagues, and climb the leaderboards in our interactive quiz platform
//           </p>
//           <div className="flex gap-4 justify-center">
//             <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
//               <Link to="/login">Get Started</Link>
//             </Button>
//             <Button asChild variant="outline" size="lg">
//               <Link to="/signup">Sign Up</Link>
//             </Button>
//           </div>
//         </div>

//         {/* Features Grid */}
//         <div className="grid md:grid-cols-3 gap-8 mb-16">
//           <Card className="text-center hover:shadow-lg transition-shadow">
//             <CardHeader>
//               <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
//                 <span className="text-2xl text-white">🏆</span>
//               </div>
//               <CardTitle>Real-time Leaderboards</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="text-gray-600">
//                 Compete with your colleagues and see live rankings update in real-time as you complete quizzes
//               </p>
//             </CardContent>
//           </Card>

//           <Card className="text-center hover:shadow-lg transition-shadow">
//             <CardHeader>
//               <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
//                 <span className="text-2xl text-white">📊</span>
//               </div>
//               <CardTitle>Interactive Analytics</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="text-gray-600">
//                 Track your progress with beautiful charts and detailed performance analytics
//               </p>
//             </CardContent>
//           </Card>

//           <Card className="text-center hover:shadow-lg transition-shadow">
//             <CardHeader>
//               <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
//                 <span className="text-2xl text-white">⚡</span>
//               </div>
//               <CardTitle>Instant Results</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="text-gray-600">
//                 Get immediate feedback on your performance and see how you stack up against others
//               </p>
//             </CardContent>
//           </Card>
//         </div>

//         {/* CTA Section */}
//         <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
//           <h2 className="text-3xl font-bold mb-4">Ready to Test Your Knowledge?</h2>
//           <p className="text-xl mb-6 opacity-90">
//             Join thousands of professionals already using Quiz Arena to enhance their skills
//           </p>
//           <Button asChild size="lg" variant="secondary">
//             <Link to="/signup">Start Your Journey</Link>
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Index;
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col justify-center items-center p-6">

      {/* Logo positioned top-left */}
      <img
        src="/forsys.png"
        alt="Forsys Logo"
        className="absolute top-6 left-6 w-40" // Change w-40 to w-48 or w-56 if you want it even bigger
      />

      {/* Title */}
      <h1 className="text-5xl font-extrabold text-blue-700 text-center mb-4">
        Welcome to Forsys Quiz App
      </h1>

      {/* Subtitle */}
      <p className="text-lg text-gray-700 text-center max-w-xl mb-8">
        Engage, learn, and compete with your colleagues through our interactive quiz platform designed for Forsys employees.
      </p>

      {/* Actions */}
      <div className="flex flex-col items-center gap-4">
        {/* Google Login Button */}
        <button
          onClick={() => {
            window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/login`;
          }}
          className="bg-white border border-gray-300 text-black py-2 px-6 rounded hover:bg-gray-100 transition-all flex items-center gap-2"
        >
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google"
            className="h-5 w-5"
          />
          Login with Google
        </button>
        {/* <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
          <Link to="/login">Login</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/signup">Sign Up</Link>
        </Button> */}
      </div>

      {/* Footer CTA
      <div className="mt-12 bg-blue-600 text-white rounded-lg p-6 max-w-xl text-center shadow-md">
        <h2 className="text-2xl font-semibold mb-2">Ready to take the challenge?</h2>
        <p className="mb-4">Start now and see where you stand on the leaderboard!</p>
        <Button asChild variant="secondary" size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
          <Link to="/signup">Get Started</Link>
        </Button>
      </div> */}
    </div>
  );
};

export default Index;
