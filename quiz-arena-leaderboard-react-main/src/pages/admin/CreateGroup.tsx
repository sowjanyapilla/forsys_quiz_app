import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const CreateGroup = () => {
  const [showForm, setShowForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [emailsText, setEmailsText] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateGroup = async () => {
    const emails = emailsText
      .split("\n")
      .map(e => e.trim())
      .filter(e => e.includes("@"));

    if (!groupName || emails.length === 0) {
      toast({ title: "Error", description: "Provide valid group name and emails", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("quiz_token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/create-group`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: groupName, emails })
      });

      if (!res.ok) throw new Error("Group creation failed");

      toast({ title: "Group created!", description: "Group has been added successfully." });
      navigate("/admin");
    } catch (error) {
      toast({ title: "Failed", description: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Button onClick={() => setShowForm(!showForm)} className="mb-4">
        {showForm ? "Hide Form" : "Create Group"}
      </Button>

      {showForm && (
        <div className="space-y-4 border p-4 rounded-md shadow bg-white">
          <Input
            placeholder="Enter group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <textarea
            className="w-full border p-2 rounded"
            placeholder="Enter emails (one per line)"
            rows={6}
            value={emailsText}
            onChange={(e) => setEmailsText(e.target.value)}
          />
          <Button onClick={handleCreateGroup} disabled={loading}>
            {loading ? "Creating..." : "Create Group"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CreateGroup;
