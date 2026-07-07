import { supabase } from '../lib/supabase';
import { isLocalAppMode } from '../lib/localApp';
import { fetchProfileDisplayName } from '../lib/profileDisplayName';
import type { ProjectCollaborator } from '../types';

const LOCAL = '/api/local';

async function mapCollaboratorRow(
  row: Record<string, unknown>
): Promise<ProjectCollaborator> {
  const userId = String(row.user_id ?? '');
  const displayName =
    typeof row.display_name === 'string' && row.display_name.trim()
      ? row.display_name.trim()
      : await fetchProfileDisplayName(userId);

  return {
    id: String(row.id),
    project_id: String(row.project_id),
    user_id: userId,
    role: (row.role as ProjectCollaborator['role']) || 'editor',
    invited_at: String(row.invited_at ?? ''),
    accepted: Boolean(row.accepted),
    display_name: displayName,
    email: typeof row.email === 'string' ? row.email : null,
  };
}

export async function listProjectCollaborators(projectId: string): Promise<ProjectCollaborator[]> {
  if (isLocalAppMode()) {
    const res = await fetch(`${LOCAL}/projects/${encodeURIComponent(projectId)}/collaborators`);
    const j = (await res.json().catch(() => ({}))) as { collaborators?: Record<string, unknown>[]; error?: string };
    if (!res.ok) throw new Error(j.error || 'Failed to load members');
    const rows = j.collaborators ?? [];
    return Promise.all(rows.map((row) => mapCollaboratorRow(row)));
  }

  const { data, error } = await supabase
    .from('project_collaborators')
    .select('id, project_id, user_id, role, invited_at, accepted')
    .eq('project_id', projectId)
    .eq('accepted', true)
    .order('invited_at', { ascending: true });

  if (error) throw error;
  return Promise.all((data ?? []).map((row) => mapCollaboratorRow(row as Record<string, unknown>)));
}

export async function inviteProjectCollaborator(
  projectId: string,
  email: string
): Promise<ProjectCollaborator> {
  const trimmed = email.trim();
  if (!trimmed) {
    throw new Error('Email is required');
  }

  if (isLocalAppMode()) {
    const res = await fetch(`${LOCAL}/projects/${encodeURIComponent(projectId)}/collaborators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmed }),
    });
    const j = (await res.json().catch(() => ({}))) as {
      collaborator?: Record<string, unknown>;
      error?: string;
    };
    if (!res.ok) throw new Error(j.error || 'Failed to invite member');
    if (!j.collaborator) throw new Error('Invalid invite response');
    return mapCollaboratorRow(j.collaborator);
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    throw new Error('You must be signed in to invite members');
  }

  const res = await fetch('/api/invite-collaborator', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ projectId, email: trimmed }),
  });

  const j = (await res.json().catch(() => ({}))) as {
    collaborator?: Record<string, unknown>;
    error?: string;
  };
  if (!res.ok) throw new Error(j.error || 'Failed to invite member');
  if (!j.collaborator) throw new Error('Invalid invite response');
  return mapCollaboratorRow(j.collaborator);
}

export async function removeProjectCollaborator(projectId: string, collaboratorId: string): Promise<void> {
  if (isLocalAppMode()) {
    const res = await fetch(
      `${LOCAL}/projects/${encodeURIComponent(projectId)}/collaborators/${encodeURIComponent(collaboratorId)}`,
      { method: 'DELETE' }
    );
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) throw new Error(j.error || 'Failed to remove member');
    return;
  }

  const { error } = await supabase
    .from('project_collaborators')
    .delete()
    .eq('id', collaboratorId)
    .eq('project_id', projectId);

  if (error) throw error;
}
