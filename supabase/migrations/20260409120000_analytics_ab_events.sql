-- Landing page A/B test events: extend event_type to include lp_view and lp_cta_click.
-- These are inserted anonymously (anon role) via the existing guest policy.

ALTER TABLE public.analytics_events
  DROP CONSTRAINT analytics_events_event_type_check;

ALTER TABLE public.analytics_events
  ADD CONSTRAINT analytics_events_event_type_check CHECK (
    event_type IN (
      'sign_up',
      'sign_in',
      'ai_interaction',
      'task_write',
      'lp_view',
      'lp_cta_click'
    )
  );
