import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateSupabaseAccessToken } from './_lib/mcp/auth.js';
import { createServiceRoleClient } from './_lib/supabaseService.js';
import { vercelRequestToWebRequest } from './_lib/mcp/vercelBridge.js';

type FeedbackBody = {
  comment?: string;
};

const MAX_COMMENT_LENGTH = 8000;

/**
 * Shared feedback / contact intake. Writes to the same `feedback` table the in-app
 * Feedback page uses. Auth is optional: signed-in users get `user_id` set; public
 * contact form submissions may insert with `user_id` null (requires nullable column).
 */
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

  const body = (typeof req.body === 'object' && req.body !== null ? req.body : {}) as FeedbackBody;
  const comment = String(body.comment ?? '').trim();

  if (!comment) {
    res.status(400).json({ error: 'comment is required' });
    return;
  }

  if (comment.length > MAX_COMMENT_LENGTH) {
    res.status(400).json({ error: `comment must be at most ${MAX_COMMENT_LENGTH} characters` });
    return;
  }

  const service = createServiceRoleClient();
  if (!service) {
    res.status(503).json({ error: 'Feedback storage is not configured' });
    return;
  }

  let userId: string | null = null;
  const request = vercelRequestToWebRequest(req);
  const auth = await authenticateSupabaseAccessToken(request);
  if (auth.ok) {
    userId = auth.context.userId;
  }

  const row: { comment: string; created_at: string; user_id?: string | null } = {
    comment,
    created_at: new Date().toISOString(),
    user_id: userId,
  };

  const { data, error } = await service.from('feedback').insert([row]).select('id').maybeSingle();

  if (error) {
    // Retry without user_id if the column rejects null (legacy NOT NULL without default).
    if (!userId && /null|not-null|user_id/i.test(error.message)) {
      res.status(503).json({
        error:
          'Contact form requires a nullable feedback.user_id column, or sign in and use /feedback.',
        detail: error.message,
      });
      return;
    }
    console.error('feedback insert:', error.message);
    res.status(500).json({ error: 'Failed to save message' });
    return;
  }

  res.status(201).json({ ok: true, id: data?.id ?? null });
}
