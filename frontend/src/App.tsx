import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import Feedback from './pages/Feedback';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function KanbanBoardWrapper({ isDarkMode, projects, searchQuery, isLoading }: { isDarkMode: boolean; projects: Project[]; searchQuery: string; isLoading: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if user is authenticated, not loading, and has no projects
    if (user && !isLoading && projects.length === 0) {
      navigate('/new-project');
    }
  }, [user, projects.length, isLoading, navigate]);

  // Don't render anything if redirecting
  if (user && !isLoading && projects.length === 0) {
    return null;
  }

  // Show loading state while fetching projects
  if (isLoading) {
    return (
      <div className={`h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading projects...</p>
        </div>
      </div>
    );
  }

  return <KanbanBoard isDarkMode={isDarkMode} projects={projects} searchQuery={searchQuery} />;
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
          {user && <Sidebar isDarkMode={isDarkMode} projects={projects} user={user} />}
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
                    <KanbanBoardWrapper isDarkMode={isDarkMode} projects={projects} searchQuery={searchQuery} isLoading={isLoading} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/project/:projectId"
                element={
                  <PrivateRoute>
                    <KanbanBoardWrapper 
                      isDarkMode={isDarkMode} 
                      projects={projects}
                      searchQuery={searchQuery}
                      isLoading={isLoading}
                    />
                  </PrivateRoute>
                }
              />
              <Route 
                path="/new-project/*" 
                element={
                  <PrivateRoute>
                    <NewProject isDarkMode={isDarkMode} setProjects={setProjects} />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <PrivateRoute>
                    <AnalyticsPage isDarkMode={isDarkMode} />
                  </PrivateRoute>
                } 
              />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route 
                path="/feedback" 
                element={
                  <PrivateRoute>
                    <Feedback />
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
      <Toaster />
    </AuthProvider>
  );
}
