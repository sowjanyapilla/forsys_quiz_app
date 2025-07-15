import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface User {
  id: string;
  full_name: string;
  email: string;
}

interface UserAssignmentProps {
  selectedUsers: string[];
  onUserSelectionChange: (userIds: string[]) => void;
}

export const UserAssignment = ({ selectedUsers, onUserSelectionChange }: UserAssignmentProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("quiz_token");
        const res = await fetch('http://127.0.0.1:8000/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setAvailableUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = Array.isArray(availableUsers)
  ? availableUsers.filter(user =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  : [];


  const toggleUserSelection = (userId: string) => {
    const newSelection = selectedUsers.includes(userId)
      ? selectedUsers.filter(id => id !== userId)
      : [...selectedUsers, userId];
    onUserSelectionChange(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      onUserSelectionChange(filteredUsers.map(user => user.id));
    } else {
      onUserSelectionChange([]);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assign to Users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400">Loading users...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <span className="text-2xl">👥</span>
          Assign to Users
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectAll}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all" className="dark:text-white">Select All Users</Label>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedUsers.includes(user.id)
                  ? 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-300 dark:border-blue-600'
                  : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600'
              }`}
              onClick={() => toggleUserSelection(user.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium dark:text-white">{user.full_name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
                {selectedUsers.includes(user.id) && (
                  <Badge>Selected</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Selected {selectedUsers.length} of {availableUsers.length} users
        </p>
      </CardContent>
    </Card>
  );
};
