-- Document semantics: task_write count = one analytics row per tasks row touched (INSERT/UPDATE/DELETE).

COMMENT ON TRIGGER trg_tasks_analytics_write ON public.tasks IS
  'After each INSERT, UPDATE, or DELETE on public.tasks, inserts one analytics_events row (event_type=task_write) with metadata.op = TG_OP. FOR EACH ROW: e.g. three new tasks in one INSERT statement yield three events; one status change is one UPDATE and one event; editing description on another row is another event.';

COMMENT ON FUNCTION public.trg_analytics_on_task_write() IS
  'Row-level AFTER trigger on tasks; one task_write analytics event per affected row.';
