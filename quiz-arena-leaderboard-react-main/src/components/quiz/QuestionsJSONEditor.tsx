
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuestionsJSONEditorProps {
  questionsJson: string;
  defaultTimeLimit: number;
  onQuestionsChange: (value: string) => void;
}

export const QuestionsJSONEditor = ({ 
  questionsJson, 
  defaultTimeLimit,
  onQuestionsChange 
}: QuestionsJSONEditorProps) => {
  const exampleJSON = `[ 
  { 
    "question": "What is the primary function of Machine Learning models?", 
    "options": [ 
      "To store data efficiently", 
      "To find patterns and make predictions", 
      "To create databases", 
      "To execute code" 
    ], 
    "correct": 1 
  }, 
  { 
    "question": "Which programming language is most commonly used for web development?", 
    "options": [ 
      "Python", 
      "JavaScript", 
      "C++", 
      "Java" 
    ], 
    "correct": 1 
  } 
]`;

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <span className="text-2xl">❓</span>
          Questions (JSON Format)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="questions" className="dark:text-white">Questions JSON *</Label>
          <Textarea
            id="questions"
            placeholder="Enter questions in JSON format"
            value={questionsJson}
            onChange={(e) => onQuestionsChange(e.target.value)}
            rows={12}
            className="font-mono text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h4 className="font-medium mb-2 dark:text-white">Example Format:</h4>
          <pre className="text-xs bg-white dark:bg-gray-800 p-3 rounded border overflow-x-auto dark:text-white">
            {exampleJSON}
          </pre>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
            <p>• The "correct" field should be the index (0-based) of the correct option.</p>
            <p>• The "time_limit" field sets the timer for each question in seconds (required for each question).</p>
            <p>• If "time_limit" is not specified for a question, it will use the default time limit of {defaultTimeLimit} seconds.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
