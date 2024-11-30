import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import KanbanBoard from './pages/KanbanBoard';
import NewProject from './pages/NewProject';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AppContent() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <BrowserRouter>
      <div className={`h-screen flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        <div className="flex flex-1 overflow-hidden">
          {user && <Sidebar isDarkMode={isDarkMode} />}
          <main className="flex-1">
            <Routes>
              <Route 
                path="/" 
                element={
                  user ? <Navigate to="/kanban" /> : <LandingPage isDarkMode={isDarkMode} />
                } 
              />
              <Route path="/login" element={<Login isDarkMode={isDarkMode} />} />
              <Route
                path="/kanban"
                element={
                  <PrivateRoute>
                    <KanbanBoard isDarkMode={isDarkMode} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/new-project"
                element={
                  <PrivateRoute>
                    <NewProject isDarkMode={isDarkMode} />
                  </PrivateRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
