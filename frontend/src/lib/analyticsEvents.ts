import { supabase } from './supabase';
import type { AccountRole, AnalyticsEventType } from '../types';

/**
 * Single DB value for all guest analytics rows — we do not distinguish visitors.
 * Must stay 8–128 chars (RLS). Do not use per-browser ids here.
 */
export const AGGREGATE_GUEST_ANALYTICS_SESSION_ID = 'kanban_guest_all';

export type AnalyticsSubject =
  | { kind: 'user'; userId: string; accountRole?: AccountRole | null }
  | { kind: 'guest' };

export function recordAnalyticsEvent(
  eventType: AnalyticsEventType,
  metadata: Record<string, unknown> | undefined,
  subject: AnalyticsSubject
): void {
  if (subject.kind === 'user') {
    if (!subject.userId.trim()) return;
    if (subject.accountRole === 'owner') return;
    void supabase
      .from('analytics_events')
      .insert({
        user_id: subject.userId,
        guest_session_id: null,
        event_type: eventType,
        metadata: metadata ?? {},
      })
      .then(({ error }) => {
        if (error) console.warn('recordAnalyticsEvent:', error.message);
      });
    return;
  }

  void supabase
    .from('analytics_events')
    .insert({
      user_id: null,
      guest_session_id: AGGREGATE_GUEST_ANALYTICS_SESSION_ID,
      event_type: eventType,
      metadata: metadata ?? {},
    })
    .then(({ error }) => {
      if (error) console.warn('recordAnalyticsEvent (guest):', error.message);
    });
}
