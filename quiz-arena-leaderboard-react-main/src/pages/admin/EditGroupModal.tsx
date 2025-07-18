import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface EditGroupModalProps {
  group: { id: number; name: string; memberEmails: string[] };
  onClose: () => void;
  onGroupUpdated: () => void;
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({
  group,
  onClose,
  onGroupUpdated,
}) => {
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [selectedUserEmails, setSelectedUserEmails] = useState<string[]>([]);
  const [searchEmails, setSearchEmails] = useState("");

  const fetchUsers = async () => {
    const token = localStorage.getItem("quiz_token");
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users = await res.json();
    setAllUsers(users);
    setFilteredUsers(users);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ This effect ensures pre-selection when the modal opens
  useEffect(() => {
    if (group?.memberEmails?.length) {
      setSelectedUserEmails(group.memberEmails);
    } else {
      setSelectedUserEmails([]);
    }
  }, [group]);

  useEffect(() => {
    if (searchEmails.trim() === "") {
      setFilteredUsers(allUsers);
    } else {
      const searchList = searchEmails
        .split(",")
        .map((email) => email.trim().toLowerCase());

      const filtered = allUsers.filter((user) =>
        searchList.some((searchEmail) =>
          user.email.toLowerCase().includes(searchEmail)
        )
      );
      setFilteredUsers(filtered);
    }
  }, [searchEmails, allUsers]);

  const handleCheckboxChange = (email: string) => {
    setSelectedUserEmails((prev) =>
      prev.includes(email)
        ? prev.filter((e) => e !== email)
        : [...prev, email]
    );
  };

  const handleSelectAll = () => {
    const emailsToAdd = filteredUsers
      .map((u) => u.email)
      .filter((email) => !selectedUserEmails.includes(email));
    setSelectedUserEmails([...selectedUserEmails, ...emailsToAdd]);
  };

  const handleDeselectAll = () => {
    const emailsToRemove = filteredUsers.map((u) => u.email);
    setSelectedUserEmails((prev) =>
      prev.filter((email) => !emailsToRemove.includes(email))
    );
  };

  const handleUpdateGroup = async () => {
    const token = localStorage.getItem("quiz_token");
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/admin/groups/${group.id}/members`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedUserEmails),
      }
    );
    if (res.ok) {
      onGroupUpdated();
      onClose();
    } else {
      alert("Failed to update group");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Edit Group: {group.name}</h2>

      <input
        type="text"
        className="w-full border p-2 rounded mb-4"
        placeholder="Enter emails (comma-separated)"
        value={searchEmails}
        onChange={(e) => setSearchEmails(e.target.value)}
      />

      <div className="flex justify-between mb-2">
        <Button variant="outline" onClick={handleSelectAll}>
          Select All
        </Button>
        <Button variant="outline" onClick={handleDeselectAll}>
          Deselect All
        </Button>
      </div>

      <div className="max-h-64 overflow-y-auto border p-2 rounded mb-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedUserEmails.includes(user.email)}
              onChange={() => handleCheckboxChange(user.email)}
            />
            <label>
              {user.full_name} ({user.email})
            </label>
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-2">
        <Button onClick={handleUpdateGroup}>Update Group</Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
