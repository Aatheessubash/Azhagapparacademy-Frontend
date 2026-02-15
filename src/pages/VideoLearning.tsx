/**
 * Video Learning Page
 * Secure video player with anti-piracy measures
 */

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { levelAPI, progressAPI, quizAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  SkipBack,
  SkipForward,
  Volume2, 
  VolumeX,
  Maximize,
  Minimize,
  CheckCircle,
  Lock,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  MessageCircle
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
  locked?: boolean;
  hasVideo?: boolean;
}

interface CourseLevel extends Level {
  videoPath?: string | null;
}

const VideoLearning: React.FC = () => {
  const { courseId, levelId } = useParams<{ courseId: string; levelId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [level, setLevel] = useState<CourseLevel | null>(null);
  const [allLevels, setAllLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [hasQuiz, setHasQuiz] = useState(false);
  const [videoLoadFailed, setVideoLoadFailed] = useState(false);
  const [tabSwitchWarning, setTabSwitchWarning] = useState(false);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [watermarkPosition, setWatermarkPosition] = useState({ x: 20, y: 20 });

  // Security: Detect tab/window blur
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && videoRef.current && isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        setTabSwitchWarning(true);
      }
    };

    const handleBlur = () => {
      if (videoRef.current && isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        setTabSwitchWarning(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isPlaying]);

  // Security: Moving watermark
  useEffect(() => {
    const interval = setInterval(() => {
      setWatermarkPosition({
        x: Math.random() * 60 + 10, // 10% to 70%
        y: Math.random() * 60 + 10  // 10% to 70%
      });
    }, 10000); // Move every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Security: basic print-screen / devtools detection to warn users
  useEffect(() => {
    const handlePrintScreen = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        setSecurityWarning('Screen capture detected. Content use is monitored.');
        setTimeout(() => setSecurityWarning(null), 5000);
      }
    };

    const devtoolsInterval = setInterval(() => {
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
        setSecurityWarning('Developer tools detected. Playback paused for security.');
      }
    }, 2000);

    window.addEventListener('keyup', handlePrintScreen);
    return () => {
      window.removeEventListener('keyup', handlePrintScreen);
      clearInterval(devtoolsInterval);
    };
  }, []);

  // Fetch level data
  useEffect(() => {
    const fetchLevelData = async () => {
      if (!courseId || !levelId) return;

      try {
        setIsLoading(true);
        setVideoLoadFailed(false);
        const [levelRes, levelsRes] = await Promise.all([
          levelAPI.getById(levelId),
          levelAPI.getByCourse(courseId)
        ]);

        setLevel(levelRes.data.level);
        setAllLevels(levelsRes.data.levels);

        // Check if quiz exists for this level
        if (levelRes.data.level.quizEnabled) {
          try {
            await quizAPI.getByLevel(levelId);
            setHasQuiz(true);
          } catch {
            setHasQuiz(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch level:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLevelData();
  }, [courseId, levelId]);

  useEffect(() => {
    // Reset transient video failure state when changing levels.
    setVideoLoadFailed(false);
  }, [levelId]);

  // Update progress periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && level) {
        const video = videoRef.current;
        if (!Number.isFinite(video.duration) || video.duration <= 0) return;
        const watchedPercent = (video.currentTime / video.duration) * 100;
        
        if (watchedPercent > 10) {
          progressAPI.completeLevel({
            courseId: courseId!,
            levelId: levelId!,
            videoWatchedPercent: Math.round(watchedPercent)
          }).catch(console.error);
        }
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [courseId, levelId, level]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await video.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
      setSecurityWarning('Playback was blocked by the browser. Click play to start.');
      setTimeout(() => setSecurityWarning(null), 4000);
    }
  };

  const seekBy = (deltaSeconds: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;

    const nextTime = Math.min(video.duration, Math.max(0, video.currentTime + deltaSeconds));
    video.currentTime = nextTime;
    setProgress((nextTime / video.duration) * 100);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      setProgress((video.currentTime / video.duration) * 100);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    
    // Mark level as completed
    progressAPI.completeLevel({
      courseId: courseId!,
      levelId: levelId!,
      videoWatchedPercent: 100
    }).then(() => {
      // Refresh lock states after completion so the next level can unlock in UI.
      levelAPI.getByCourse(courseId!).then((levelsRes) => {
        setAllLevels(levelsRes.data.levels);
      }).catch(() => {});

      // Show quiz dialog if quiz is enabled
      if (hasQuiz) {
        setShowQuizDialog(true);
      }
    }).catch(console.error);
  };

  const navigateToLevel = (direction: 'prev' | 'next') => {
    const currentIndex = allLevels.findIndex(l => l._id === levelId);
    const targetIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex >= 0 && targetIndex < allLevels.length) {
      const target = allLevels[targetIndex];
      if (target?.locked) {
        setSecurityWarning('This level is locked. Complete the previous level to unlock it.');
        setTimeout(() => setSecurityWarning(null), 4000);
        return;
      }
      navigate(`/learn/${courseId}/level/${allLevels[targetIndex]._id}`);
    }
  };

  const currentLevelIndex = allLevels.findIndex(l => l._id === levelId);
  const hasPrevLevel = currentLevelIndex > 0;
  const hasNextLevel = currentLevelIndex > -1 && currentLevelIndex < allLevels.length - 1 && !allLevels[currentLevelIndex + 1]?.locked;

  const hasVideoSource = Boolean(level?.hasVideo ?? (level?.videoPath && level.videoPath !== 'pending'));
  const showVideo = hasVideoSource && !videoLoadFailed;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/course/${courseId}`)}>
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Course
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-300">
                Level {level?.levelNumber}: {level?.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasPrevLevel && (
                <Button variant="ghost" size="sm" onClick={() => navigateToLevel('prev')}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              )}
              {hasNextLevel && (
                <Button variant="ghost" size="sm" onClick={() => navigateToLevel('next')}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tab Switch Warning */}
      {tabSwitchWarning && (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          Video paused due to tab switch. Click play to resume.
          <button 
            onClick={() => setTabSwitchWarning(false)}
            className="ml-4 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {securityWarning && (
        <div className="bg-red-500 text-white px-4 py-2 text-center">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          {securityWarning}
          <button 
            onClick={() => setSecurityWarning(null)}
            className="ml-4 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div 
              ref={containerRef}
              className="relative bg-black rounded-lg overflow-hidden aspect-video group"
            >
              {showVideo ? (
                <>
                  {/* Video Element */}
                  <video
                    ref={videoRef}
                    src={level ? levelAPI.getStreamUrl(level._id) : ''}
                    className="w-full h-full"
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleVideoEnded}
                    onClick={togglePlay}
                    onError={() => {
                      setVideoLoadFailed(true);
                      setIsPlaying(false);
                    }}
                    controls={false}
                    disablePictureInPicture
                    controlsList="nodownload noplaybackrate"
                  />

                  {/* Watermark */}
                  <div 
                    className="absolute pointer-events-none select-none z-10 transition-all duration-1000"
                    style={{ 
                      left: `${watermarkPosition.x}%`, 
                      top: `${watermarkPosition.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className="bg-black/50 text-white/70 px-3 py-1 rounded text-sm font-mono">
                      {user?.email} | {new Date().toLocaleString()}
                    </div>
                  </div>

                  {/* Custom Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <Progress value={progress} className="h-1" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button onClick={togglePlay} className="text-white hover:text-blue-400">
                          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => seekBy(-10)}
                          className="text-white hover:text-blue-400"
                          aria-label="Back 10 seconds"
                        >
                          <SkipBack className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => seekBy(10)}
                          className="text-white hover:text-blue-400"
                          aria-label="Forward 10 seconds"
                        >
                          <SkipForward className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2">
                          <button onClick={toggleMute} className="text-white hover:text-blue-400">
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-20"
                          />
                        </div>
                      </div>

                      <button onClick={toggleFullscreen} className="text-white hover:text-blue-400">
                        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Play Overlay */}
                  {!isPlaying && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                      onClick={togglePlay}
                    >
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Play className="w-10 h-10 text-white ml-1" />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <div className="text-center px-6">
                    <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
                    <p className="text-white font-semibold">
                      {hasVideoSource ? 'Video failed to load' : 'Video not uploaded yet'}
                    </p>
                    <p className="text-gray-400 text-sm mt-1 max-w-md">
                      {hasVideoSource
                        ? 'This video could be missing on the server or you may not have access. Try again later or contact admin.'
                        : 'This level does not have a video uploaded yet. Please contact admin.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Level Info */}
            <Card className="mt-4 bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{level?.title}</h2>
                    {level?.description && (
                      <p className="text-gray-400 mt-2">{level.description}</p>
                    )}
                  </div>
                  {hasQuiz && (
                    <Badge className="bg-purple-100 text-purple-700">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Quiz Available
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Levels Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-4">Course Levels</h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {allLevels.map((l) => {
                    const isCurrent = l._id === levelId;
                    const isLocked = Boolean(l.locked);

                    return (
                      <div
                        key={l._id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          isCurrent 
                            ? 'bg-blue-600 text-white' 
                            : isLocked 
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        onClick={() => !isLocked && navigate(`/learn/${courseId}/level/${l._id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                            {isLocked ? (
                              <Lock className="w-4 h-4" />
                            ) : isCurrent ? (
                              <Play className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{l.title}</p>
                            <p className="text-xs opacity-70">Level {l.levelNumber}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Quiz Dialog */}
      <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Level Completed!</DialogTitle>
            <DialogDescription>
              You've finished watching this level. Would you like to take the quiz to unlock the next level?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button 
              className="flex-1" 
              onClick={() => navigate(`/quiz/${levelId}`)}
            >
              Take Quiz
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowQuizDialog(false)}
            >
              Review Video
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoLearning;
