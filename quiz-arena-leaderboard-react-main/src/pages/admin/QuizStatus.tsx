import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";


interface UserStatus {
  id: number;
  full_name: string;
  email: string;
}

interface QuizStatusData {
  quiz_title: string;
  total_assigned: number;
  attempted: UserStatus[];
  pending: UserStatus[];
}


const QuizStatus = () => {
  const { quiz_id } = useParams();
  const [data, setData] = useState<QuizStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/quiz-status/${quiz_id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("quiz_token")}`,
          },
        });
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error fetching quiz status:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [quiz_id]);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex justify-center items-center text-xl text-purple-600 dark:text-purple-300">
        Loading Quiz Status...
      </div>
    );
  }

  const filteredAttempted = data.attempted.filter((user) =>
    user.full_name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPending = data.pending.filter((user) =>
    user.full_name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportToExcel = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/export-users?quiz_id=${quiz_id}`);
    const blob = await response.blob();

    let filename = "quiz_users_report.xlsx";
    const disposition = response.headers.get("Content-Disposition");

    if (disposition) {
      // Try filename*=UTF-8''first
      const utfMatch = disposition.match(/filename\*=UTF-8''(.+?)(;|$)/);
      if (utfMatch && utfMatch[1]) {
        filename = decodeURIComponent(utfMatch[1]);
      } else {
        // Then fallback to normal filename=
        const simpleMatch = disposition.match(/filename="?([^"]+)"?/);
        if (simpleMatch && simpleMatch[1]) {
          filename = simpleMatch[1];
        }
      }
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export failed:", error);
  }
};



  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-300">
          📊 Quiz Status Overview
        </h1>
        <Button asChild variant="outline" className="text-sm">
          <Link to="/admin">← Back to Dashboard</Link>
        </Button>
      </div>
      <div className="flex justify-end mb-4">
  <button
    onClick={handleExportToExcel}
    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition duration-200"
  >
    Export Quiz Status
  </button>
</div>


      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-white shadow-lg dark:bg-gray-800">
          <CardContent className="p-5 text-center">
            <p className="text-gray-500 dark:text-gray-400">Total Assigned</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-300">{data.total_assigned}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg dark:bg-gray-800">
          <CardContent className="p-5 text-center">
            <p className="text-gray-500 dark:text-gray-400">Attempted</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-300">{data.attempted.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg dark:bg-gray-800">
          
          <CardContent className="p-5 text-center">
            <p className="text-gray-500 dark:text-gray-400">Pending</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-300">{data.pending.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="🔍 Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md mx-auto"
        />
      </div>

      {/* Tables Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attempted Users Table */}
        <Card className="bg-white shadow-md dark:bg-gray-800">
          <CardHeader className="bg-green-100 dark:bg-green-800 rounded-t-md">
            <CardTitle className="text-green-800 dark:text-white text-lg">✅ Attempted Users</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-4">
            {filteredAttempted.length === 0 ? (
              <p className="text-gray-500 text-center">No one has attempted this quiz yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttempted.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell className="text-gray-600">{user.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pending Users Table */}
        {/* Pending Users Table with Follow-up Mail Button */}
<Card className="bg-white shadow-md dark:bg-gray-800">
  <CardHeader className="bg-red-100 dark:bg-red-800 rounded-t-md">
    <div className="flex justify-between items-center">
      <CardTitle className="text-red-800 dark:text-white text-lg">⏳ Pending Users</CardTitle>
      {data.pending.length > 0 && (
        <Button
          size="sm"
          variant="secondary"
          className="bg-yellow-500 text-white hover:bg-yellow-600"
          onClick={async () => {
            try {
              const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/send-followup-email/${quiz_id}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("quiz_token")}`,
                },
                body: JSON.stringify({
                  quiz_title: data.quiz_title,
                  emails: data.pending.map((user) => user.email),
                }),
              });

              if (!res.ok) {
                throw new Error("Failed to send follow-up emails.");
              }

              toast({
  title: "📬 Emails Sent",
  description: "Follow-up emails sent to all pending users.",
});

            } catch (error) {
              console.error("Follow-up error:", error);
              toast({
  title: "❌ Failed",
  description: "Could not send follow-up emails.",
  variant: "destructive",
});

            }
          }}
        >
          📧 Send Follow-up Mail
        </Button>
      )}
    </div>
  </CardHeader>
  <CardContent className="overflow-x-auto p-4">
    {filteredPending.length === 0 ? (
      <p className="text-gray-500 text-center">All users have submitted.</p>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPending.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.full_name}</TableCell>
              <TableCell className="text-gray-600">{user.email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </CardContent>
</Card>
      </div>
    </div>
  );
};

export default QuizStatus;
