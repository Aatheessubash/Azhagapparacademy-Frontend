/**
 * Quiz Page
 * Interactive quiz for course levels
 */

import React, { useCallback, useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { quizAPI, levelAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trophy,
  RotateCcw,
  ChevronRight
} from 'lucide-react';

interface Question {
  _id: string;
  question: string;
  options: string[];
}

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  questions: Question[];
  passingScore: number;
  timeLimit: number;
}

interface LevelSummary {
  _id: string;
  title: string;
  courseId: string;
}

interface QuizResultItem {
  questionId: string;
  question: string;
  options: string[];
  selectedAnswer: number | null;
  correctAnswer: number;
  isCorrect: boolean;
  explanation?: string;
}

interface QuizSubmitResult {
  score: number;
  passed: boolean;
  passingScore: number;
  correctAnswers: number;
  totalQuestions: number;
  attemptsUsed: number;
  maxAttempts: number;
  results: QuizResultItem[];
}

interface ApiErrorResponse {
  message?: string;
}

const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
  const typedError = error as AxiosError<ApiErrorResponse>;
  return typedError.response?.data?.message || fallbackMessage;
};

const QuizPage: React.FC = () => {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [level, setLevel] = useState<LevelSummary | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const fetchQuiz = useCallback(async () => {
    if (!levelId) return;

    try {
      setError('');
      const [quizRes, levelRes] = await Promise.all([
        quizAPI.getByLevel(levelId),
        levelAPI.getById(levelId)
      ]);

      setQuiz(quizRes.data.quiz as Quiz);
      setLevel(levelRes.data.level as LevelSummary);
      setTimeLeft(null);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to load quiz'));
    }
  }, [levelId]);

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = useCallback(
    async (allowPartial = false) => {
      if (!quiz || isSubmitting) return;

      const answeredCount = Object.keys(answers).length;
      if (!allowPartial && answeredCount < quiz.questions.length) {
        setError('Please answer all questions before submitting');
        return;
      }

      setIsSubmitting(true);
      setError('');

      try {
        const formattedAnswers = quiz.questions.map((question) => ({
          questionId: question._id,
          selectedAnswer: answers[question._id] ?? -1
        }));

        const response = await quizAPI.submit(quiz._id, formattedAnswers);
        setResult(response.data as QuizSubmitResult);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, 'Failed to submit quiz'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [answers, isSubmitting, quiz]
  );

  useEffect(() => {
    if (levelId) {
      void fetchQuiz();
    }
  }, [levelId, fetchQuiz]);

  // Timer
  useEffect(() => {
    if (!quiz?.timeLimit || result) return;

    if (timeLeft === null) {
      setTimeLeft(quiz.timeLimit * 60);
      return;
    }

    if (timeLeft <= 0) return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          window.clearInterval(timer);
          void handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [quiz?.timeLimit, timeLeft, result, handleSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setResult(null);
    setError('');
    if (quiz?.timeLimit) {
      setTimeLeft(quiz.timeLimit * 60);
    } else {
      setTimeLeft(null);
    }
  };

  const handleNextLevel = () => {
    if (level) {
      navigate(`/course/${level.courseId}`);
    }
  };

  if (error && !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Quiz Not Available</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (quiz.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Quiz Not Ready</h2>
            <p className="text-gray-600 mb-6">This quiz has no questions yet.</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show Results
  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="p-8">
              <div className="text-center mb-8">
                {result.passed ? (
                  <>
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-green-700 mb-2">Congratulations!</h2>
                    <p className="text-gray-600">You passed the quiz and unlocked the next level!</p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-red-700 mb-2">Quiz Failed</h2>
                    <p className="text-gray-600">You didn't reach the passing score. Try again!</p>
                  </>
                )}
              </div>

              {/* Score */}
              <div className="bg-gray-100 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">Your Score</span>
                  <span className={`text-2xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {result.score}%
                  </span>
                </div>
                <Progress value={result.score} className="h-3" />
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">Passing Score: {result.passingScore}%</span>
                  <span className="text-gray-500">
                    {result.correctAnswers} / {result.totalQuestions} correct
                  </span>
                </div>
              </div>

              {/* Attempts */}
              <div className="text-center mb-6">
                <p className="text-gray-600">
                  Attempt {result.attemptsUsed} of {result.maxAttempts}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                {result.passed ? (
                  <Button className="flex-1" onClick={handleNextLevel}>
                    Continue to Next Level
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : result.attemptsUsed < result.maxAttempts ? (
                  <Button className="flex-1" variant="outline" onClick={handleRetry}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                ) : (
                  <Button className="flex-1" variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Review Video
                  </Button>
                )}
              </div>

              {/* Results Breakdown */}
              {result.results && result.results.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Results Breakdown</h3>
                  <div className="space-y-4">
                    {result.results.map((item, index) => (
                      <div
                        key={`${item.questionId}-${index}`}
                        className={`p-4 rounded-lg ${item.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}
                      >
                        <div className="flex items-start gap-3">
                          {item.isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{item.question}</p>
                            <p className="text-sm mt-1">
                              <span className="text-gray-500">Your answer: </span>
                              <span className={item.isCorrect ? 'text-green-600' : 'text-red-600'}>
                                {item.selectedAnswer !== null && item.selectedAnswer >= 0
                                  ? item.options[item.selectedAnswer] || 'Not answered'
                                  : 'Not answered'}
                              </span>
                            </p>
                            {!item.isCorrect && (
                              <p className="text-sm mt-1">
                                <span className="text-gray-500">Correct answer: </span>
                                <span className="text-green-600">
                                  {item.options[item.correctAnswer] || 'Not available'}
                                </span>
                              </p>
                            )}
                            {item.explanation && (
                              <p className="text-sm text-gray-600 mt-2">
                                <span className="font-medium">Explanation: </span>
                                {item.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Video
          </Button>

          {quiz.timeLimit > 0 && timeLeft !== null && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                timeLeft < 60 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        {/* Quiz Info */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-gray-600 mt-1">{quiz.description}</p>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Question {currentQuestion + 1} of {quiz.questions.length}</span>
            <span className="text-gray-500">{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              {currentQ.question}
            </h3>

            <RadioGroup
              value={answers[currentQ._id]?.toString()}
              onValueChange={(value) => handleAnswerSelect(currentQ._id, parseInt(value, 10))}
              className="space-y-3"
            >
              {currentQ.options.map((option, index) => (
                <div
                  key={index}
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    answers[currentQ._id] === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleAnswerSelect(currentQ._id, index)}
                >
                  <RadioGroupItem
                    value={index.toString()}
                    id={`option-${index}`}
                    className="mr-3"
                  />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>

          {currentQuestion < quiz.questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestion((prev) => prev + 1)}
              disabled={answers[currentQ._id] === undefined}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                void handleSubmit();
              }}
              disabled={isSubmitting || Object.keys(answers).length < quiz.questions.length}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Quiz
                </>
              )}
            </Button>
          )}
        </div>

        {/* Question Navigator */}
        <div className="mt-8">
          <p className="text-sm text-gray-500 mb-3">Jump to question:</p>
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((question, index) => (
              <button
                key={question._id}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                  index === currentQuestion
                    ? 'bg-blue-600 text-white'
                    : answers[question._id] !== undefined
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
