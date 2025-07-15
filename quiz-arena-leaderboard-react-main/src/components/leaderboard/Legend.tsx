
import { Card, CardContent } from '@/components/ui/card';

export const Legend = () => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="dark:text-white">Correct Answers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="dark:text-white">Wrong Answers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="dark:text-white">Not Attempted</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
