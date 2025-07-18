import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateQuizHeader } from "@/components/quiz/CreateQuizHeader";
import { CreateGroupModal } from "./CreateGroupModal";
import { EditGroupModal } from "./EditGroupModal";

const CreateQuiz = () => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(30);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [activeTill, setActiveTill] = useState<string>("");


  const token = localStorage.getItem("quiz_token");

  const fetchQuizzes = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/quiz-templates`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setQuizzes(data);
  };

  const fetchGroups = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/groups`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setGroups(data);
  };

  const handleCreateQuiz = async () => {
  if (!selectedQuizId || selectedGroups.length === 0) return;

  const quizTemplateRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/quiz-template/${selectedQuizId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const templateData = await quizTemplateRes.json();

  // ✅ Add `time_limit` to each question
  const questionsWithTimeLimit = templateData.questions.map((q: any) => ({
    ...q,
    time_limit: timePerQuestion,
  }));

  const createRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/create-quiz`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    title: templateData.title,
    description: "",
    time_limit: timePerQuestion,
    questions: questionsWithTimeLimit,
    source_quiz_id: templateData.id,           // ✅ Add this
    active_till: activeTill || null             // ✅ Add this
  }),
});


  const quizData = await createRes.json();

  if (!createRes.ok || !quizData.quiz_id) {
    alert("Quiz creation failed.");
    return;
  }

  const quizId = quizData.quiz_id;

  for (const groupId of selectedGroups) {
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/assign-quiz-to-group/${quizId}/${groupId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  alert("Quiz created and assigned to selected groups successfully.");
};


  useEffect(() => {
    fetchQuizzes();
    fetchGroups();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-10 px-4">
  <CreateQuizHeader />

  <div className="mx-auto w-full max-w-3xl bg-white dark:bg-gray-800 p-8 rounded-lg shadow border border-gray-200 dark:border-gray-700">
    <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6 text-center">
      Create a New Quiz from Template
    </h2>

    {/* Quiz Template Dropdown */}
    <div className="mb-6">
      <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
        Select Quiz Template
      </label>
      <select
        className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
        value={selectedQuizId || ""}
        onChange={(e) => setSelectedQuizId(Number(e.target.value))}
      >
        <option value="">-- Choose a quiz template --</option>
        {quizzes.map((quiz) => (
          <option key={quiz.id} value={quiz.id}>
            {quiz.title}
          </option>
        ))}
      </select>
    </div>

    {/* Time and Date Inputs */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div>
        <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
          Time Per Question (seconds)
        </label>
        <Input
          type="number"
          value={timePerQuestion}
          onChange={(e) => setTimePerQuestion(Number(e.target.value))}
        />
      </div>
      <div>
        <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
          Active Till
        </label>
        <Input
          type="date"
          value={activeTill}
          onChange={(e) => setActiveTill(e.target.value)}
        />
      </div>
    </div>

    {/* Group Assignment */}
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Assign to Groups</h3>
      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.id} className="flex justify-between items-center">
            <label className="flex items-center text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                className="mr-2"
                checked={selectedGroups.includes(group.id)}
                onChange={() =>
                  setSelectedGroups((prev) =>
                    prev.includes(group.id)
                      ? prev.filter((id) => id !== group.id)
                      : [...prev, group.id]
                  )
                }
              />
              {group.name}
            </label>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/groups/${group.id}/members`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const emails = await res.json();
                setEditingGroup({ ...group, memberEmails: emails });
              }}
            >
              Edit
            </Button>
          </div>
        ))}
      </div>
    </div>

    {/* Action Buttons */}
    <div className="flex justify-between mt-6">
      <Button variant="outline" onClick={() => setShowGroupModal(true)}>
        ➕ Create Group
      </Button>
      <Button onClick={handleCreateQuiz}>🚀 Create Quiz</Button>
    </div>
  </div>

  {/* Modals */}
  {showGroupModal && (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-xl">
        <CreateGroupModal onClose={() => setShowGroupModal(false)} onGroupCreated={fetchGroups} />
      </div>
    </div>
  )}

  {editingGroup && (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-xl">
        <EditGroupModal group={editingGroup} onClose={() => setEditingGroup(null)} onGroupUpdated={fetchGroups} />
      </div>
    </div>
  )}
</div>
  );
};

export default CreateQuiz;
