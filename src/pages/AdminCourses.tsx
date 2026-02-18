/**
 * Admin Courses Management
 * Create, edit, and manage courses
 */

import React, { useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { courseAPI } from '../services/api';
import { formatINR } from '@/lib/currency';
import MediaImage from '@/components/MediaImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Search,
  BookOpen,
  IndianRupee,
  Layers,
  QrCode,
  MoreVertical,
  Loader2,
  CheckCircle2,
  Archive
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  isFree: boolean;
  status: 'draft' | 'published' | 'archived';
  quizEnabled: boolean;
  thumbnail?: string;
  qrCodeImage?: string;
  youtubeEmbedUrl?: string;
  paymentUpiId?: string;
  paymentReceiverName?: string;
  totalLevels: number;
}

type CourseForm = {
  title: string;
  description: string;
  price: number;
  isFree: boolean;
  quizEnabled: boolean;
  status: 'draft' | 'published' | 'archived';
  youtubeEmbedUrl: string;
  paymentUpiId: string;
  paymentReceiverName: string;
};

type ApiErrorResponse = {
  message?: string;
};

const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
  const typedError = error as AxiosError<ApiErrorResponse>;
  return typedError?.response?.data?.message || fallbackMessage;
};

type PendingQRChange = {
  courseId: string;
  file: File;
};

type PendingQRLinkChange = {
  courseId: string;
};

