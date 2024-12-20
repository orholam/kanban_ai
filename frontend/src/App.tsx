import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import KanbanBoard from './pages/KanbanBoard';
import NewProject from './pages/NewProject';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import AnalyticsPage from './pages/AnalyticsPage';
import { supabase } from './lib/supabase';
import type { Project } from './types';
import { trackPage } from 'tenable-analytics';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import { Toaster } from 'sonner';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AppContent() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches && false;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) {
        setProjects([]);
        return;
      }

      try {
        console.log("Fetching projects TEST");
        setIsLoading(true);
        let { data: projects, error } = await supabase
          .from('projects')
          .select('*');

        if (error) {
          console.error('Error fetching projects:', error);
          return;
        }

        if (projects) {
          console.log(projects);
          setProjects(projects);
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  useEffect(() => {
    trackPage();
  }, []);

  return (
    <BrowserRouter>
      <div className={`h-screen flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Header 
          isDarkMode={isDarkMode} 
          toggleTheme={toggleTheme}
          onSearch={setSearchQuery}
        />
        <div className="flex flex-1 overflow-hidden">
          {user && <Sidebar isDarkMode={isDarkMode} projects={projects} />}
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
                    <KanbanBoard isDarkMode={isDarkMode} projects={projects} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/project/:projectId"
                element={
                  <PrivateRoute>
                    <KanbanBoard 
                      isDarkMode={isDarkMode} 
                      projects={projects}
                      searchQuery={searchQuery}
                    />
                  </PrivateRoute>
                }
              />
              <Route path="/new-project/*" element={<NewProject isDarkMode={isDarkMode} setProjects={setProjects} />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
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
      <Toaster />
    </AuthProvider>
  );
}
