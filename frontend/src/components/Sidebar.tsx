import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, FolderPlus, Sparkles, LayoutDashboard, Trash2, BarChart3, Plug, X } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { getUserInitials, getDisplayName } from '../lib/userUtils';
import type { Project } from '../types';

interface SidebarProps {
  isDarkMode: boolean;
  projects: Project[];
  user: User | null;
  /** App operator only: link to usage analytics. */
  showAnalyticsLink?: boolean;
  onDeleteProject?: (projectId: string, projectTitle: string) => void;
  /** Mobile drawer open state (ignored at `lg+` where sidebar is always visible). */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function navLinkBase(isDarkMode: boolean, active: boolean) {
  if (active) {
    return isDarkMode
      ? 'bg-indigo-500/15 text-white ring-1 ring-indigo-400/30 shadow-sm'
      : 'bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200/80 shadow-sm';
  }
  return isDarkMode
    ? 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100'
    : 'text-zinc-600 hover:bg-zinc-100/90 hover:text-zinc-900';
}

export default function Sidebar({
  isDarkMode,
  projects,
  user,
  showAnalyticsLink = false,
  onDeleteProject,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const location = useLocation();
  const accountActive = location.pathname === '/account';

  const handleNavClick = () => {
    onMobileClose?.();
  };

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] lg:hidden"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[min(100%,16rem)] shrink-0 flex-col border-r backdrop-blur-xl transition-transform duration-200 ease-out lg:static lg:z-auto lg:h-[calc(100vh-4rem)] lg:w-56 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isDarkMode
            ? 'border-zinc-800/60 bg-zinc-950/95'
            : 'border-zinc-200/70 bg-zinc-50/95'
        }`}
        aria-label="Workspace navigation"
      >
        <div className="flex items-center justify-between gap-2 px-3 pb-1 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
          <p
            className={`px-2 text-[11px] font-semibold uppercase tracking-[0.12em] ${
              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          >
            Menu
          </p>
          <button
            type="button"
            onClick={onMobileClose}
            className={`rounded-lg p-2.5 transition-colors ${
              isDarkMode
                ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                : 'text-zinc-500 hover:bg-zinc-200/80 hover:text-zinc-900'
            }`}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 lg:pt-4">
          <nav className="space-y-1">
            <p
              className={`mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] max-lg:hidden ${
                isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              Workspace
            </p>
            <Link
              to="/kanban"
              onClick={handleNavClick}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 lg:min-h-0 ${navLinkBase(
                isDarkMode,
                location.pathname === '/kanban'
              )}`}
            >
              <LayoutDashboard className="h-[18px] w-[18px] shrink-0 opacity-80" />
              My issues
            </Link>

            <Link
              to="/feedback"
              onClick={handleNavClick}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 lg:min-h-0 ${navLinkBase(
                isDarkMode,
                location.pathname === '/feedback'
              )}`}
            >
              <MessageSquare className="h-[18px] w-[18px] shrink-0 opacity-80" />
              Feedback
            </Link>

            <Link
              to="/connect"
              onClick={handleNavClick}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 lg:min-h-0 ${navLinkBase(
                isDarkMode,
                location.pathname === '/connect'
              )}`}
            >
              <Plug className="h-[18px] w-[18px] shrink-0 opacity-80" />
              Connect AI
            </Link>