const AdminCourses: React.FC = () => {
  const navigate = useNavigate();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showQRPasswordDialog, setShowQRPasswordDialog] = useState(false);
  const [showQRLinkDialog, setShowQRLinkDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [pendingQRChange, setPendingQRChange] = useState<PendingQRChange | null>(null);
  const [pendingQRLinkChange, setPendingQRLinkChange] = useState<PendingQRLinkChange | null>(null);
  const [qrChangePassword, setQRChangePassword] = useState('');
  const [qrChangeError, setQRChangeError] = useState('');
  const [qrLinkValue, setQRLinkValue] = useState('');
  const [qrLinkPassword, setQRLinkPassword] = useState('');
  const [qrLinkError, setQRLinkError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState<CourseForm>({
    title: '',
    description: '',
    price: 0,
    isFree: false,
    quizEnabled: false,
    status: 'published',
    youtubeEmbedUrl: '',
    paymentUpiId: '',
    paymentReceiverName: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await courseAPI.getAll({ status: '' });
      // The API returns an array of courses directly, not wrapped in { courses: [...] }
      const raw = Array.isArray(response.data) ? response.data : response.data.courses || [];
      const normalized = raw.map((course: Course) => ({
        ...course,
        isFree: course.price === 0
      }));
      setCourses(normalized);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      setCourses([]); // Fallback to empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.description) return;
    if (!formData.isFree && formData.price <= 0) {
      alert('Price must be greater than 0 for paid courses, or mark as Free.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const payload = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: formData.isFree ? 0 : formData.price,
        paymentUpiId: formData.paymentUpiId.trim() || null,
        paymentReceiverName: formData.paymentReceiverName.trim() || null
      };
      await courseAPI.create(payload);
      setShowCreateDialog(false);
      resetForm();
      fetchCourses();
    } catch (error) {
      console.error('Failed to create course:', error);
      setFormError(getApiErrorMessage(error, 'Failed to create course.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCourse) return;
    if (!formData.isFree && formData.price <= 0) {
      alert('Price must be greater than 0 for paid courses, or mark as Free.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const payload = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: formData.isFree ? 0 : formData.price,
        paymentUpiId: formData.paymentUpiId.trim() || null,
        paymentReceiverName: formData.paymentReceiverName.trim() || null
      };
      await courseAPI.update(selectedCourse._id, payload);
      setShowEditDialog(false);
      setSelectedCourse(null);
      resetForm();
      fetchCourses();
    } catch (error) {
      console.error('Failed to update course:', error);
      setFormError(getApiErrorMessage(error, 'Failed to update course.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCourse) return;

    setIsSubmitting(true);
    try {
      await courseAPI.delete(selectedCourse._id);
      setShowDeleteDialog(false);
      setSelectedCourse(null);
      fetchCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQRUpload = async (courseId: string, file: File, adminPassword: string) => {
    try {
      await courseAPI.uploadQRCode(courseId, file, adminPassword);
      fetchCourses();
    } catch (error) {
      console.error('Failed to upload QR code:', error);
      throw error;
    }
  };

  const openQRPasswordDialog = (courseId: string, file: File) => {
    setPendingQRChange({ courseId, file });
    setQRChangePassword('');
    setQRChangeError('');
    setShowQRPasswordDialog(true);
  };

  const closeQRPasswordDialog = () => {
    setShowQRPasswordDialog(false);
    setPendingQRChange(null);
    setQRChangePassword('');
    setQRChangeError('');
  };

  const openQRLinkDialog = (courseId: string) => {
    setPendingQRLinkChange({ courseId });
    setQRLinkValue('');
    setQRLinkPassword('');
    setQRLinkError('');
    setShowQRLinkDialog(true);
  };

  const closeQRLinkDialog = () => {
    setShowQRLinkDialog(false);
    setPendingQRLinkChange(null);
    setQRLinkValue('');
    setQRLinkPassword('');
    setQRLinkError('');
  };

  const confirmQRChange = async () => {
    if (!pendingQRChange) return;
    if (!qrChangePassword.trim()) {
      setQRChangeError('Please enter your admin password.');
      return;
    }

    setIsSubmitting(true);
    setQRChangeError('');
    try {
      await handleQRUpload(
        pendingQRChange.courseId,
        pendingQRChange.file,
        qrChangePassword
      );
      closeQRPasswordDialog();
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
      ) {
        setQRChangeError((error as { response?: { data?: { message?: string } } }).response!.data!.message!);
      } else {
        setQRChangeError('Failed to update QR code.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmQRLinkChange = async () => {
    if (!pendingQRLinkChange) return;

    const link = qrLinkValue.trim();
    if (!link) {
      setQRLinkError('Please enter a Google Drive image link or Drive file ID.');
      return;
    }
    if (!qrLinkPassword.trim()) {
      setQRLinkError('Please enter your admin password.');
      return;
    }

    setIsSubmitting(true);
    setQRLinkError('');

    try {
      await courseAPI.setQRCodeLink(pendingQRLinkChange.courseId, link, qrLinkPassword);
      closeQRLinkDialog();
      fetchCourses();
    } catch (error) {
      setQRLinkError(getApiErrorMessage(error, 'Failed to set QR image link.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThumbnailUpload = async (courseId: string, file: File) => {
    try {
      await courseAPI.uploadThumbnail(courseId, file);
      fetchCourses();
    } catch (error) {
      console.error('Failed to upload thumbnail:', error);
    }
  };

  const updateStatus = async (courseId: string, status: Course['status']) => {
    setIsSubmitting(true);
    try {
      await courseAPI.update(courseId, { status });
      fetchCourses();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: 0,
      isFree: false,
      quizEnabled: false,
      status: 'published',
      youtubeEmbedUrl: '',
      paymentUpiId: '',
      paymentReceiverName: ''
    });
  };

  const openEditDialog = (course: Course) => {
    setSelectedCourse(course);
    setFormError('');
    setFormData({
      title: course.title,
      description: course.description,
      price: course.price,
      isFree: course.isFree,
      quizEnabled: course.quizEnabled,
      status: course.status,
      youtubeEmbedUrl: course.youtubeEmbedUrl || '',
      paymentUpiId: course.paymentUpiId || '',
      paymentReceiverName: course.paymentReceiverName || ''
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (course: Course) => {
    setSelectedCourse(course);
    setShowDeleteDialog(true);
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-700">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/admin')}>
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Manage Courses</h1>
            </div>
            <Button onClick={() => {
              resetForm();
              setFormError('');
              setShowCreateDialog(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No courses found</h3>
            <p className="text-gray-500 mt-1">Create your first course to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course._id} className="overflow-hidden">
                {/* Thumbnail */}
                <div className="h-40 bg-gradient-to-br from-blue-500 to-indigo-600 relative group">
                  <MediaImage
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-white/50" />
                    </div>
                    }
                  />
                  
                  {/* Upload overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-white text-gray-900 px-3 py-1 rounded-lg text-sm font-medium">
                      Change Thumbnail
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleThumbnailUpload(course._id, file);
                        }}
                      />
                    </label>
                  </div>

                  <div className="absolute top-3 right-3">
                    {getStatusBadge(course.status)}
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{course.title}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(course)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateStatus(course._id, course.status === 'published' ? 'draft' : 'published')}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {course.status === 'published' ? 'Move to Draft' : 'Publish'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/admin/courses/${course._id}/levels`)}>
                        <Layers className="w-4 h-4 mr-2" />
                        Manage Levels
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateStatus(course._id, 'archived')}>
                        <Archive className="w-4 h-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDeleteDialog(course)} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{course.description}</p>

                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-gray-500">
                        <Layers className="w-4 h-4" />
                        {course.totalLevels}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <IndianRupee className="w-4 h-4" />
                        {formatINR(course.price)}
                        {course.isFree && (
                          <Badge variant="secondary" className="ml-2">Free</Badge>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {course.quizEnabled && (
                        <Badge variant="secondary" className="text-xs">Quiz</Badge>
                      )}
                      {course.youtubeEmbedUrl && (
                        <Badge variant="outline" className="text-xs">YouTube</Badge>
                      )}
                      {course.paymentUpiId && (
                        <Badge variant="outline" className="text-xs">UPI Ready</Badge>
                      )}
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Payment QR</span>
                      {course.qrCodeImage ? (
                        <div className="flex items-center gap-2">
                          <MediaImage
                            src={course.qrCodeImage}
                            alt="QR"
                            className="w-8 h-8 object-contain bg-white rounded"
                            fallback={
                              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                <QrCode className="w-4 h-4 text-gray-400" />
                              </div>
                            }
                          />
                          <label className="cursor-pointer text-blue-600 text-sm hover:underline">
                            Change
                            <input
                              type="file"
                              accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) openQRPasswordDialog(course._id, file);
                                }}
                              />
                            </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-blue-600"
                            onClick={() => openQRLinkDialog(course._id)}
                          >
                            Link
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer">
                            <Button variant="outline" size="sm">
                              <QrCode className="w-4 h-4 mr-1" />
                              Upload
                            </Button>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) openQRPasswordDialog(course._id, file);
                              }}
                            />
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openQRLinkDialog(course._id)}
                          >
                            Link
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>
              Add a new course to your platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                placeholder="Enter course title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                placeholder="Enter course description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full min-h-[100px] px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtubeEmbedUrl">YouTube Link (Optional)</Label>
              <Input
                id="youtubeEmbedUrl"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.youtubeEmbedUrl}
                onChange={(e) => setFormData({ ...formData, youtubeEmbedUrl: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Supports YouTube watch, share, or embed links.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentUpiId">GPay/UPI ID (Optional)</Label>
              <Input
                id="paymentUpiId"
                placeholder="example@okaxis"
                value={formData.paymentUpiId}
                onChange={(e) => setFormData({ ...formData, paymentUpiId: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Used for one-tap GPay open on the payment page.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentReceiverName">Receiver Name (Optional)</Label>
              <Input
                id="paymentReceiverName"
                placeholder="Azhagappar Academy"
                value={formData.paymentReceiverName}
                onChange={(e) => setFormData({ ...formData, paymentReceiverName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (INR)</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  disabled={formData.isFree}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
                <div className="flex items-center gap-2">
                  <Switch
                    id="isFree"
                    checked={formData.isFree}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      isFree: checked,
                      price: checked ? 0 : formData.price
                    })}
                  />
                  <Label htmlFor="isFree">Free course</Label>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="quizEnabled">Enable Quizzes</Label>
              <Switch
                id="quizEnabled"
                checked={formData.quizEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, quizEnabled: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Course['status'] })}
              >
                <option value="draft">Draft (hidden from students)</option>
                <option value="published">Published (visible to students)</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Course Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full min-h-[100px] px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-youtubeEmbedUrl">YouTube Link (Optional)</Label>
              <Input
                id="edit-youtubeEmbedUrl"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.youtubeEmbedUrl}
                onChange={(e) => setFormData({ ...formData, youtubeEmbedUrl: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Supports YouTube watch, share, or embed links.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-paymentUpiId">GPay/UPI ID (Optional)</Label>
              <Input
                id="edit-paymentUpiId"
                placeholder="example@okaxis"
                value={formData.paymentUpiId}
                onChange={(e) => setFormData({ ...formData, paymentUpiId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-paymentReceiverName">Receiver Name (Optional)</Label>
              <Input
                id="edit-paymentReceiverName"
                placeholder="Azhagappar Academy"
                value={formData.paymentReceiverName}
                onChange={(e) => setFormData({ ...formData, paymentReceiverName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (INR)</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="edit-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  disabled={formData.isFree}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-isFree"
                    checked={formData.isFree}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      isFree: checked,
                      price: checked ? 0 : formData.price
                    })}
                  />
                  <Label htmlFor="edit-isFree">Free course</Label>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-quizEnabled">Enable Quizzes</Label>
              <Switch
                id="edit-quizEnabled"
                checked={formData.quizEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, quizEnabled: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Course['status'] })}
              >
                <option value="draft">Draft (hidden from students)</option>
                <option value="published">Published (visible to students)</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Password Dialog */}
      <Dialog open={showQRPasswordDialog} onOpenChange={(open) => !open && closeQRPasswordDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm QR Code Change</DialogTitle>
            <DialogDescription>
              Enter your admin password to update the GPay QR image.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="qrChangePassword">Admin Password</Label>
              <Input
                id="qrChangePassword"
                type="password"
                value={qrChangePassword}
                onChange={(e) => setQRChangePassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            {qrChangeError && (
              <p className="text-sm text-red-600">{qrChangeError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeQRPasswordDialog}>
              Cancel
            </Button>
            <Button onClick={confirmQRChange} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Link Dialog */}
      <Dialog open={showQRLinkDialog} onOpenChange={(open) => !open && closeQRLinkDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set QR Image Link</DialogTitle>
            <DialogDescription>
              Add a Google Drive image link (or Drive file ID) for payment QR.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="qrLinkValue">Google Drive Image Link</Label>
              <Input
                id="qrLinkValue"
                type="text"
                value={qrLinkValue}
                onChange={(e) => setQRLinkValue(e.target.value)}
                placeholder="https://drive.google.com/file/d/... or file ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qrLinkPassword">Admin Password</Label>
              <Input
                id="qrLinkPassword"
                type="password"
                value={qrLinkPassword}
                onChange={(e) => setQRLinkPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            {qrLinkError && (
              <p className="text-sm text-red-600">{qrLinkError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeQRLinkDialog}>
              Cancel
            </Button>
            <Button onClick={confirmQRLinkChange} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCourse?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCourses;
