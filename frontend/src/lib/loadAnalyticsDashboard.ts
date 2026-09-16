import { subDays, subHours } from 'date-fns';
import { supabase } from './supabase';
import type { AnalyticsEventRow, AnalyticsEventType, McpAnalyticsEventType } from '../types';

export type AnalyticsRange = '24h' | '7d' | '30d' | 'all';

const ANALYTICS_EVENT_COLUMNS = 'id, created_at, user_id, guest_session_id, event_type, metadata';

/** Product KPIs / charts — excludes landing A/B and MCP rows. */
export const PRODUCT_ANALYTICS_EVENT_TYPES: Exclude<AnalyticsEventType, McpAnalyticsEventType | 'lp_view' | 'lp_cta_click'>[] = [
  'sign_up',
  'sign_in',
  'ai_interaction',
  'task_write',
];

const LANDING_ANALYTICS_EVENT_TYPES: AnalyticsEventType[] = ['lp_view', 'lp_cta_click'];

/**
 * PostgREST/Supabase caps a single response (default 1000 rows). Requesting
 * `.limit(50000)` does not raise that cap, so one newest-first query is
 * dominated by high-volume MCP session/auth rows and hides product metrics.
 * Page with `.range()` and split by event type instead.
 */
const PAGE_SIZE = 1000;
const MAX_PAGES = 100;

export type ProductAnalyticsEventType = (typeof PRODUCT_ANALYTICS_EVENT_TYPES)[number];

export type AnalyticsDashboardData = {
  productEvents: AnalyticsEventRow[];
  productCounts: Record<ProductAnalyticsEventType, number>;
  lpEvents: AnalyticsEventRow[];
  mcpToolCalls: AnalyticsEventRow[];
  mcpSessions: AnalyticsEventRow[];
  mcpAuthFailures: AnalyticsEventRow[];
  mcpRecent: AnalyticsEventRow[];
  mcpCounts: Record<McpAnalyticsEventType, number>;
};

export const EMPTY_ANALYTICS_DASHBOARD: AnalyticsDashboardData = {
  productEvents: [],
  productCounts: {
    sign_up: 0,
    sign_in: 0,
    ai_interaction: 0,
    task_write: 0,
  },
  lpEvents: [],
  mcpToolCalls: [],
  mcpSessions: [],
  mcpAuthFailures: [],
  mcpRecent: [],
  mcpCounts: {
    mcp_tool_call: 0,
    mcp_auth_failure: 0,
    mcp_session: 0,
  },
};

function createdAtLowerBound(range: AnalyticsRange): string | null {
  if (range === 'all') return null;
  if (range === '24h') return subHours(new Date(), 24).toISOString();
  if (range === '7d') return subDays(new Date(), 7).toISOString();
  return subDays(new Date(), 30).toISOString();
}

async function fetchEventRowsByTypes(
  eventTypes: readonly AnalyticsEventType[],
  range: AnalyticsRange,
  maxRows?: number,
): Promise<AnalyticsEventRow[]> {
  const since = createdAtLowerBound(range);
  const rows: AnalyticsEventRow[] = [];
  let from = 0;
  const pageLimit = maxRows != null ? Math.min(PAGE_SIZE, maxRows) : PAGE_SIZE;
  const pageBudget = maxRows != null ? Math.ceil(maxRows / pageLimit) : MAX_PAGES;

  for (let page = 0; page < pageBudget; page++) {
    const to = from + pageLimit - 1;
    let query = supabase
      .from('analytics_events')
      .select(ANALYTICS_EVENT_COLUMNS)
      .in('event_type', [...eventTypes]);
    if (since) query = query.gte('created_at', since);
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw new Error(error.message);

    const pageRows = (data ?? []) as AnalyticsEventRow[];
    if (pageRows.length === 0) break;
    rows.push(...pageRows);
    from += pageRows.length;
    if (maxRows != null && rows.length >= maxRows) {
      return rows.slice(0, maxRows);
    }
  }

  return rows;
}

async function countEventsByType(
  eventType: AnalyticsEventType,
  range: AnalyticsRange,
): Promise<number> {
  const since = createdAtLowerBound(range);
  let query = supabase
    .from('analytics_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_type', eventType);
  if (since) query = query.gte('created_at', since);

  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

function newestMcpEvents(
  toolCalls: AnalyticsEventRow[],
  sessions: AnalyticsEventRow[],
  authFailures: AnalyticsEventRow[],
  limit: number,
): AnalyticsEventRow[] {
  return [...toolCalls, ...sessions, ...authFailures]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0))
    .slice(0, limit);
}

export async function loadAnalyticsDashboard(range: AnalyticsRange): Promise<AnalyticsDashboardData> {
  const [
    productEvents,
    lpEvents,
    mcpToolCalls,
    mcpSessions,
    mcpAuthFailures,
    signUpCount,
    signInCount,
    aiCount,
    taskWriteCount,
    mcpToolCount,
    mcpSessionCount,
    mcpAuthCount,
  ] = await Promise.all([
    fetchEventRowsByTypes(PRODUCT_ANALYTICS_EVENT_TYPES, range),
    fetchEventRowsByTypes(LANDING_ANALYTICS_EVENT_TYPES, range),
    fetchEventRowsByTypes(['mcp_tool_call'], range),
    fetchEventRowsByTypes(['mcp_session'], range),
    fetchEventRowsByTypes(['mcp_auth_failure'], range),
    countEventsByType('sign_up', range),
    countEventsByType('sign_in', range),
    countEventsByType('ai_interaction', range),
    countEventsByType('task_write', range),
    countEventsByType('mcp_tool_call', range),
    countEventsByType('mcp_session', range),
    countEventsByType('mcp_auth_failure', range),
  ]);

  return {
    productEvents,
    productCounts: {
      sign_up: signUpCount,
      sign_in: signInCount,
      ai_interaction: aiCount,
      task_write: taskWriteCount,
    },
    lpEvents,
    mcpToolCalls,
    mcpSessions,
    mcpAuthFailures,
    mcpRecent: newestMcpEvents(mcpToolCalls, mcpSessions, mcpAuthFailures, 20),
    mcpCounts: {
      mcp_tool_call: mcpToolCount,
      mcp_session: mcpSessionCount,
      mcp_auth_failure: mcpAuthCount,
    },
  };
}

export function analyticsDashboardUserIds(data: AnalyticsDashboardData): string[] {
  const ids = new Set<string>();
  for (const e of [
    ...data.productEvents,
    ...data.mcpToolCalls,
    ...data.mcpSessions,
    ...data.mcpAuthFailures,
    ...data.mcpRecent,
  ]) {
    if (e.user_id) ids.add(e.user_id);
  }
  return [...ids];
}
