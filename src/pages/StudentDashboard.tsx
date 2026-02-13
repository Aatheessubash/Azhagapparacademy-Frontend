/**
 * Student Dashboard
 * Main dashboard for students to view courses and progress
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { courseAPI, progressAPI } from '../services/api';
import { resolveMediaUrl } from '@/lib/media';
import { formatINR } from '@/lib/currency';
import academyLogo from '../logo.jpg';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  BookOpen, 
  Lock, 
  Unlock, 
  Clock, 
  ChevronRight, 
  LogOut,
  PlayCircle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  thumbnail?: string;
  totalLevels: number;
  hasAccess: boolean;
  paymentStatus: string;
  progress: number;
}

interface MyProgress {
  courseId: {
    _id: string;
    title: string;
    thumbnail?: string;
  };
  totalProgress: number;
  currentLevel: number;
  courseCompleted: boolean;
}

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [myProgress, setMyProgress] = useState<MyProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setProfileName(user?.name || '');
    setProfileEmail(user?.email || '');
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [coursesRes, progressRes] = await Promise.all([
        courseAPI.getAll(),
        progressAPI.getMyProgress()
      ]);
      
      const courseList = Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data.courses || [];
      setCourses(courseList);
      setMyProgress(progressRes.data.progress);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
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

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'free':
        return <Badge className="bg-blue-100 text-blue-700">Free</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700"><AlertCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Lock className="w-3 h-3 mr-1" /> Locked</Badge>;
    }
  };

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
            <button
              type="button"
              onClick={() => navigate('/welcome')}
              className="flex items-center gap-3 rounded-md px-1 py-1 hover:bg-gray-100 transition-colors"
              aria-label="Go to Welcome Page"
            >
              <img
                src={academyLogo}
                alt="Azhagappar Academy logo"
                className="w-10 h-10 rounded-xl object-cover border border-blue-200/80 bg-white p-0.5"
              />
              <h1 className="text-xl font-bold text-gray-900">Azhagappar Academy</h1>
            </button>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}!</h2>
          <p className="text-gray-600 mt-1">Continue your learning journey</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">My Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{myProgress.length}</p>
                  <p className="text-sm text-gray-500">Enrolled courses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <PlayCircle className="w-8 h-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">
                    {myProgress.filter(p => p.totalProgress > 0 && !p.courseCompleted).length}
                  </p>
                  <p className="text-sm text-gray-500">Active courses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">
                    {myProgress.filter(p => p.courseCompleted).length}
                  </p>
                  <p className="text-sm text-gray-500">Finished courses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Continue Learning Section */}
        {myProgress.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Continue Learning</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myProgress.slice(0, 2).map((progress) => (
                <Card key={progress.courseId._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{progress.courseId.title}</h4>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-500">{progress.totalProgress}% complete</span>
                            <span className="text-gray-500">Level {progress.currentLevel}</span>
                          </div>
                          <Progress value={progress.totalProgress} className="h-2" />
                        </div>
                        <Button 
                          className="mt-3 w-full" 
                          size="sm"
                          onClick={() => navigate(`/course/${progress.courseId._id}`)}
                        >
                          Continue <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Courses Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Courses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Course Thumbnail */}
                <div className="h-40 bg-gradient-to-br from-blue-500 to-indigo-600 relative">
                  {course.thumbnail ? (
                    <img 
                      src={resolveMediaUrl(course.thumbnail)} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    {getPaymentStatusBadge(course.paymentStatus)}
                  </div>

                  {/* Lock overlay for locked courses */}
                  {!course.hasAccess && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Lock className="w-12 h-12 text-white/80" />
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h4>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">{course.totalLevels}</span> levels
                    </div>
                    <div className="font-semibold text-blue-600">
                      {formatINR(course.price)}
                    </div>
                  </div>

                  {/* Progress bar for enrolled courses */}
                  {course.hasAccess && course.progress > 0 && (
                    <div className="mt-3">
                      <Progress value={course.progress} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">{course.progress}% complete</p>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button 
                    className="w-full mt-4"
                    variant={course.hasAccess ? 'default' : 'outline'}
                    onClick={() => navigate(`/course/${course._id}`)}
                  >
                    {course.hasAccess ? (
                      <>
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Start Learning
                      </>
                    ) : course.paymentStatus === 'pending' ? (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Pending Approval
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4 mr-2" />
                        Unlock Course
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile</DialogTitle>
            <DialogDescription>Update your name and email</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-profile-name">Name</Label>
              <Input
                id="student-profile-name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-profile-email">Email</Label>
              <Input
                id="student-profile-email"
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="you@example.com"
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

export default StudentDashboard;
