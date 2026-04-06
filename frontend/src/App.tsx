import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { supabase } from './lib/supabase';
import type { Project } from './types';
import { Toaster, toast } from 'sonner';
import { loadGuestDraft, guestDraftHasMeaningfulData, clearGuestDraft } from './lib/guestDraft';
import { migrateGuestDraft } from './lib/migrateGuestDraft';
import { isWorkbenchPath } from './lib/siteMeta';
import { applyWorkbenchDocumentMeta } from './lib/documentMeta';

const KanbanBoard = lazy(() => import('./pages/KanbanBoard'));
const NewProject = lazy(() => import('./pages/NewProject'));
const Login = lazy(() => import('./pages/Login'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Waitlist = lazy(() => import('./pages/Waitlist'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const PublicProject = lazy(() => import('./pages/PublicProject'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Feedback = lazy(() => import('./pages/Feedback'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const AccountPage = lazy(() => import('./pages/AccountPage'));

function RouteFallback({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div
      className={`flex h-full min-h-[12rem] flex-1 items-center justify-center ${isDarkMode ? 'bg-zinc-950' : 'bg-zinc-50'}`}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function KanbanBoardWrapper({
  isDarkMode,
  projects,
  isLoading,
  setProjects,
}: {
  isDarkMode: boolean;
  projects: Project[];
  isLoading: boolean;
  setProjects: (projects: Project[]) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isLoading && projects.length === 0) {
      navigate('/new-project');
    }
  }, [user, projects.length, isLoading, navigate]);

  if (user && !isLoading && projects.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div
        className={`flex h-full min-h-0 flex-1 items-center justify-center ${isDarkMode ? 'bg-zinc-950' : 'bg-zinc-50'}`}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Loading projects…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Suspense fallback={<RouteFallback isDarkMode={isDarkMode} />}>
        <KanbanBoard
          isDarkMode={isDarkMode}
          projects={projects}
          searchQuery=""
          setProjects={setProjects}
        />
      </Suspense>
    </div>
  );
}

function GuestKanbanBoardWrapper({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Suspense fallback={<RouteFallback isDarkMode={isDarkMode} />}>
        <KanbanBoard guestMode isDarkMode={isDarkMode} searchQuery="" />
      </Suspense>
    </div>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
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

  useEffect(() => {
    if (isWorkbenchPath(location.pathname)) {
      applyWorkbenchDocumentMeta();
    }
  }, [location.pathname]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) {
        setProjects([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const draft = loadGuestDraft();
        if (guestDraftHasMeaningfulData(draft)) {
          try {
            const created = await migrateGuestDraft(user, draft);
            clearGuestDraft();
            navigate(`/project/${created.id}`, { replace: true });
          } catch (err) {
            console.error('Guest draft migration failed:', err);
            toast.error(
              'Could not save your local board to your account. It stays on this device until you try again.'
            );
          }
        }

        const { data: collaborations, error } = await supabase
          .from('project_collaborators')
          .select(`
            project_id,
            projects (
              id,
              title,
              description,
              keywords,
              num_sprints,
              current_sprint,
              due_date,
              complete,
              created_at,
              user_id,
              private,
              projectType
            )
          `)
          .eq('user_id', user.id)
          .eq('accepted', true);

        if (error) {
          console.error('Error fetching projects:', error);
          return;
        }

        if (collaborations) {
          const userProjects: Project[] = collaborations
            .map((collaboration) => {
              const project = collaboration.projects as unknown as Record<string, unknown> | null;
              if (!project) return null;
              return {
                ...project,
                master_plan: '',
                initial_prompt: '',
                achievements: '',
                notes: '',
                projectType: (project.projectType as string) || 'Manual',
                private: (project.private as boolean | undefined) ?? true,
                tasks: [],
              } as Project;
            })
            .filter((project): project is Project => project !== null);

          setProjects(userProjects);
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [user, navigate]);

  const handleDeleteProject = async (projectId: string, projectTitle: string) => {
    if (
      !window.confirm(
        `Delete “${projectTitle}”? All tasks in this project will be removed. This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const { error: tasksErr } = await supabase.from('tasks').delete().eq('project_id', projectId);
      if (tasksErr) throw tasksErr;

      const { error: collabErr } = await supabase
        .from('project_collaborators')
        .delete()
        .eq('project_id', projectId);
      if (collabErr) throw collabErr;

      const { error: projectErr } = await supabase.from('projects').delete().eq('id', projectId);
      if (projectErr) throw projectErr;

      const next = projects.filter((p) => p.id !== projectId);
      setProjects(next);

      if (location.pathname === `/project/${projectId}`) {
        navigate(next.length > 0 ? `/project/${next[0].id}` : '/kanban', { replace: true });
      }

      toast.success('Project deleted');
    } catch (err) {
      console.error('Failed to delete project:', err);
      toast.error('Could not delete project');
    }
  };

  return (
    <Routes>
      <Route
        path="/public/project/:projectId"
        element={
          <div className={`h-screen flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
            <div className="flex-1 overflow-y-auto">
              <Suspense fallback={<RouteFallback isDarkMode={isDarkMode} />}>
                <PublicProject isDarkMode={isDarkMode} />
              </Suspense>
            </div>
          </div>
        }
      />
      <Route path="/privacy-policy" element={
        <div className={`h-screen flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<RouteFallback isDarkMode={isDarkMode} />}>
              <PrivacyPolicy />
            </Suspense>
          </div>
        </div>
      } />
      <Route path="/terms-of-service" element={
        <div className={`h-screen flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<RouteFallback isDarkMode={isDarkMode} />}>
              <TermsOfService />
            </Suspense>
          </div>
        </div>
      } />
      <Route path="/blog" element={
        <div className={`h-screen flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<RouteFallback isDarkMode={isDarkMode} />}>
              <Blog isDarkMode={isDarkMode} />
            </Suspense>
          </div>
        </div>
      } />
      <Route path="/blog/:slug" element={
        <div className={`h-screen flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<RouteFallback isDarkMode={isDarkMode} />}>
              <BlogPost isDarkMode={isDarkMode} />
            </Suspense>
          </div>
        </div>
      } />

      <Route path="*" element={
        <div className={`h-screen flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
          <div className="flex flex-1 overflow-hidden">
            {user && (
              <Sidebar
                isDarkMode={isDarkMode}
                projects={projects}
                user={user}
                onDeleteProject={handleDeleteProject}
              />
            )}
            <main className="flex-1 min-h-0 flex flex-col">
              <Routes>
                <Route
                  path="/"
                  element={
                    user ? (
                      <Navigate to="/kanban" />
                    ) : (
                      <Suspense fallback={<RouteFallback isDarkMode={isDarkMode} />}>
                        <LandingPage isDarkMode={isDarkMode} />
                      </Suspense>
                    )
                  }
                />
                <Route
                  path="/login"
                  element={
                    <Suspense fallback={<RouteFallback isDarkMode={isDarkMode} />}>
                      <Login isDarkMode={isDarkMode} />
                    </Suspense>
                  }
                />
                <Route
                  path="/waitlist"
                  element={
                    <Suspense fallback={<RouteFallback isDarkMode={isDarkMode} />}>
                      <Waitlist />
                    </Suspense>
                  }
                />
                <Route
                  path="/kanban"
                  element={
                    user ? (
                      <KanbanBoardWrapper
                        isDarkMode={isDarkMode}
                        projects={projects}
                        isLoading={isLoading}
                        setProjects={setProjects}
                      />
                    ) : (
                      <GuestKanbanBoardWrapper isDarkMode={isDarkMode} />
                    )
                  }
                />
                <Route
                  path="/project/:projectId"
                  element={
                    <PrivateRoute>
                      <KanbanBoardWrapper
                        isDarkMode={isDarkMode}
                        projects={projects}
                        isLoading={isLoading}
                        setProjects={setProjects}
                      />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/new-project/*"
                  element={
                    <PrivateRoute>
                      <Suspense fallback={<RouteFallback isDarkMode={isDarkMode} />}>
                        <NewProject isDarkMode={isDarkMode} setProjects={setProjects} />
                      </Suspense>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <PrivateRoute>
                      <Suspense fallback={<RouteFallback isDarkMode={isDarkMode} />}>
                        <AnalyticsPage isDarkMode={isDarkMode} />
                      </Suspense>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/feedback"
                  element={
                    <PrivateRoute>
                      <Suspense fallback={<RouteFallback isDarkMode={isDarkMode} />}>
                        <Feedback isDarkMode={isDarkMode} />
                      </Suspense>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/account"
                  element={
                    <PrivateRoute>
                      <Suspense fallback={<RouteFallback isDarkMode={isDarkMode} />}>
                        <AccountPage isDarkMode={isDarkMode} />
                      </Suspense>
                    </PrivateRoute>
                  }
                />
              </Routes>
            </main>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <AppContent />
        <Toaster position="bottom-center" />
      </AuthProvider>
    </BrowserRouter>
  );
}
