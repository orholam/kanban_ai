-- MCP server analytics: tool invocations and auth failures.

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
      'lp_cta_click',
      'mcp_tool_call',
      'mcp_auth_failure',
      'mcp_session'
    )
  );
