/**
 * Course Details Page
 * Shows course information and handles payment/unlocking
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI } from '../services/api';
import { formatINR } from '@/lib/currency';
import MediaImage from '@/components/MediaImage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Lock, 
  Unlock, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  PlayCircle,
  ChevronRight,
  BookOpen,
  IndianRupee,
  QrCode
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Level {
  _id: string;
  levelNumber: number;
  title: string;
  description?: string;
  quizEnabled: boolean;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  qrCodeImage?: string;
  thumbnail?: string;
  youtubeEmbedUrl?: string;
  totalLevels: number;
  quizEnabled: boolean;
  hasAccess: boolean;
  paymentStatus: string;
  levels: Level[];
  userProgress?: {
    currentLevel: number;
    totalProgress: number;
    completedLevels: Array<{ levelId: string; completed: boolean }>;
  } | null;
}

const CourseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showQRDialog, setShowQRDialog] = useState(false);

  const fetchCourseDetails = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const response = await courseAPI.getById(id!);
      setCourse(response.data.course);
    } catch (error) {
      console.error('Failed to fetch course:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourseDetails();
  }, [fetchCourseDetails]);

  const handleStartLearning = (levelId?: string) => {
    if (levelId) {
      navigate(`/learn/${id}/level/${levelId}`);
    } else {
      // Find first incomplete level or first level
      const firstLevel = course?.levels[0];
      if (firstLevel) {
        navigate(`/learn/${id}/level/${firstLevel._id}`);
      }
    }
  };

  const handlePaymentClick = () => {
    navigate(`/payment/${id}`);
  };

  const getLevelStatus = (level: Level) => {
    if (!course?.hasAccess) return 'locked';
    
    const progress = course.userProgress;
    if (!progress) return 'available';

    const levelProgress = progress.completedLevels?.find((l) => l.levelId === level._id);

    if (levelProgress?.completed) return 'completed';
    if (level.levelNumber === progress.currentLevel) return 'current';
    if (level.levelNumber < progress.currentLevel) return 'available';
    
    return 'locked';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'current':
        return <PlayCircle className="w-5 h-5 text-blue-500" />;
      case 'available':
        return <Unlock className="w-5 h-5 text-gray-400" />;
      default:
        return <Lock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case 'current':
        return <Badge className="bg-blue-100 text-blue-700">Current</Badge>;
      case 'available':
        return <Badge variant="secondary">Available</Badge>;
      default:
        return <Badge variant="outline">Locked</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Course not found</h2>
          <Button className="mt-4" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-semibold text-gray-900 truncate max-w-md">
              {course.title}
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Course Info */}
          <div className="lg:col-span-2">
            {/* Course Header */}
            <Card className="overflow-hidden mb-6">
              <div className="h-64 bg-gradient-to-br from-blue-500 to-indigo-600 relative">
                <MediaImage
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                  fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-24 h-24 text-white/50" />
                  </div>
                  }
                />
                
                {!course.hasAccess && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Lock className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-xl font-semibold">Course Locked</p>
                      <p className="text-white/80">Purchase to unlock</p>
                    </div>
                  </div>
                )}
              </div>

              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {course.totalLevels} levels
                      </span>
                      {course.quizEnabled && (
                        <Badge variant="secondary">Quizzes Included</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">{formatINR(course.price)}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="prose max-w-none">
                  <h3 className="text-lg font-semibold mb-2">About this course</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{course.description}</p>
                </div>

                {course.hasAccess && course.youtubeEmbedUrl && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Course Intro Video</h3>
                    <div className="aspect-video overflow-hidden rounded-lg border bg-black">
                      <iframe
                        src={course.youtubeEmbedUrl}
                        title={`${course.title} intro video`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6">
                  {course.hasAccess ? (
                    <Button 
                      size="lg" 
                      className="w-full"
                      onClick={() => handleStartLearning()}
                    >
                      <PlayCircle className="w-5 h-5 mr-2" />
                      {course.userProgress?.totalProgress && course.userProgress.totalProgress > 0 
                        ? 'Continue Learning' 
                        : 'Start Learning'}
                    </Button>
                  ) : course.paymentStatus === 'pending' ? (
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                      <p className="text-yellow-800 font-medium">Payment Pending Verification</p>
                      <p className="text-yellow-600 text-sm mt-1">
                        Your payment is being reviewed by our team.
                      </p>
                    </div>
                  ) : (
                    <Button 
                      size="lg" 
                      className="w-full"
                      onClick={handlePaymentClick}
                    >
                      <IndianRupee className="w-5 h-5 mr-2" />
                      {`Unlock Course - ${formatINR(course.price)}`}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Course Levels */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Content</h3>
              <div className="space-y-3">
                {course.levels.map((level) => {
                  const status = getLevelStatus(level);
                  const isClickable = status !== 'locked' && course.hasAccess;

                  return (
                    <Card 
                      key={level._id}
                      className={`${isClickable ? 'cursor-pointer hover:shadow-md' : 'opacity-75'} transition-shadow`}
                      onClick={() => isClickable && handleStartLearning(level._id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {getStatusIcon(status)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-gray-500">Level {level.levelNumber}</span>
                              {level.quizEnabled && (
                                <Badge variant="outline" className="text-xs">Quiz</Badge>
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900">{level.title}</h4>
                            {level.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-1">{level.description}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            {getStatusBadge(status)}
                            {isClickable && <ChevronRight className="w-5 h-5 text-gray-400" />}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Progress & Info */}
          <div className="space-y-6">
            {/* Progress Card */}
            {course.hasAccess && course.userProgress && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Your Progress</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Overall Progress</span>
                        <span className="font-medium">{course.userProgress.totalProgress}%</span>
                      </div>
                      <Progress value={course.userProgress.totalProgress} className="h-3" />
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Current Level</span>
                        <span className="font-medium">{course.userProgress.currentLevel}</span>
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Completed Levels</span>
                        <span className="font-medium">
                          {course.userProgress.completedLevels?.length || 0} / {course.totalLevels}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Status Card */}
            {!course.hasAccess && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Payment Status</h3>
                  
                  {course.paymentStatus === 'none' ? (
                    <div className="text-center py-4">
                      <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-4">This course is locked</p>
                      <Button className="w-full" onClick={handlePaymentClick}>
                        <QrCode className="w-4 h-4 mr-2" />
                        Pay with QR Code
                      </Button>
                    </div>
                  ) : course.paymentStatus === 'pending' ? (
                    <div className="text-center py-4">
                      <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                      <p className="text-yellow-700 font-medium mb-2">Pending Verification</p>
                      <p className="text-sm text-yellow-600">
                        Your payment is being reviewed by our team. You'll be notified once approved.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                      <p className="text-red-700 font-medium mb-2">Payment Rejected</p>
                      <p className="text-sm text-red-600 mb-4">
                        Your payment was rejected. Please try again.
                      </p>
                      <Button className="w-full" onClick={handlePaymentClick}>
                        Retry Payment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Course Info Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Course Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Levels</span>
                    <span className="font-medium">{course.totalLevels}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quizzes</span>
                    <span className="font-medium">{course.quizEnabled ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price</span>
                    <span className="font-medium">{formatINR(course.price)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR Code to Pay</DialogTitle>
            <DialogDescription>
              Scan this QR code with your payment app to complete the purchase.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <MediaImage
              src={course.qrCodeImage}
              alt="Payment QR Code"
              className="max-w-full h-auto"
              fallback={
              <div className="w-64 h-64 bg-gray-100 flex items-center justify-center rounded-lg">
                <p className="text-gray-500">QR Code not available</p>
              </div>
              }
            />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{formatINR(course.price)}</p>
            <p className="text-sm text-gray-500 mt-1">Amount to pay</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseDetails;
