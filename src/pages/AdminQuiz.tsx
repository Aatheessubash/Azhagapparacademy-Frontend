/**
 * Admin Quiz Management
 * Create and manage quizzes for course levels
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizAPI, levelAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
  Trash2, 
  HelpCircle,
  X,
  Loader2,
  Save
} from 'lucide-react';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  questions: Question[];
  passingScore: number;
  timeLimit: number;
  maxAttempts: number;
}

interface LevelSummary {
  _id: string;
  title: string;
  courseId: string;
}

const AdminQuiz: React.FC = () => {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  
  const [level, setLevel] = useState<LevelSummary | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    passingScore: 70,
    timeLimit: 0,
    maxAttempts: 3,
    questions: [] as Question[]
  });

  const fetchData = useCallback(async () => {
    if (!levelId) return;

    try {
      setIsLoading(true);
      const levelRes = await levelAPI.getById(levelId);
      setLevel(levelRes.data.level);

      // Try to fetch existing quiz
      try {
        const quizRes = await quizAPI.getByLevel(levelId);
        setQuiz(quizRes.data.quiz);
        setFormData({
          title: quizRes.data.quiz.title,
          description: quizRes.data.quiz.description || '',
          passingScore: quizRes.data.quiz.passingScore,
          timeLimit: quizRes.data.quiz.timeLimit,
          maxAttempts: quizRes.data.quiz.maxAttempts,
          questions: quizRes.data.quiz.questions
        });
      } catch {
        // No quiz exists yet
        setQuiz(null);
        setFormData({
          title: `${levelRes.data.level.title} - Quiz`,
          description: '',
          passingScore: 70,
          timeLimit: 0,
          maxAttempts: 3,
          questions: []
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [levelId]);

  useEffect(() => {
    if (levelId) {
      void fetchData();
    }
  }, [levelId, fetchData]);

  const handleSave = async () => {
    if (formData.questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    if (!quiz && !level?.courseId) {
      alert('Level details are missing. Please refresh and try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (quiz) {
        // Update existing quiz
        await quizAPI.update(quiz._id, formData);
      } else {
        // Create new quiz
        await quizAPI.create({
          levelId: levelId || '',
          courseId: level?.courseId || '',
          ...formData
        });
      }
      void fetchData();
    } catch (error) {
      console.error('Failed to save quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!quiz) return;

    setIsSubmitting(true);
    try {
      await quizAPI.delete(quiz._id);
      setShowDeleteDialog(false);
      navigate(level?.courseId ? `/admin/courses/${level.courseId}/levels` : '/admin/courses');
    } catch (error) {
      console.error('Failed to delete quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          question: '',
          options: ['', ''],
          correctAnswer: 0,
          explanation: ''
        }
      ]
    });
  };

  const updateQuestion = <K extends keyof Question>(index: number, field: K, value: Question[K]) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options.push('');
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...formData.questions];
    const question = updatedQuestions[questionIndex];
    
    if (question.options.length <= 2) {
      alert('A question must have at least 2 options');
      return;
    }

    question.options.splice(optionIndex, 1);
    
    // Adjust correct answer if needed
    if (question.correctAnswer >= optionIndex) {
      question.correctAnswer = Math.max(0, question.correctAnswer - 1);
    }
    
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions.splice(index, 1);
    setFormData({ ...formData, questions: updatedQuestions });
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
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Manage Quiz</h1>
                <p className="text-sm text-gray-500">{level?.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {quiz && (
                <Button variant="outline" onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Quiz
                </Button>
              )}
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Save Quiz
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quiz Settings */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Quiz Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter quiz title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter quiz description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passingScore">Passing Score (%)</Label>
                <Input
                  id="passingScore"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.passingScore}
                  onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAttempts">Max Attempts</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  min="1"
                  value={formData.maxAttempts}
                  onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time Limit (minutes, 0 = no limit)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min="0"
                  value={formData.timeLimit}
                  onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Questions ({formData.questions.length})</h2>
            <Button onClick={addQuestion}>
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>

          {formData.questions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No questions yet</h3>
                <p className="text-gray-500 mt-1">Add questions to create your quiz</p>
                <Button className="mt-4" onClick={addQuestion}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Question
                </Button>
              </CardContent>
            </Card>
          ) : (
            formData.questions.map((question, qIndex) => (
              <Card key={qIndex}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-medium">Question {qIndex + 1}</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeQuestion(qIndex)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Question Text</Label>
                      <textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                        placeholder="Enter your question"
                        className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
                      />
                    </div>

                    <div>
                      <Label>Options</Label>
                      <div className="space-y-2 mt-2">
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={question.correctAnswer === oIndex}
                              onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                              className="w-4 h-4"
                            />
                            <Input
                              value={option}
                              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              placeholder={`Option ${oIndex + 1}`}
                              className="flex-1"
                            />
                            {question.options.length > 2 && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeOption(qIndex, oIndex)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => addOption(qIndex)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Option
                      </Button>
                    </div>

                    <div>
                      <Label>Explanation (optional)</Label>
                      <textarea
                        value={question.explanation}
                        onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                        placeholder="Explain the correct answer"
                        className="w-full min-h-[60px] px-3 py-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quiz? This action cannot be undone.
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

export default AdminQuiz;
