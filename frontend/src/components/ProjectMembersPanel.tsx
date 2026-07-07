import React, { useCallback, useEffect, useState } from 'react';
import { X, UserPlus, Users, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  inviteProjectCollaborator,
  listProjectCollaborators,
  removeProjectCollaborator,
} from '../api/projectCollaborators';
import type { ProjectCollaborator } from '../types';

interface ProjectMembersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectOwnerId: string;
  currentUserId: string;
  isDarkMode: boolean;
  onMembersChanged?: () => void | Promise<void>;
}

function memberLabel(member: ProjectCollaborator): string {
  if (member.display_name?.trim()) return member.display_name.trim();
  if (member.email?.trim()) return member.email.trim();
  return member.user_id.slice(0, 8) + '…';
}

export default function ProjectMembersPanel({
  isOpen,
  onClose,
  projectId,
  projectOwnerId,
  currentUserId,
  isDarkMode,
  onMembersChanged,
}: ProjectMembersPanelProps) {
  const [members, setMembers] = useState<ProjectCollaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isOwner = currentUserId === projectOwnerId;

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listProjectCollaborators(projectId);
      setMembers(rows);
    } catch (err) {
      console.error('Failed to load project members:', err);
      toast.error('Could not load project members');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!isOpen) return;
    void loadMembers();
    setEmail('');
  }, [isOpen, loadMembers]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner || inviting) return;
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error('Enter an email address');
      return;
    }
    setInviting(true);
    try {
      const added = await inviteProjectCollaborator(projectId, trimmed);
      setMembers((prev) => {
        if (prev.some((m) => m.id === added.id)) return prev;
        return [...prev, added];
      });
      setEmail('');
      toast.success(`${memberLabel(added)} added to the project`);
      await onMembersChanged?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to invite member';
      toast.error(message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (member: ProjectCollaborator) => {
    if (!isOwner || member.role === 'owner' || removingId) return;
    if (!window.confirm(`Remove ${memberLabel(member)} from this project?`)) return;
    setRemovingId(member.id);
    try {
      await removeProjectCollaborator(projectId, member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      toast.success('Member removed');
      await onMembersChanged?.();
    } catch (err) {
      console.error('Failed to remove member:', err);
      toast.error('Could not remove member');
    } finally {
      setRemovingId(null);
    }
  };

  if (!isOpen) return null;

  const border = isDarkMode ? 'border-zinc-800/60' : 'border-zinc-200/70';
  const panelBg = isDarkMode ? 'bg-zinc-950' : 'bg-white';
  const muted = isDarkMode ? 'text-zinc-400' : 'text-zinc-600';

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Project members">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Close members panel"
        onClick={onClose}
      />
      <aside
        className={`relative flex h-full w-full max-w-md flex-col border-l shadow-2xl ${border} ${panelBg}`}
      >
        <div className={`flex items-center justify-between gap-3 border-b px-5 py-4 ${border}`}>
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isDarkMode
                  ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/25'
                  : 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/80'
              }`}
            >
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className={`truncate text-base font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                Project members
              </h2>
              <p className={`text-xs ${muted}`}>
                {isOwner ? 'Invite people by email' : 'People with access'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`rounded-lg p-2 transition-colors ${
              isDarkMode ? 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200' : 'text-zinc-500 hover:bg-zinc-100'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {isOwner ? (
            <form onSubmit={(e) => void handleInvite(e)} className={`border-b px-5 py-4 ${border}`}>
              <label htmlFor="member-email" className={`mb-2 block text-xs font-medium ${muted}`}>
                Add by email
              </label>
              <div className="flex gap-2">
                <input
                  id="member-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="person@example.com"
                  disabled={inviting}
                  className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 ${
                    isDarkMode
                      ? 'border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600'
                      : 'border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400'
                  }`}
                />
                <button
                  type="submit"
                  disabled={inviting || !email.trim()}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                >
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Add
                </button>
              </div>
              <p className={`mt-2 text-[11px] leading-snug ${muted}`}>
                They must already have a Kanban AI account. Access is granted immediately.
              </p>
            </form>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className={`h-6 w-6 animate-spin ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
              </div>
            ) : members.length === 0 ? (
              <p className={`py-6 text-center text-sm ${muted}`}>No members yet.</p>
            ) : (
              <ul className="space-y-2">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
                      isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50/80'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-medium ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                        {memberLabel(member)}
                      </p>
                      <p className={`text-xs capitalize ${muted}`}>
                        {member.role}
                        {member.user_id === currentUserId ? ' · you' : ''}
                      </p>
                    </div>
                    {isOwner && member.role !== 'owner' ? (
                      <button
                        type="button"
                        onClick={() => void handleRemove(member)}
                        disabled={removingId === member.id}
                        aria-label={`Remove ${memberLabel(member)}`}
                        className={`shrink-0 rounded-lg p-2 transition-colors disabled:opacity-50 ${
                          isDarkMode
                            ? 'text-red-400 hover:bg-red-950/50'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        {removingId === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
