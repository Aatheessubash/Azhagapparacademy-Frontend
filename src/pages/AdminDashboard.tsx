/**
 * Admin Dashboard
 * Main dashboard for administrators
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI, courseAPI } from '../services/api';
import { resolveMediaUrl } from '@/lib/media';
import { formatINR } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Users, 
  BookOpen, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  Settings,
  CreditCard,
  BarChart3,
  ChevronRight
} from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalLevels: number;
  totalQuizzes: number;
  payments: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  totalRevenue: number;
}

interface RecentPayment {
  _id: string;
  userId: { name: string; email: string };
  courseId: { title: string };
  amount: number;
  status: string;
  createdAt: string;
}

interface RecentStudent {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface CourseQR {
  _id: string;
  title: string;
  qrCodeImage?: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [courses, setCourses] = useState<CourseQR[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [qrImageFile, setQrImageFile] = useState<File | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [qrUpdateError, setQrUpdateError] = useState('');
  const [qrUpdateSuccess, setQrUpdateSuccess] = useState('');
  const [isUpdatingQR, setIsUpdatingQR] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    setProfileName(user?.name || '');
    setProfileEmail(user?.email || '');
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [dashboardResponse, coursesResponse] = await Promise.all([
        adminAPI.getDashboard(),
        courseAPI.getAll({ status: '' })
      ]);

      setStats(dashboardResponse.data.statistics);
      setRecentPayments(dashboardResponse.data.recentPayments);
      setRecentStudents(dashboardResponse.data.recentStudents);

      const courseList = Array.isArray(coursesResponse.data)
        ? coursesResponse.data
        : coursesResponse.data.courses || [];
      setCourses(courseList);
      if (courseList.length > 0) {
        setSelectedCourseId((prev) => prev || courseList[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDashboardQRUpload = async () => {
    if (!selectedCourseId) {
      setQrUpdateError('Please select a course.');
      return;
    }
    if (!qrImageFile) {
      setQrUpdateError('Please choose a QR image file.');
      return;
    }
    if (!adminPassword.trim()) {
      setQrUpdateError('Admin password is required.');
      return;
    }

    setIsUpdatingQR(true);
    setQrUpdateError('');
    setQrUpdateSuccess('');
    try {
      const response = await courseAPI.uploadQRCode(selectedCourseId, qrImageFile, adminPassword);
      const updatedCourse = response.data as CourseQR;

      setCourses((prev) =>
        prev.map((course) => (course._id === updatedCourse._id ? { ...course, qrCodeImage: updatedCourse.qrCodeImage } : course))
      );
      setQrImageFile(null);
      setAdminPassword('');
      setQrUpdateSuccess('GPay QR image updated successfully.');
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
      ) {
        setQrUpdateError((error as { response?: { data?: { message?: string } } }).response!.data!.message!);
      } else {
        setQrUpdateError('Failed to update QR image.');
      }
    } finally {
      setIsUpdatingQR(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleProfileSave = async () => {
    setProfileError('');

    if (!profileName.trim() || !profileEmail.trim()) {
      setProfileError('Name and email are required');
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: profileName.trim(),
        email: profileEmail.trim()
      });
      setShowProfileDialog(false);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const selectedCourse = courses.find((course) => course._id === selectedCourseId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowProfileDialog(true)}>
                Edit Profile
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-600 mt-1">Manage your learning platform</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => navigate('/admin/courses')}>
            <BookOpen className="w-6 h-6" />
            <span className="text-sm">Manage Courses</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => navigate('/admin/payments')}>
            <CreditCard className="w-6 h-6" />
            <span className="text-sm">Payments</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => navigate('/admin/students')}>
            <Users className="w-6 h-6" />
            <span className="text-sm">Students</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => navigate('/admin/revenue')}>
            <BarChart3 className="w-6 h-6" />
            <span className="text-sm">Revenue</span>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
                  <p className="text-sm text-gray-500">Registered users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Total Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats?.totalCourses || 0}</p>
                  <p className="text-sm text-gray-500">{stats?.totalLevels || 0} levels total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats?.payments.pending || 0}</p>
                  <p className="text-sm text-gray-500">Awaiting verification</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{formatINR(stats?.totalRevenue)}</p>
                  <p className="text-sm text-gray-500">From approved payments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* GPay QR Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">GPay QR Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dashboard-course-select">Course</Label>
                <select
                  id="dashboard-course-select"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                >
                  {courses.length === 0 ? (
                    <option value="">No courses</option>
                  ) : (
                    courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.title}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dashboard-qr-file">GPay QR Image</Label>
                <Input
                  id="dashboard-qr-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setQrImageFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dashboard-qr-password">Admin Password</Label>
                <Input
                  id="dashboard-qr-password"
                  type="password"
                  placeholder="Enter password to confirm"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <Button onClick={handleDashboardQRUpload} disabled={isUpdatingQR || courses.length === 0}>
                {isUpdatingQR ? 'Updating...' : 'Update GPay QR'}
              </Button>
              {qrImageFile && <p className="text-sm text-gray-600">Selected: {qrImageFile.name}</p>}
            </div>

            {qrUpdateError && <p className="mt-3 text-sm text-red-600">{qrUpdateError}</p>}
            {qrUpdateSuccess && <p className="mt-3 text-sm text-green-600">{qrUpdateSuccess}</p>}

            {selectedCourse?.qrCodeImage && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Current QR Preview</p>
                <img
                  src={resolveMediaUrl(selectedCourse.qrCodeImage)}
                  alt={`${selectedCourse.title} QR`}
                  className="w-28 h-28 object-contain border rounded-md bg-white"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Payments</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/payments')}>
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPayments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent payments</p>
                ) : (
                  recentPayments.map((payment) => (
                    <div key={payment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{payment.userId.name}</p>
                        <p className="text-sm text-gray-500">{payment.courseId.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatINR(payment.amount)}</p>
                        <Badge 
                          variant={payment.status === 'approved' ? 'default' : payment.status === 'pending' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Students */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Students</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/students')}>
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentStudents.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent students</p>
                ) : (
                  recentStudents.map((student) => (
                    <div key={student._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                      <p className="text-sm text-gray-400">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg">
                <Clock className="w-10 h-10 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{stats?.payments.pending || 0}</p>
                  <p className="text-sm text-yellow-600">Pending</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-700">{stats?.payments.approved || 0}</p>
                  <p className="text-sm text-green-600">Approved</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg">
                <XCircle className="w-10 h-10 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-700">{stats?.payments.rejected || 0}</p>
                  <p className="text-sm text-red-600">Rejected</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile</DialogTitle>
            <DialogDescription>Update your admin account details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-profile-name">Name</Label>
              <Input
                id="admin-profile-name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-profile-email">Email</Label>
              <Input
                id="admin-profile-email"
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            {profileError && <p className="text-sm text-red-600">{profileError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowProfileDialog(false)} disabled={isSavingProfile}>
                Cancel
              </Button>
              <Button onClick={handleProfileSave} disabled={isSavingProfile}>
                {isSavingProfile ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
