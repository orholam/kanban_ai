import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateSupabaseAccessToken } from './_lib/mcp/auth.js';
import { createServiceRoleClient } from './_lib/supabaseService.js';
import { vercelRequestToWebRequest } from './_lib/mcp/vercelBridge.js';

type InviteBody = {
  projectId?: string;
  email?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.status(204);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = (typeof req.body === 'object' && req.body !== null ? req.body : {}) as InviteBody;
  const projectId = String(body.projectId ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();

  if (!projectId || !email) {
    res.status(400).json({ error: 'projectId and email are required' });
    return;
  }

  const request = vercelRequestToWebRequest(req);
  const auth = await authenticateSupabaseAccessToken(request);
  if (!auth.ok) {
    res.status(401).json({ error: 'Unauthorized', reason: auth.reason });
    return;
  }

  const { supabase: userClient, userId } = auth.context;

  const { data: project, error: projectError } = await userClient
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .maybeSingle();

  if (projectError) {
    console.error('invite-collaborator project lookup:', projectError.message);
    res.status(500).json({ error: 'Failed to verify project' });
    return;
  }

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  if (project.user_id !== userId) {
    res.status(403).json({ error: 'Only the project owner can invite members' });
    return;
  }

  const service = createServiceRoleClient();
  if (!service) {
    res.status(503).json({ error: 'Server is not configured for invitations (missing service role key)' });
    return;
  }

  const { data: lookedUp, error: lookupError } = await service.auth.admin.getUserByEmail(email);
  if (lookupError) {
    console.error('invite-collaborator getUserByEmail:', lookupError.message);
    res.status(500).json({ error: 'Failed to look up user' });
    return;
  }

  const invitee = lookedUp.user;
  if (!invitee) {
    res.status(404).json({ error: 'No account found with that email' });
    return;
  }

  if (invitee.id === userId) {
    res.status(400).json({ error: 'You are already the project owner' });
    return;
  }

  const { data: existing, error: existingError } = await service
    .from('project_collaborators')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', invitee.id)
    .maybeSingle();

  if (existingError) {
    console.error('invite-collaborator existing check:', existingError.message);
    res.status(500).json({ error: 'Failed to verify membership' });
    return;
  }

  if (existing) {
    res.status(409).json({ error: 'That person is already a member of this project' });
    return;
  }

  const now = new Date().toISOString();
  const { data: collaborator, error: insertError } = await service
    .from('project_collaborators')
    .insert([
      {
        project_id: projectId,
        user_id: invitee.id,
        role: 'editor',
        invited_at: now,
        accepted: true,
      },
    ])
    .select('id, project_id, user_id, role, invited_at, accepted')
    .single();

  if (insertError) {
    console.error('invite-collaborator insert:', insertError.message);
    res.status(500).json({ error: 'Failed to add member' });
    return;
  }

  const { data: profile } = await service
    .from('profiles')
    .select('full_name, display_name, name, username')
    .eq('id', invitee.id)
    .maybeSingle();

  const displayName =
    [profile?.display_name, profile?.full_name, profile?.name, profile?.username]
      .find((v) => typeof v === 'string' && v.trim())?.trim() ?? null;

  res.status(201).json({
    collaborator: {
      ...collaborator,
      display_name: displayName,
      email: invitee.email ?? null,
    },
  });
}
