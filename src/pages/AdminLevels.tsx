/**
 * Admin Levels Management
 * Manage course levels and upload videos
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI, levelAPI } from '../services/api';
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
  Video,
  Upload,
  Layers,
  Film,
  CheckCircle,
  Loader2,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Level {
  _id: string;
  levelNumber: number;
  title: string;
  description?: string;
  videoPath?: string;
  quizEnabled: boolean;
  status: string;
}

interface Course {
  _id: string;
  title: string;
}

const AdminLevels: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoAction, setVideoAction] = useState<'upload' | 'link' | null>(null);
  const [videoLink, setVideoLink] = useState('');
  const [videoLinkError, setVideoLinkError] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    levelNumber: 1,
    quizEnabled: false
  });

  const fetchData = useCallback(async () => {
    if (!courseId) return;

    try {
      setIsLoading(true);
      const [courseRes, levelsRes] = await Promise.all([
        courseAPI.getById(courseId),
        levelAPI.getByCourse(courseId)
      ]);
      setCourse(courseRes.data.course);
      setLevels(levelsRes.data.levels);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      void fetchData();
    }
  }, [courseId, fetchData]);

  const handleCreate = async () => {
    if (!formData.title) return;

    setIsSubmitting(true);
    try {
      await levelAPI.create({
        courseId: courseId!,
        title: formData.title,
        description: formData.description,
        levelNumber: formData.levelNumber,
        quizEnabled: formData.quizEnabled
      });
      setShowCreateDialog(false);
      resetForm();
      void fetchData();
    } catch (error) {
      console.error('Failed to create level:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedLevel) return;

    setIsSubmitting(true);
    try {
      await levelAPI.update(selectedLevel._id, formData);
      setShowEditDialog(false);
      setSelectedLevel(null);
      resetForm();
      void fetchData();
    } catch (error) {
      console.error('Failed to update level:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLevel) return;

    setIsSubmitting(true);
    try {
      await levelAPI.delete(selectedLevel._id);
      setShowDeleteDialog(false);
      setSelectedLevel(null);
      void fetchData();
    } catch (error) {
      console.error('Failed to delete level:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    if (!selectedLevel) return;

    setVideoAction('upload');
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      await levelAPI.uploadVideo(selectedLevel._id, file);
      setShowVideoDialog(false);
      setSelectedLevel(null);
      void fetchData();
    } catch (error) {
      console.error('Failed to upload video:', error);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
      setVideoAction(null);
    }
  };

  const handleVideoLinkSave = async () => {
    if (!selectedLevel) return;

    const url = videoLink.trim();
    if (!url) {
      setVideoLinkError('Please enter a Google Drive video link.');
      return;
    }

    setVideoAction('link');
    setIsSubmitting(true);
    setVideoLinkError('');

    try {
      await levelAPI.setVideoLink(selectedLevel._id, url);
      setShowVideoDialog(false);
      setSelectedLevel(null);
      setVideoLink('');
      void fetchData();
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (error as { response?: { data?: { message?: string } } }).response!.data!.message!
          : 'Failed to save video link.';
      setVideoLinkError(message);
    } finally {
      setIsSubmitting(false);
      setVideoAction(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      levelNumber: levels.length + 1,
      quizEnabled: false
    });
  };

  const openEditDialog = (level: Level) => {
    setSelectedLevel(level);
    setFormData({
      title: level.title,
      description: level.description || '',
      levelNumber: level.levelNumber,
      quizEnabled: level.quizEnabled
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (level: Level) => {
    setSelectedLevel(level);
    setShowDeleteDialog(true);
  };

  const openVideoDialog = (level: Level) => {
    setSelectedLevel(level);
    setVideoLink('');
    setVideoLinkError('');
    setVideoAction(null);
    setShowVideoDialog(true);
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
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/admin/courses')}>
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Manage Levels</h1>
                <p className="text-sm text-gray-500">{course?.title}</p>
              </div>
            </div>
            <Button onClick={() => {
              resetForm();
              setShowCreateDialog(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Level
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {levels.length === 0 ? (
          <div className="text-center py-12">
            <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No levels yet</h3>
            <p className="text-gray-500 mt-1">Add your first level to this course</p>
          </div>
        ) : (
          <div className="space-y-4">
            {levels.map((level) => (
              <Card key={level._id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Level Number */}
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-blue-600">{level.levelNumber}</span>
                    </div>

                    {/* Level Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{level.title}</h3>
                        {level.quizEnabled && (
                          <Badge variant="secondary" className="text-xs">Quiz</Badge>
                        )}
                      </div>
                      {level.description && (
                        <p className="text-sm text-gray-500">{level.description}</p>
                      )}
                    </div>

                    {/* Video Status */}
                    <div className="flex items-center gap-4">
                      {level.videoPath && level.videoPath !== 'pending' ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm">Video uploaded</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Film className="w-5 h-5" />
                          <span className="text-sm">No video</span>
                        </div>
                      )}

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(level)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openVideoDialog(level)}>
                            <Video className="w-4 h-4 mr-2" />
                            {level.videoPath && level.videoPath !== 'pending' ? 'Replace Video' : 'Upload Video'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/levels/${level._id}/quiz`)}>
                            <Layers className="w-4 h-4 mr-2" />
                            Manage Quiz
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(level)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Level</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="levelNumber">Level Number</Label>
              <Input
                id="levelNumber"
                type="number"
                min="1"
                value={formData.levelNumber}
                onChange={(e) => setFormData({ ...formData, levelNumber: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Level Title</Label>
              <Input
                id="title"
                placeholder="Enter level title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                placeholder="Enter level description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="quizEnabled">Enable Quiz</Label>
              <Switch
                id="quizEnabled"
                checked={formData.quizEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, quizEnabled: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Level
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Level</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Level Title</Label>
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
                className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-quizEnabled">Enable Quiz</Label>
              <Switch
                id="edit-quizEnabled"
                checked={formData.quizEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, quizEnabled: checked })}
              />
            </div>
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

      {/* Video Upload Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Video</DialogTitle>
            <DialogDescription>
              Upload a video for "{selectedLevel?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Click to upload video file</p>
              <p className="text-sm text-gray-400 mb-4">MP4, WebM, or MOV up to 500MB</p>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleVideoUpload(file);
                }}
                className="hidden"
                id="video-upload"
              />
              <label htmlFor="video-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Select Video
                  </span>
                </Button>
              </label>
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-500 uppercase">or</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-link">Google Drive link</Label>
              <Input
                id="video-link"
                placeholder="https://drive.google.com/file/d/..."
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Use a public Google Drive link (Anyone with the link can view).
              </p>
              {videoLinkError && <p className="text-sm text-red-600">{videoLinkError}</p>}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isSubmitting || !videoLink.trim()}
                onClick={handleVideoLinkSave}
              >
                {isSubmitting && videoAction === 'link' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Video Link
              </Button>
            </div>

            {isSubmitting && videoAction === 'upload' && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Level</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedLevel?.title}"? This action cannot be undone.
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

export default AdminLevels;
