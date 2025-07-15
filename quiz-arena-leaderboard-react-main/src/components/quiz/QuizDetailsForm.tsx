
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuizDetailsFormProps {
  quiz: {
    title: string;
    description: string;
    default_time_limit: number;
  };
  onQuizChange: (field: string, value: string | number | boolean) => void;
}

export const QuizDetailsForm = ({ quiz, onQuizChange }: QuizDetailsFormProps) => {
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <span className="text-2xl">📝</span>
          Quiz Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="dark:text-white">Quiz Title *</Label>
            <Input
              id="title"
              placeholder="Enter quiz title"
              value={quiz.title}
              onChange={(e) => onQuizChange('title', e.target.value)}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default_time_limit" className="dark:text-white">Default Question Time Limit (seconds) *</Label>
            <Input
              id="default_time_limit"
              type="number"
              min="10"
              max="300"
              value={quiz.default_time_limit}
              onChange={(e) => onQuizChange('default_time_limit', parseInt(e.target.value) || 60)}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description" className="dark:text-white">Description *</Label>
          <Textarea
            id="description"
            placeholder="Enter quiz description"
            value={quiz.description}
            onChange={(e) => onQuizChange('description', e.target.value)}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 Each question will use individual time limits. You can set specific time limits for each question in the JSON below, or they will use the default time limit specified above.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