            {showAnalyticsLink ? (
              <Link
                to="/analytics"
                onClick={handleNavClick}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 lg:min-h-0 ${navLinkBase(
                  isDarkMode,
                  location.pathname === '/analytics'
                )}`}
              >
                <BarChart3 className="h-[18px] w-[18px] shrink-0 opacity-80" />
                Analytics
              </Link>
            ) : null}

            <div className="pt-5">
              <p
                className={`mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                  isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                }`}
              >
                Projects
              </p>
              <div className="space-y-1">
                {projects.map((project, index) => {
                  const active =
                    location.pathname === `/project/${project.id}` ||
                    (index === 0 && location.pathname === '/kanban');
                  const canDelete = Boolean(user && onDeleteProject && project.user_id === user.id);
                  return (
                    <div
                      key={project.id}
                      className={`group relative flex items-center rounded-xl transition-all duration-200 ${
                        active
                          ? isDarkMode
                            ? 'bg-indigo-500/15 ring-1 ring-indigo-400/30 shadow-sm'
                            : 'bg-indigo-50 ring-1 ring-indigo-200/80 shadow-sm'
                          : ''
                      }`}
                    >
                      <Link
                        to={`/project/${project.id}`}
                        onClick={handleNavClick}
                        className={`flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl py-2.5 pl-3 text-sm font-medium transition-all duration-200 lg:min-h-0 ${
                          active
                            ? isDarkMode
                              ? 'text-white'
                              : 'text-indigo-900'
                            : navLinkBase(isDarkMode, false)
                        } ${
                          canDelete
                            ? 'pr-9 transition-[padding] duration-200 sm:pr-3 sm:group-hover:pr-9 sm:group-has-[button:focus-visible]:pr-9'
                            : 'pr-3'
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                            active
                              ? isDarkMode
                                ? 'bg-indigo-500/25 text-indigo-200'
                                : 'bg-indigo-100 text-indigo-700'
                              : isDarkMode
                                ? 'bg-zinc-800 text-zinc-400'
                                : 'bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          {project.title.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="min-w-0 truncate">{project.title}</span>
                      </Link>
                      {canDelete ? (
                        <button
                          type="button"
                          aria-label={`Delete project ${project.title}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDeleteProject?.(project.id, project.title);
                          }}
                          className={`absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg transition-[opacity,colors] duration-200 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500 sm:pointer-events-none sm:h-8 sm:w-8 sm:group-hover:pointer-events-auto sm:focus-visible:pointer-events-auto ${
                            isDarkMode
                              ? 'text-zinc-500 opacity-100 hover:bg-red-500/15 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100'
                              : 'text-zinc-400 opacity-100 hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100'
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
                <Link
                  to="/new-project"
                  onClick={handleNavClick}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 lg:min-h-0 ${navLinkBase(
                    isDarkMode,
                    false
                  )}`}
                >
                  <FolderPlus className="h-[18px] w-[18px] shrink-0 opacity-80" />
                  New project
                </Link>
                <Link
                  to="/new-project/ai"
                  onClick={handleNavClick}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200 lg:min-h-0 ${
                    isDarkMode
                      ? 'text-indigo-400/90 hover:bg-indigo-500/10 hover:text-indigo-300'
                      : 'text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  <Sparkles className="h-[18px] w-[18px] shrink-0" />
                  <span className="font-medium">AI-assisted setup</span>
                </Link>
              </div>
            </div>
          </nav>
        </div>

        <div
          className={`p-4 pb-[max(1rem,env(safe-area-inset-bottom))] ${
            isDarkMode
              ? 'border-t border-zinc-800/50 bg-zinc-950/40'
              : 'border-t border-zinc-200/60 bg-white/40'
          }`}
        >
          <Link
            to="/account"
            onClick={handleNavClick}
            className={`block rounded-xl outline-none transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
              isDarkMode ? 'focus-visible:ring-offset-zinc-950' : 'focus-visible:ring-offset-zinc-50'
            } ${
              accountActive
                ? isDarkMode
                  ? 'ring-1 ring-indigo-400/35 shadow-sm'
                  : 'ring-1 ring-indigo-200/90 shadow-sm'
                : ''
            }`}
          >
            <div
              className={`flex items-center gap-3 rounded-xl p-2.5 transition-colors ${
                accountActive
                  ? isDarkMode
                    ? 'bg-indigo-500/10 ring-1 ring-indigo-400/25'
                    : 'bg-indigo-50/90 ring-1 ring-indigo-200/70'
                  : isDarkMode
                    ? 'bg-zinc-900/50 ring-1 ring-zinc-800/70 hover:bg-zinc-900/70'
                    : 'bg-white/80 ring-1 ring-zinc-200/70 shadow-sm shadow-zinc-950/[0.03] hover:bg-white'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-semibold text-white shadow-md">
                {user ? getUserInitials(user) : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  {user ? getDisplayName(user) : 'Unknown User'}
                </p>
                <p className={`truncate text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  {user?.email || 'No email'}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
