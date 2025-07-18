import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface CreateGroupModalProps {
  onClose: () => void;
  onGroupCreated: () => Promise<void>;
}

export const CreateGroupModal = ({ onClose, onGroupCreated }: CreateGroupModalProps) => {
  const [groupName, setGroupName] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("quiz_token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data);
    };

    fetchUsers();
  }, []);

  const handleToggleSelect = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleSelectAll = () => {
    const filtered = getFilteredUsers();
    setSelectedEmails(filtered.map((u) => u.email));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedEmails.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please enter group name and select users.",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("quiz_token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/create-group`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: groupName, emails: selectedEmails }),
      });

      if (!res.ok) throw new Error("Group creation failed");

      toast({ title: "Success", description: "Group created successfully!" });
      onClose();
      await onGroupCreated();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Something went wrong while creating the group.",
        variant: "destructive",
      });
    }
  };

  const getFilteredUsers = () => {
    if (!searchTerm.trim()) return users;

    const fragments = searchTerm
      .toLowerCase()
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e !== "");

    return users.filter((u) =>
      fragments.some((fragment) => u.email.toLowerCase().includes(fragment))
    );
  };

  const filteredUsers = getFilteredUsers();

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Create Group</h2>

      <Input
        type="text"
        placeholder="Enter group name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        className="mb-4"
      />

      <Input
        type="text"
        placeholder="Search by email"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />

      <Button className="mb-2" onClick={handleSelectAll}>
        Select All {searchTerm ? "Filtered" : "Users"}
      </Button>

      <div className="max-h-48 overflow-y-auto border rounded p-2 mb-4 bg-gray-50">
        {filteredUsers.length === 0 ? (
          <p>No users found.</p>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.email} className="flex items-center mb-1">
              <input
                type="checkbox"
                checked={selectedEmails.includes(user.email)}
                onChange={() => handleToggleSelect(user.email)}
                className="mr-2"
              />
              <span>{user.email}</span>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleCreateGroup}>Create</Button>
      </div>
    </div>
  );
};
