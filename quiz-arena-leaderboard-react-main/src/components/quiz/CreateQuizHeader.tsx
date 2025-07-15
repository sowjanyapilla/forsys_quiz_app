
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const CreateQuizHeader = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create New Quiz
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Design and assign a new quiz to your team</p>
        </div>
        <Button asChild variant="outline" className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700">
          <Link to="/admin">Back to Admin</Link>
        </Button>
      </div>
    </header>
  );
};
