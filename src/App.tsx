/**
 * Main App Component
 * Routes and application structure
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import LandingPage from './pages/LandingPage';
import WelcomeScreen from './pages/WelcomeScreen';
import StudentDashboard from './pages/StudentDashboard';
import CourseDetails from './pages/CourseDetails';
import Payment from './pages/Payment';
import VideoLearning from './pages/VideoLearning';
import QuizPage from './pages/Quiz';
import AdminDashboard from './pages/AdminDashboard';
import AdminCourses from './pages/AdminCourses';
import AdminLevels from './pages/AdminLevels';
import AdminPayments from './pages/AdminPayments';
import AdminQuiz from './pages/AdminQuiz';
import AdminStudents from './pages/AdminStudents';
import AdminRevenue from './pages/AdminRevenue';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          <Route 
            path="/forgot-password" 
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            } 
          />

          {/* Default Route */}
          <Route 
            path="/" 
            element={<Navigate to="/welcome" replace />} 
          />

          {/* Optional Landing */}
          <Route 
            path="/landing" 
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            } 
          />

          {/* Public Welcome */}
          <Route 
            path="/welcome" 
            element={<WelcomeScreen />} 
          />

          {/* Legacy Home Path */}
          <Route 
            path="/home" 
            element={<Navigate to="/welcome" replace />} 
          />

          {/* Student Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/course/:id" 
            element={
              <ProtectedRoute>
                <CourseDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payment/:courseId" 
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/learn/:courseId/level/:levelId" 
            element={
              <ProtectedRoute>
                <VideoLearning />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/quiz/:levelId" 
            element={
              <ProtectedRoute>
                <QuizPage />
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/courses" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminCourses />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/courses/:courseId/levels" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminLevels />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/levels/:levelId/quiz" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminQuiz />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/payments" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminPayments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/students" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminStudents />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/revenue" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminRevenue />
              </ProtectedRoute>
            } 
          />

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
