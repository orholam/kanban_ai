import { supabase } from '../lib/supabase';

interface FeedbackData {
  comment: string;
}

/**
 * Submit feedback / contact to the shared `/api/feedback` endpoint
 * (same `feedback` table as the in-app Feedback page).
 */
export async function createFeedback(feedbackData: FeedbackData) {
  const comment = feedbackData.comment.trim();
  if (!comment) {
    throw new Error('comment is required');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {
    // Public contact may submit without a session.
  }

  const res = await fetch('/api/feedback', {
    method: 'POST',
    headers,
    body: JSON.stringify({ comment }),
  });

  const body = (await res.json().catch(() => ({}))) as { error?: string; id?: string };

  if (!res.ok) {
    throw new Error(body.error ?? `Could not send message (${res.status})`);
  }

  return body;
}
