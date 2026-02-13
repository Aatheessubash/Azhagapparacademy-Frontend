/**
 * Admin Users
 * Manage users, roles, status and progress
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, Search, Users, MoreVertical, CheckCircle2, PauseCircle, Shield, UserCog, Trash2 } from 'lucide-react';

type UserRole = 'student' | 'admin';
type UserStatus = 'active' | 'inactive' | 'suspended';

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

interface ProgressEntry {
  _id: string;
  courseId: { _id: string; title: string };
  totalProgress: number;
  courseCompleted: boolean;
  currentLevel: number;
  updatedAt: string;
}

const statusColors: Record<UserStatus, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-200 text-gray-700',
  suspended: 'bg-red-100 text-red-700'
};

const roleColors: Record<UserRole, string> = {
  student: 'bg-blue-100 text-blue-700',
  admin: 'bg-purple-100 text-purple-700'
};

const AdminStudents: React.FC = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [showProgressDialog, setShowProgressDialog] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getUsers({
        page,
        limit: 10,
        search: appliedSearch || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter
      });
      const data = response.data;
      setUsers(data.users || []);
      setPages(data.pages || 1);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
      setPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [page, appliedSearch, roleFilter]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const handleStatusChange = async (user: UserItem, status: UserStatus) => {
    if (user.role !== 'student' || status === user.status) return;
    try {
      await adminAPI.updateStudentStatus(user._id, status);
      await fetchUsers();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    }
  };

  const handleRoleChange = async (user: UserItem, role: UserRole) => {
    if (role === user.role) return;
    const confirmed = window.confirm(`Change role of ${user.name} to ${role}?`);
    if (!confirmed) return;

    try {
      await adminAPI.updateUserRole(user._id, role);
      await fetchUsers();
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (error as { response?: { data?: { message?: string } } }).response!.data!.message!
          : 'Failed to update role';
      alert(message);
    }
  };

  const handleDeleteUser = async (user: UserItem) => {
    const confirmed = window.confirm(`Delete user "${user.name}" (${user.email})? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await adminAPI.deleteUser(user._id);
      await fetchUsers();
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (error as { response?: { data?: { message?: string } } }).response!.data!.message!
          : 'Failed to delete user';
      alert(message);
    }
  };

  const openProgressDialog = async (user: UserItem) => {
    if (user.role !== 'student') return;

    try {
      setSelectedUser(user);
      const response = await adminAPI.getStudentProgress(user._id);
      setProgress(response.data.progress || []);
      setShowProgressDialog(true);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
      setProgress([]);
      setShowProgressDialog(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/admin')}>
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Users</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full md:w-96">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setPage(1);
                setRoleFilter(e.target.value as 'all' | UserRole);
              }}
              className="border rounded-md px-3 py-2 text-sm bg-white"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Users className="w-5 h-5" />
            <span>{users.length} users on page {page}</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={roleColors[user.role]}>
                            {user.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <UserCog className="w-3 h-3 mr-1" />}
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={statusColors[user.status]}>{user.status}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {user.role === 'student' && (
                                <DropdownMenuItem onClick={() => openProgressDialog(user)}>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  View Progress
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(user, user.role === 'student' ? 'admin' : 'student')}
                              >
                                <UserCog className="w-4 h-4 mr-2" />
                                {user.role === 'student' ? 'Make Admin' : 'Make Student'}
                              </DropdownMenuItem>
                              {user.role === 'student' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleStatusChange(user, 'active')}>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Mark Active
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(user, 'inactive')}>
                                    <PauseCircle className="w-4 h-4 mr-2" />
                                    Set Inactive
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(user, 'suspended')}
                                    className="text-red-600"
                                  >
                                    <PauseCircle className="w-4 h-4 mr-2" />
                                    Suspend
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem onClick={() => handleDeleteUser(user)} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end items-center gap-3 mt-4">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            Previous
          </Button>
          <span className="text-sm text-gray-600">Page {page} of {pages}</span>
          <Button variant="outline" disabled={page >= pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>
            Next
          </Button>
        </div>
      </main>

      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedUser?.name}'s progress</DialogTitle>
            <DialogDescription>Overview of enrolled courses</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {progress.length === 0 ? (
              <p className="text-sm text-gray-500">No progress data available.</p>
            ) : (
              progress.map((item) => (
                <div key={item._id} className="p-3 border rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.courseId.title}</p>
                    <p className="text-sm text-gray-500">
                      Updated {new Date(item.updatedAt || item._id).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{item.totalProgress}%</p>
                    <p className="text-xs text-gray-500">
                      {item.courseCompleted ? 'Completed' : `Level ${item.currentLevel}`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStudents;
