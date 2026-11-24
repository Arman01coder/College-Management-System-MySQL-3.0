import React from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import LampLoginPage from './pages/LampLoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import TeachersPage from './pages/TeachersPage';
import CoursesPage from './pages/CoursesPage';
import AttendancePage from './pages/AttendancePage';
import FeesPage from './pages/FeesPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import { ROLES } from './constants';

// Naye LampLoginPage ko aapke auth aur router se connect karne ke liye wrapper
const LampLoginWrapper: React.FC<{ initialTab?: 'signin' | 'register' }> = ({ initialTab = 'signin' }) => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  return (
    <LampLoginPage
      initialTab={initialTab}
      onLoginSuccess={async (credentials) => {
        const user = await login(credentials);
        if (user) {
          navigate('/dashboard');
          return true;
        }
        return false;
      }}
      onRegisterSuccess={async (details) => {
        const res = await register(details);
        return { user: res.user ?? null, error: res.error };
      }}
    />
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            {/* Naya Lamp Login Page */}
            <Route path="/login" element={<LampLoginWrapper />} />
            
            {/* Purana Login Page (Wapas shift hone ke liye bas is line ko uncomment karein aur upar waali comment karein) */}
            {/* <Route path="/login" element={<LoginPage />} /> */}

            <Route path="/register" element={<LampLoginWrapper initialTab="register" />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="students" element={
                <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
                  <StudentsPage />
                </ProtectedRoute>
              } />
              <Route path="teachers" element={
                <ProtectedRoute roles={[ROLES.ADMIN]}>
                  <TeachersPage />
                </ProtectedRoute>
              } />
              <Route path="courses" element={
                <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
                  <CoursesPage />
                </ProtectedRoute>
              } />
              <Route path="attendance" element={
                <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]}>
                  <AttendancePage />
                </ProtectedRoute>
              } />
              <Route path="fees" element={
                <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]}>
                  <FeesPage />
                </ProtectedRoute>
              } />
              <Route path="settings" element={
                <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]}>
                  <SettingsPage />
                </ProtectedRoute>
              } />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;