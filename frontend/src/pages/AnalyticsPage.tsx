import React, { useEffect, useMemo, useState } from 'react';
import { eachDayOfInterval, eachHourOfInterval, eachMonthOfInterval, eachYearOfInterval, format, startOfHour, startOfMonth, startOfYear, subDays, subHours } from 'date-fns';
import { BarChart3, CalendarRange, Eye, MousePointerClick, Sparkles, LogIn, UserPlus, ListTodo, Plug, ShieldAlert, Activity, Users, Repeat, UserCheck, Bot } from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { landingAbVersionFromMetadata, LANDING_AB_TEST_VERSION } from '../lib/landingAbTest';
import {
  analyticsDashboardUserIds,
  EMPTY_ANALYTICS_DASHBOARD,
  loadAnalyticsDashboard,
  PRODUCT_ANALYTICS_EVENT_TYPES,
  type AnalyticsDashboardData,
  type AnalyticsRange,
} from '../lib/loadAnalyticsDashboard';
import { summarizeMcpAudience, uniqueMcpUsersByDay } from '../lib/mcpAnalyticsInsights';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { isLocalAppMode } from '../lib/localApp';
import type { AnalyticsEventRow, AnalyticsEventType, McpAnalyticsEventType } from '../types';
import { MCP_ANALYTICS_EVENT_TYPES } from '../types';

const MCP_EVENT_LABELS: Record<McpAnalyticsEventType, string> = {
  mcp_tool_call: 'Tool calls',
  mcp_auth_failure: 'Auth failures',
  mcp_session: 'Sessions',
};

const MCP_EVENT_COLORS: Record<McpAnalyticsEventType, { fill: string; soft: string }> = {
  mcp_tool_call: { fill: 'rgb(20 184 166)', soft: 'rgba(20, 184, 166, 0.2)' },
  mcp_auth_failure: { fill: 'rgb(239 68 68)', soft: 'rgba(239, 68, 68, 0.2)' },
  mcp_session: { fill: 'rgb(14 165 233)', soft: 'rgba(14, 165, 233, 0.2)' },
};

function isMcpEventType(value: string): value is McpAnalyticsEventType {
  return (MCP_ANALYTICS_EVENT_TYPES as readonly string[]).includes(value);
}

const EVENT_LABELS: Record<Exclude<AnalyticsEventType, McpAnalyticsEventType>, string> = {
  sign_up: 'Sign-ups',
  sign_in: 'Sign-ins',
  ai_interaction: 'AI interactions',
  task_write: 'Task writes',
  lp_view: 'Landing views',
  lp_cta_click: 'CTA clicks',
};

/** Only product events are shown in the KPI tiles and charts. */
const EVENT_ORDER = PRODUCT_ANALYTICS_EVENT_TYPES;

const EVENT_ICONS: Record<Exclude<AnalyticsEventType, McpAnalyticsEventType>, React.ElementType> = {
  sign_up: UserPlus,
  sign_in: LogIn,
  ai_interaction: Sparkles,
  task_write: ListTodo,
  lp_view: Eye,
  lp_cta_click: MousePointerClick,
};

/** Distinct bar colors per event type (Tailwind-ish, inline for SVG/CSS). */
const EVENT_COLORS: Record<Exclude<AnalyticsEventType, McpAnalyticsEventType>, { fill: string; soft: string }> = {
  sign_up: { fill: 'rgb(34 197 94)', soft: 'rgba(34, 197, 94, 0.2)' },
  sign_in: { fill: 'rgb(59 130 246)', soft: 'rgba(59, 130, 246, 0.2)' },
  ai_interaction: { fill: 'rgb(139 92 246)', soft: 'rgba(139, 92, 246, 0.2)' },
  task_write: { fill: 'rgb(245 158 11)', soft: 'rgba(245, 158, 11, 0.2)' },
  lp_view: { fill: 'rgb(99 102 241)', soft: 'rgba(99, 102, 241, 0.2)' },
  lp_cta_click: { fill: 'rgb(236 72 153)', soft: 'rgba(236, 72, 153, 0.2)' },
};

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

type VolumeGranularity = 'day' | 'month' | 'year';

function buildVolumeOverTimeSeries(
  events: { created_at: string }[],
  range: AnalyticsRange,
  granularity: VolumeGranularity,
): { day: string; label: string; count: number }[] {
  const byBucket: Record<string, number> = {};

  if (range === '24h') {
    const end = startOfHour(new Date());
    const start = subHours(end, 23);
    const hours = eachHourOfInterval({ start, end });
    for (const e of events) {
      const ts = new Date(e.created_at);
      ts.setMinutes(0, 0, 0);
      const key = format(ts, "yyyy-MM-dd'T'HH:00");
      byBucket[key] = (byBucket[key] ?? 0) + 1;
    }
    return hours.map((h) => {
      const key = format(h, "yyyy-MM-dd'T'HH:00");
      return { day: key, label: format(h, 'ha'), count: byBucket[key] ?? 0 };
    });
  }

  const now = new Date();
  const oldestInRange = events.length ? events[events.length - 1].created_at : now.toISOString();
  const rangeStart =
    range === 'all'
      ? new Date(dayKey(oldestInRange))
      : range === '7d'
        ? subDays(now, 6)
        : subDays(now, 29);

  let bucketDates: Date[];
  let bucketKey: (d: Date) => string;
  let bucketLabel: (d: Date) => string;
  let eventKey: (iso: string) => string;

  if (granularity === 'day') {
    const end = new Date(now);
    end.setHours(0, 0, 0, 0);
    const start = new Date(rangeStart);
    start.setHours(0, 0, 0, 0);
    bucketDates = eachDayOfInterval({ start, end });
    bucketKey = (d) => format(d, 'yyyy-MM-dd');
    bucketLabel = (d) => format(d, 'MMM d');
    eventKey = (iso) => iso.slice(0, 10);
  } else if (granularity === 'month') {
    bucketDates = eachMonthOfInterval({ start: startOfMonth(rangeStart), end: startOfMonth(now) });
    bucketKey = (d) => format(d, 'yyyy-MM');
    bucketLabel = (d) => format(d, 'MMM yyyy');
    eventKey = (iso) => iso.slice(0, 7);
  } else {
    bucketDates = eachYearOfInterval({ start: startOfYear(rangeStart), end: startOfYear(now) });
    bucketKey = (d) => format(d, 'yyyy');
    bucketLabel = (d) => format(d, 'yyyy');
    eventKey = (iso) => iso.slice(0, 4);
  }

  for (const e of events) {
    const k = eventKey(e.created_at);
    byBucket[k] = (byBucket[k] ?? 0) + 1;
  }

  return bucketDates.map((d) => {
    const key = bucketKey(d);
    return { day: key, label: bucketLabel(d), count: byBucket[key] ?? 0 };
  });
}

function mcpChartBuckets(
  range: AnalyticsRange,
  events: { created_at: string }[],
): { key: string; label: string }[] {
  if (range === '24h') {
    const end = startOfHour(new Date());
    const start = subHours(end, 23);
    return eachHourOfInterval({ start, end }).map((h) => ({
      key: format(h, "yyyy-MM-dd'T'HH:00"),
      label: format(h, 'ha'),
    }));
  }

  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const oldest = events.length ? events.reduce((min, e) => (e.created_at < min ? e.created_at : min), events[0].created_at) : null;
  const inferredStart =
    range === 'all'
      ? oldest
        ? new Date(dayKey(oldest))
        : end
      : range === '7d'
        ? subDays(end, 6)
        : subDays(end, 29);
  return eachDayOfInterval({ start: inferredStart, end }).map((d) => ({
    key: format(d, 'yyyy-MM-dd'),
    label: format(d, 'MMM d'),
  }));
}

function mcpEventBucketKey(iso: string, range: AnalyticsRange): string {
  if (range === '24h') {
    const ts = new Date(iso);
    ts.setMinutes(0, 0, 0);
    return format(ts, "yyyy-MM-dd'T'HH:00");
  }
  return iso.slice(0, 10);
}

function volumeGranularityLabel(granularity: VolumeGranularity): string {
  if (granularity === 'day') return 'day';
  if (granularity === 'month') return 'month';
  return 'year';
}

function labelForProfileRow(p: {
  display_name: string | null;
  full_name: string | null;
  name: string | null;
  username: string | null;
  id: string;
}): string {
  const s =
    p.display_name?.trim() ||
    p.full_name?.trim() ||
    p.name?.trim() ||
    p.username?.trim();
  return s || p.id.slice(0, 8);
}

function mcpEventUserLabel(
  e: AnalyticsEventRow,
  nameByUserId: Record<string, string>
): string {
  if (e.user_id) {
    return nameByUserId[e.user_id] ?? e.user_id.slice(0, 8);
  }

  const attemptedEmail =
    typeof e.metadata?.attempted_email === 'string' ? e.metadata.attempted_email.trim() : '';
  if (attemptedEmail) return attemptedEmail;

  const fingerprint =
    typeof e.metadata?.token_fingerprint === 'string'
      ? e.metadata.token_fingerprint
      : e.guest_session_id && e.guest_session_id !== 'mcp_auth_failure'
        ? e.guest_session_id
        : null;
  if (fingerprint) return `token:${fingerprint.slice(0, 8)}`;

  return 'Unknown';
}

function DailyVolumeChart({
  series,
  isDarkMode,
  granularityLabel = 'period',
}: {
  series: { day: string; label: string; count: number }[];
  isDarkMode: boolean;
  granularityLabel?: string;
}) {
  const w = 480;
  const h = 160;
  const padL = 36;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const n = series.length;
  const max = useMemo(() => Math.max(...series.map((s) => s.count), 1), [series]);

  const coords = useMemo(() => {
    if (n === 0) return [] as { x: number; y: number; count: number; label: string; day: string }[];
    return series.map((s, i) => {
      const x = padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
      const y = padT + (1 - s.count / max) * innerH;
      return { x, y, count: s.count, label: s.label, day: s.day };
    });
  }, [series, n, max, innerW, innerH]);

  const areaD = useMemo(() => {
    if (coords.length === 0) return '';
    const baseY = padT + innerH;
    const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    const close = ` L ${coords[coords.length - 1].x} ${baseY} L ${coords[0].x} ${baseY} Z`;
    return line + close;
  }, [coords, innerH, padT]);

  const lineD = useMemo(() => {
    if (coords.length === 0) return '';
    return coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  }, [coords]);

  const gridStroke = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(24,24,27,0.08)';
  const axisColor = isDarkMode ? 'rgba(161,161,170,0.7)' : 'rgba(82,82,91,0.85)';
  const stroke = isDarkMode ? 'rgb(129 140 248)' : 'rgb(79 70 229)';
  const fill = isDarkMode ? 'rgba(129, 140, 248, 0.18)' : 'rgba(99, 102, 241, 0.15)';

  if (n === 0) {
    return (
      <p className={`py-8 text-center text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
        No {granularityLabel} data in this range.
      </p>
    );
  }

  const tickIdx =
    n <= 7 ? series.map((_, i) => i) : [0, Math.floor(n / 2), n - 1].filter((i, j, a) => a.indexOf(i) === j);

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-44 w-full max-h-[11rem]"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Event counts per ${granularityLabel}, max ${max} in this range`}
      >
        <line x1={padL} y1={padT + innerH} x2={w - padR} y2={padT + innerH} stroke={gridStroke} strokeWidth={1} />
        <line x1={padL} y1={padT + innerH * 0.5} x2={w - padR} y2={padT + innerH * 0.5} stroke={gridStroke} strokeDasharray="4 6" />
        <line x1={padL} y1={padT} x2={w - padR} y2={padT} stroke={gridStroke} strokeDasharray="4 6" />
        <text x={4} y={padT + 4} fill={axisColor} fontSize={10} className="tabular-nums">
          {max}
        </text>
        <text x={4} y={padT + innerH * 0.5 + 4} fill={axisColor} fontSize={10} className="tabular-nums">
          {Math.round(max / 2)}
        </text>
        <text x={4} y={padT + innerH + 4} fill={axisColor} fontSize={10}>
          0
        </text>
        <path d={areaD} fill={fill} stroke="none" />
        <path d={lineD} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c) => (
          <circle key={c.day} cx={c.x} cy={c.y} r={4} fill={stroke} className="cursor-crosshair">
            <title>{`${c.count} events — ${c.day}`}</title>
          </circle>
        ))}
        {tickIdx.map((i) => {
          const c = coords[i];
          if (!c) return null;
          return (
            <text
              key={c.day}
              x={c.x}
              y={h - 6}
              textAnchor="middle"
              fill={axisColor}
              fontSize={10}
            >
              {c.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function AnalyticsPage({ isDarkMode }: { isDarkMode: boolean }) {
  const { user, accountProfile, profileLoading } = useAuth();
  const [range, setRange] = useState<AnalyticsRange>('7d');
  const [volumeGranularity, setVolumeGranularity] = useState<VolumeGranularity>('day');
  const [selectedSubject, setSelectedSubject] = useState<{ kind: 'user' | 'guest'; id: string } | null>(null);
  const [dashboard, setDashboard] = useState<AnalyticsDashboardData>(EMPTY_ANALYTICS_DASHBOARD);
  const [nameByUserId, setNameByUserId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLocalAppMode()) {
      setDashboard(EMPTY_ANALYTICS_DASHBOARD);
      setNameByUserId({});
      setLoading(false);
      return;
    }
    if (!user) {
      setDashboard(EMPTY_ANALYTICS_DASHBOARD);
      setNameByUserId({});
      setLoading(false);
      return;
    }
    if (profileLoading) {
      setLoading(true);
      return;
    }
    if (accountProfile?.account_role !== 'owner') {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      let data: AnalyticsDashboardData;
      try {
        data = await loadAnalyticsDashboard(range);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        setDashboard(EMPTY_ANALYTICS_DASHBOARD);
        setNameByUserId({});
        setLoading(false);
        return;
      }

      if (cancelled) return;

      setDashboard(data);

      const ids = analyticsDashboardUserIds(data);
      if (ids.length === 0) {
        setNameByUserId({});
        setLoading(false);
        return;
      }

      const map: Record<string, string> = {};
      const chunkSize = 100;
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const { data: profs, error: pErr } = await supabase
          .from('profiles')
          .select('id, display_name, full_name, name, username')
          .in('id', chunk);

        if (cancelled) return;

        if (pErr) {
          console.warn('Analytics profiles:', pErr.message);
          for (const id of ids) {
            if (!map[id]) map[id] = id.slice(0, 8);
          }
          setNameByUserId(map);
          setLoading(false);
          return;
        }

        for (const p of profs ?? []) {
          const row = p as {
            id: string;
            display_name: string | null;
            full_name: string | null;
            name: string | null;
            username: string | null;
          };
          map[row.id] = labelForProfileRow(row);
        }
      }
      for (const id of ids) {
        if (!map[id]) map[id] = id.slice(0, 8);
      }
      setNameByUserId(map);
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [user, profileLoading, accountProfile?.account_role, range]);

  const productEvents = dashboard.productEvents;

  const filteredEvents = useMemo(() => {
    if (!selectedSubject) return productEvents;
    if (selectedSubject.kind === 'user') {
      return productEvents.filter((e) => e.user_id === selectedSubject.id);
    }
    return productEvents.filter((e) => (e.guest_session_id ?? '').trim() === selectedSubject.id);
  }, [productEvents, selectedSubject]);

  /** A/B test metrics for the current experiment version only (see `landingAbTest.ts`). */
  const abTestData = useMemo(() => {
    const byVariant: Record<'A' | 'B', { views: number; clicks: number }> = {
      A: { views: 0, clicks: 0 },
      B: { views: 0, clicks: 0 },
    };
    for (const e of dashboard.lpEvents) {
      if (e.event_type !== 'lp_view' && e.event_type !== 'lp_cta_click') continue;
      if (landingAbVersionFromMetadata(e.metadata) !== LANDING_AB_TEST_VERSION) continue;
      const v = (e.metadata?.variant as string) as 'A' | 'B' | undefined;
      if (v !== 'A' && v !== 'B') continue;
      if (e.event_type === 'lp_view') byVariant[v].views++;
      else if (e.event_type === 'lp_cta_click') byVariant[v].clicks++;
    }
    return byVariant;
  }, [dashboard.lpEvents]);

  const totalsByType = useMemo(() => {
    if (!selectedSubject) return dashboard.productCounts;
    const m: Partial<Record<AnalyticsEventType, number>> = {};
    for (const e of filteredEvents) {
      const t = e.event_type as AnalyticsEventType;
      m[t] = (m[t] ?? 0) + 1;
    }
    return m;
  }, [dashboard.productCounts, filteredEvents, selectedSubject]);

  const totalEvents = useMemo(() => {
    if (!selectedSubject) {
      return EVENT_ORDER.reduce((sum, key) => sum + dashboard.productCounts[key], 0);
    }
    return filteredEvents.length;
  }, [dashboard.productCounts, filteredEvents.length, selectedSubject]);

  const eventTypeMax = useMemo(
    () => Math.max(...EVENT_ORDER.map((k) => totalsByType[k] ?? 0), 1),
    [totalsByType]
  );

  /** Aggregated by signed-in user or guest browser session (product events only). */
  const topSubjects = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of productEvents) {
      const key = e.user_id
        ? `user:${e.user_id}`
        : `guest:${(e.guest_session_id ?? '').trim() || 'unknown'}`;
      m[key] = (m[key] ?? 0) + 1;
    }
    return Object.entries(m)
      .map(([composite, count]) => {
        if (composite.startsWith('user:')) {
          return { kind: 'user' as const, id: composite.slice(5), count };
        }
        return { kind: 'guest' as const, id: composite.slice(6), count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [productEvents]);

  const topSubjectMax = useMemo(
    () => Math.max(...topSubjects.map((u) => u.count), 1),
    [topSubjects]
  );

  const dailySeries = useMemo(
    () => buildVolumeOverTimeSeries(filteredEvents, range, volumeGranularity),
    [filteredEvents, range, volumeGranularity],
  );

  /** Non-zero segments with percentages that sum to 100% of activity (for donut). */
  const typeSegments = useMemo(() => {
    if (totalEvents === 0) return [] as { key: AnalyticsEventType; count: number; pct: number }[];
    return EVENT_ORDER.map((key) => {
      const count = totalsByType[key] ?? 0;
      return { key, count, pct: (count / totalEvents) * 100 };
    }).filter((s) => s.count > 0);
  }, [totalsByType, totalEvents]);

  let cumulative = 0;
  const donutSegments = typeSegments.map((s) => {
    const start = cumulative;
    cumulative += s.pct;
    return { ...s, start, end: cumulative };
  });

  const mcpToolCalls = dashboard.mcpToolCalls;
  const mcpCountsByType = dashboard.mcpCounts;
  const mcpEventTotal =
    mcpCountsByType.mcp_tool_call + mcpCountsByType.mcp_session + mcpCountsByType.mcp_auth_failure;

  const mcpToolSuccessCount = useMemo(
    () => mcpToolCalls.filter((e) => e.metadata?.success === true).length,
    [mcpToolCalls],
  );

  const mcpToolErrorCount = useMemo(
    () => mcpToolCalls.filter((e) => e.metadata?.success === false).length,
    [mcpToolCalls],
  );

  const mcpToolSuccessRate = useMemo(() => {
    if (mcpToolCalls.length === 0) return null;
    return ((mcpToolSuccessCount / mcpToolCalls.length) * 100).toFixed(1);
  }, [mcpToolCalls.length, mcpToolSuccessCount]);

  const mcpToolCounts = useMemo(() => {
    const m: Record<string, { total: number; success: number; error: number }> = {};
    for (const e of mcpToolCalls) {
      const name = typeof e.metadata?.tool_name === 'string' ? e.metadata.tool_name : 'unknown';
      if (!m[name]) m[name] = { total: 0, success: 0, error: 0 };
      m[name].total++;
      if (e.metadata?.success === true) m[name].success++;
      else if (e.metadata?.success === false) m[name].error++;
    }
    return Object.entries(m)
      .map(([toolName, stats]) => ({ toolName, ...stats }))
      .sort((a, b) => b.total - a.total);
  }, [mcpToolCalls]);

  const mcpToolMax = useMemo(
    () => Math.max(...mcpToolCounts.map((t) => t.total), 1),
    [mcpToolCounts],
  );

  const recentMcpEvents = dashboard.mcpRecent;

  const mcpAudience = useMemo(
    () => summarizeMcpAudience(dashboard.mcpSessions, dashboard.mcpToolCalls, dashboard.mcpAuthFailures),
    [dashboard.mcpSessions, dashboard.mcpToolCalls, dashboard.mcpAuthFailures],
  );

  const mcpChartEvents = useMemo(
    () => [...dashboard.mcpToolCalls, ...dashboard.mcpSessions, ...dashboard.mcpAuthFailures],
    [dashboard.mcpToolCalls, dashboard.mcpSessions, dashboard.mcpAuthFailures],
  );

  const mcpDailySeries = useMemo(() => {
    const buckets = mcpChartBuckets(range, mcpChartEvents);
    const byBucket: Record<string, number> = {};
    for (const e of mcpToolCalls) {
      const k = mcpEventBucketKey(e.created_at, range);
      byBucket[k] = (byBucket[k] ?? 0) + 1;
    }
    return buckets.map((b) => ({ day: b.key, label: b.label, count: byBucket[b.key] ?? 0 }));
  }, [mcpToolCalls, mcpChartEvents, range]);

  const mcpUniqueUserSeries = useMemo(() => {
    const buckets = mcpChartBuckets(range, mcpChartEvents);
    const usersByBucket: Record<string, Set<string>> = {};
    for (const point of uniqueMcpUsersByDay(dashboard.mcpSessions, dashboard.mcpToolCalls)) {
      const k = mcpEventBucketKey(point.created_at, range);
      if (!usersByBucket[k]) usersByBucket[k] = new Set();
      usersByBucket[k].add(point.userId);
    }
    return buckets.map((b) => ({
      day: b.key,
      label: b.label,
      count: usersByBucket[b.key]?.size ?? 0,
    }));
  }, [dashboard.mcpSessions, dashboard.mcpToolCalls, mcpChartEvents, range]);

  const shell = isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900';
  const panel = isDarkMode
    ? 'rounded-2xl border border-zinc-800/80 bg-zinc-900/50'
    : 'rounded-2xl border border-zinc-200/90 bg-white';
  const muted = isDarkMode ? 'text-zinc-400' : 'text-zinc-600';

  if (isLocalAppMode()) {
    return <Navigate to="/kanban" replace />;
  }

  return (
    <>
      <SEO
        title="Analytics — Kanban AI"
        description="Product usage overview for operators."
        noindex
      />
      <div className={`min-h-0 flex-1 overflow-y-auto ${shell}`}>
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <BarChart3 className={`h-8 w-8 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
              </div>
              <p className={`max-w-xl text-sm ${muted}`}>
                Usage from signed-in users (non-owner), guest activity on the board, AI sidebar, and task writes for
                saved projects. All guest events are combined into one bucket (not tracked per visitor). Message content
                is not stored.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CalendarRange className={`h-4 w-4 ${muted}`} aria-hidden />
              <label className="sr-only" htmlFor="analytics-range">
                Date range
              </label>
              <select
                id="analytics-range"
                value={range}
                onChange={(e) => setRange(e.target.value as AnalyticsRange)}
                className={
                  isDarkMode
                    ? 'rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100'
                    : 'rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900'
                }
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>

          {error ? (
            <div
              className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                isDarkMode
                  ? 'border-red-900/60 bg-red-950/40 text-red-200'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className={`flex justify-center py-16 ${muted}`}>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {EVENT_ORDER.map((key) => {
                  const n = totalsByType[key] ?? 0;
                  const Icon = EVENT_ICONS[key];
                  const colors = EVENT_COLORS[key];
                  return (
                    <div
                      key={key}
                      className={`relative overflow-hidden rounded-2xl border p-4 ${
                        isDarkMode
                          ? 'border-zinc-800/80 bg-zinc-900/60'
                          : 'border-zinc-200/90 bg-white shadow-sm shadow-zinc-950/[0.02]'
                      }`}
                    >
                      <div
                        className={`pointer-events-none absolute inset-x-0 bottom-0 h-0.5 ${
                          isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'
                        }`}
                      >
                        <div
                          className="h-full rounded-r"
                          style={{
                            width: `${eventTypeMax ? (n / eventTypeMax) * 100 : 0}%`,
                            backgroundColor: colors.fill,
                          }}
                        />
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: colors.soft }}
                        >
                          <Icon className="h-4 w-4" style={{ color: colors.fill }} aria-hidden />
                        </div>
                      </div>
                      <p className={`mt-3 text-2xl font-semibold tabular-nums tracking-tight`}>{n}</p>
                      <p className={`mt-0.5 text-xs font-medium uppercase tracking-wide ${muted}`}>
                        {EVENT_LABELS[key]}
                      </p>
                    </div>
                  );
                })}
              </div>

              <section className={`p-6 ${panel}`}>
                <div className="mb-5 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h2 className="text-sm font-semibold uppercase tracking-wide">Landing page A/B test</h2>
                      <span
                        className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums ${
                          isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700'
                        }`}
                        title="Matches events tagged with this experiment version"
                      >
                        v{LANDING_AB_TEST_VERSION}
                      </span>
                    </div>
                    <p className={`mt-1 text-xs ${muted}`}>
                      Conversion = CTA clicks ÷ page views. Range filter applies. Only events for this version are
                      shown — bump{' '}
                      <code
                        className={`rounded px-1 py-0.5 font-mono text-[11px] ${
                          isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-800'
                        }`}
                      >
                        LANDING_AB_TEST_VERSION
                      </code>{' '}
                      in <code className={`rounded px-1 py-0.5 font-mono text-[11px] ${isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-800'}`}>landingAbTest.ts</code> when
                      you change variant copy or layout so older runs do not mix in.
                    </p>
                    <p className={`mt-2 text-xs leading-relaxed ${muted}`}>
                      <span className="font-medium text-zinc-500 dark:text-zinc-400">Preview without logging:</span>{' '}
                      open{' '}
                      <code
                        className={`rounded px-1 py-0.5 font-mono text-[11px] ${
                          isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-800'
                        }`}
                      >
                        /?variant=A
                      </code>{' '}
                      or{' '}
                      <code
                        className={`rounded px-1 py-0.5 font-mono text-[11px] ${
                          isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-800'
                        }`}
                      >
                        /?variant=B
                      </code>{' '}
                      (exact uppercase). Works while signed in; no landing views or CTA clicks are recorded.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(['A', 'B'] as const).map((v) => {
                    const d = abTestData[v];
                    const rate = d.views > 0 ? ((d.clicks / d.views) * 100).toFixed(1) : null;
                    const isWinner =
                      rate !== null &&
                      d.views > 0 &&
                      abTestData[v === 'A' ? 'B' : 'A'].views > 0 &&
                      d.clicks / d.views >
                        abTestData[v === 'A' ? 'B' : 'A'].clicks /
                          Math.max(abTestData[v === 'A' ? 'B' : 'A'].views, 1);
                    return (
                      <div
                        key={v}
                        className={`relative overflow-hidden rounded-xl p-4 ${
                          isDarkMode
                            ? isWinner
                              ? 'border border-indigo-500/40 bg-indigo-950/30'
                              : 'border border-zinc-700/60 bg-zinc-800/40'
                            : isWinner
                              ? 'border border-indigo-200 bg-indigo-50/60'
                              : 'border border-zinc-200 bg-zinc-50'
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold ${
                              isDarkMode ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-200 text-zinc-800'
                            }`}
                          >
                            {v}
                          </span>
                          {isWinner && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                isDarkMode
                                  ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/30'
                                  : 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200'
                              }`}
                            >
                              Leading
                            </span>
                          )}
                        </div>
                        <dl className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <dt className={`text-[10px] font-medium uppercase tracking-wide ${muted}`}>Views</dt>
                            <dd className="mt-1 text-xl font-semibold tabular-nums">{d.views}</dd>
                          </div>
                          <div>
                            <dt className={`text-[10px] font-medium uppercase tracking-wide ${muted}`}>Clicks</dt>
                            <dd className="mt-1 text-xl font-semibold tabular-nums">{d.clicks}</dd>
                          </div>
                          <div>
                            <dt className={`text-[10px] font-medium uppercase tracking-wide ${muted}`}>CVR</dt>
                            <dd
                              className={`mt-1 text-xl font-semibold tabular-nums ${
                                rate !== null
                                  ? isDarkMode
                                    ? 'text-indigo-300'
                                    : 'text-indigo-600'
                                  : ''
                              }`}
                            >
                              {rate !== null ? `${rate}%` : '—'}
                            </dd>
                          </div>
                        </dl>
                        {d.views > 0 && (
                          <div
                            className={`mt-3 h-1.5 overflow-hidden rounded-full ${
                              isDarkMode ? 'bg-zinc-700' : 'bg-zinc-200'
                            }`}
                          >
                            <div
                              className="h-full rounded-full bg-indigo-500 transition-[width] duration-500 ease-out"
                              style={{ width: `${Math.min(((d.clicks / d.views) * 100) * 4, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {abTestData.A.views === 0 && abTestData.B.views === 0 && (
                  <p className={`mt-4 text-sm ${muted}`}>
                    No landing page data yet. Views and CTA clicks will appear here once visitors hit the page.
                  </p>
                )}
              </section>

              <section className={`p-6 ${panel}`}>
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Plug className={`h-4 w-4 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} aria-hidden />
                      <h2 className="text-sm font-semibold uppercase tracking-wide">MCP server</h2>
                    </div>
                    <p className={`mt-1 text-xs ${muted}`}>
                      Remote MCP usage at <code className={`rounded px-1 py-0.5 font-mono text-[11px] ${isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-800'}`}>/api/mcp</code>.
                      Signed-in people are counted from sessions and tool calls. Unauthenticated probes are grouped by user-agent (scanners vs unknown). Repeat means activity on two or more days.
                    </p>
                    {mcpAudience.story ? (
                      <p className={`mt-3 max-w-3xl text-sm leading-relaxed ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                        {mcpAudience.story}
                      </p>
                    ) : null}
                  </div>
                  <p className={`text-xs tabular-nums ${muted}`}>{mcpEventTotal} MCP events in range</p>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(
                    [
                      { label: 'Signed-in people', value: mcpAudience.uniqueUsers, icon: Users, fill: 'rgb(20 184 166)', soft: 'rgba(20, 184, 166, 0.2)' },
                      { label: 'Repeat (2+ days)', value: mcpAudience.repeatUsers, icon: Repeat, fill: 'rgb(99 102 241)', soft: 'rgba(99, 102, 241, 0.2)' },
                      { label: 'Called tools', value: mcpAudience.engagedUsers, icon: UserCheck, fill: 'rgb(245 158 11)', soft: 'rgba(245, 158, 11, 0.2)' },
                      { label: 'Bot probes', value: mcpAudience.botProbes, icon: Bot, fill: 'rgb(239 68 68)', soft: 'rgba(239, 68, 68, 0.2)' },
                    ] as const
                  ).map(({ label, value, icon: Icon, fill, soft }) => (
                    <div
                      key={label}
                      className={`rounded-xl border p-4 ${
                        isDarkMode ? 'border-zinc-800/80 bg-zinc-900/60' : 'border-zinc-200/90 bg-zinc-50'
                      }`}
                    >
                      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: soft }}>
                        <Icon className="h-4 w-4" style={{ color: fill }} aria-hidden />
                      </div>
                      <p className="text-xl font-semibold tabular-nums">{value}</p>
                      <p className={`mt-0.5 text-[10px] font-medium uppercase tracking-wide ${muted}`}>{label}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(
                    [
                      { key: 'mcp_tool_call' as const, icon: Plug, value: mcpCountsByType.mcp_tool_call ?? 0 },
                      { key: 'mcp_session' as const, icon: Activity, value: mcpCountsByType.mcp_session ?? 0 },
                      { key: 'mcp_auth_failure' as const, icon: ShieldAlert, value: mcpCountsByType.mcp_auth_failure ?? 0 },
                    ] as const
                  ).map(({ key, icon: Icon, value }) => {
                    const colors = MCP_EVENT_COLORS[key];
                    return (
                      <div
                        key={key}
                        className={`rounded-xl border p-4 ${
                          isDarkMode ? 'border-zinc-800/80 bg-zinc-900/60' : 'border-zinc-200/90 bg-zinc-50'
                        }`}
                      >
                        <div
                          className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ backgroundColor: colors.soft }}
                        >
                          <Icon className="h-4 w-4" style={{ color: colors.fill }} aria-hidden />
                        </div>
                        <p className="text-xl font-semibold tabular-nums">{value}</p>
                        <p className={`mt-0.5 text-[10px] font-medium uppercase tracking-wide ${muted}`}>
                          {MCP_EVENT_LABELS[key]}
                        </p>
                      </div>
                    );
                  })}
                  <div
                    className={`rounded-xl border p-4 ${
                      isDarkMode ? 'border-zinc-800/80 bg-zinc-900/60' : 'border-zinc-200/90 bg-zinc-50'
                    }`}
                  >
                    <p className={`text-[10px] font-medium uppercase tracking-wide ${muted}`}>Tool success rate</p>
                    <p
                      className={`mt-2 text-xl font-semibold tabular-nums ${
                        mcpToolSuccessRate !== null
                          ? isDarkMode
                            ? 'text-teal-300'
                            : 'text-teal-700'
                          : ''
                      }`}
                    >
                      {mcpToolSuccessRate !== null ? `${mcpToolSuccessRate}%` : '—'}
                    </p>
                    <p className={`mt-1 text-xs tabular-nums ${muted}`}>
                      {mcpToolSuccessCount} ok · {mcpToolErrorCount} err
                    </p>
                  </div>
                </div>

                <div className="mb-6 grid gap-6 lg:grid-cols-2">
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide">Signed-in people</h3>
                    {mcpAudience.users.length === 0 ? (
                      <p className={`text-sm ${muted}`}>No signed-in MCP users in this window.</p>
                    ) : (
                      <div className={`overflow-x-auto rounded-xl border ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
                        <table className="min-w-full text-left text-xs">
                          <thead className={isDarkMode ? 'bg-zinc-900/80 text-zinc-400' : 'bg-zinc-50 text-zinc-600'}>
                            <tr>
                              <th className="px-3 py-2 font-medium">Person</th>
                              <th className="px-3 py-2 font-medium">Days</th>
                              <th className="px-3 py-2 font-medium">Sessions</th>
                              <th className="px-3 py-2 font-medium">Tools</th>
                              <th className="px-3 py-2 font-medium">Last seen</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mcpAudience.users.slice(0, 12).map((u) => (
                              <tr
                                key={u.userId}
                                className={isDarkMode ? 'border-t border-zinc-800/80' : 'border-t border-zinc-100'}
                              >
                                <td className="px-3 py-2">
                                  <div className="font-medium">{nameByUserId[u.userId] ?? u.userId.slice(0, 8)}</div>
                                  <div className={`font-mono text-[10px] ${muted}`}>{u.userId.slice(0, 8)}</div>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {u.repeat ? (
                                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${isDarkMode ? 'bg-indigo-500/15 text-indigo-200' : 'bg-indigo-50 text-indigo-800'}`}>
                                        Repeat
                                      </span>
                                    ) : (
                                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700'}`}>
                                        One day
                                      </span>
                                    )}
                                    {u.engaged ? (
                                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${isDarkMode ? 'bg-amber-500/15 text-amber-200' : 'bg-amber-50 text-amber-900'}`}>
                                        Tools
                                      </span>
                                    ) : (
                                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}>
                                        Session only
                                      </span>
                                    )}
                                    {u.clientFamily ? (
                                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${muted}`}>
                                        {u.clientFamily}
                                      </span>
                                    ) : null}
                                  </div>
                                </td>
                                <td className="px-3 py-2 tabular-nums">{u.daysActive}</td>
                                <td className="px-3 py-2 tabular-nums">{u.sessions}</td>
                                <td className="px-3 py-2 tabular-nums">
                                  {u.toolCalls}
                                  {u.toolCalls > 0 ? (
                                    <span className={muted}> ({u.toolSuccess} ok)</span>
                                  ) : null}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                                  {format(new Date(u.lastSeen), 'MMM d HH:mm')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {mcpAudience.users.length > 12 ? (
                          <p className={`px-3 py-2 text-[11px] ${muted}`}>
                            Showing 12 of {mcpAudience.users.length} people.
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide">Bot / scanner probes</h3>
                    {mcpAudience.botFamilies.length === 0 ? (
                      <p className={`text-sm ${muted}`}>
                        No scanner user-agents in this window
                        {mcpAudience.unknownAuthFailures > 0
                          ? ` (${mcpAudience.unknownAuthFailures} auth failures had no user-agent).`
                          : '.'}
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {mcpAudience.botFamilies.slice(0, 8).map((b) => (
                          <li key={b.family}>
                            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                              <span className="truncate font-mono text-xs">{b.family}</span>
                              <span className="shrink-0 tabular-nums font-semibold">{b.probes}</span>
                            </div>
                            <div className={`h-1.5 overflow-hidden rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                              <div
                                className="h-full rounded-full bg-red-500"
                                style={{
                                  width: `${(b.probes / Math.max(mcpAudience.botFamilies[0]?.probes ?? 1, 1)) * 100}%`,
                                }}
                              />
                            </div>
                            <p className={`mt-1 truncate text-[10px] ${muted}`}>
                              {b.fingerprints} distinct token{b.fingerprints === 1 ? '' : 's'} · last {format(new Date(b.lastSeen), 'MMM d HH:mm')}
                              {b.sampleUserAgent ? ` · ${b.sampleUserAgent.slice(0, 48)}` : ''}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                    {mcpAudience.authReasons.length > 0 ? (
                      <div className="mt-4">
                        <h4 className={`mb-2 text-[10px] font-semibold uppercase tracking-wide ${muted}`}>Auth failure reasons</h4>
                        <ul className="space-y-1">
                          {mcpAudience.authReasons.map((r) => (
                            <li key={r.reason} className="flex justify-between gap-2 text-xs">
                              <span className="truncate font-mono">{r.reason}</span>
                              <span className="tabular-nums">{r.count}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mb-6 grid gap-6 lg:grid-cols-2">
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide">Unique signed-in users</h3>
                    <p className={`mb-2 text-[11px] ${muted}`}>Distinct people with a session or tool call.</p>
                    <DailyVolumeChart
                      series={mcpUniqueUserSeries}
                      isDarkMode={isDarkMode}
                      granularityLabel={range === '24h' ? 'hour' : 'day'}
                    />
                  </div>
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide">MCP tool volume</h3>
                    <DailyVolumeChart series={mcpDailySeries} isDarkMode={isDarkMode} />
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide">Tool calls by name</h3>
                    {mcpToolCounts.length === 0 ? (
                      <p className={`text-sm ${muted}`}>No MCP tool calls in this window.</p>
                    ) : (
                      <ul className="space-y-3">
                        {mcpToolCounts.map(({ toolName, total, success, error }) => (
                          <li key={toolName}>
                            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                              <span className="truncate font-mono text-xs">{toolName}</span>
                              <span className="shrink-0 tabular-nums font-semibold">{total}</span>
                            </div>
                            <div
                              className={`h-1.5 overflow-hidden rounded-full ${
                                isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'
                              }`}
                            >
                              <div
                                className="h-full rounded-full bg-teal-500"
                                style={{ width: `${(total / mcpToolMax) * 100}%` }}
                              />
                            </div>
                            <p className={`mt-1 text-[10px] tabular-nums ${muted}`}>
                              {success} success · {error} error
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide">Recent MCP events</h3>
                  {recentMcpEvents.length === 0 ? (
                    <p className={`text-sm ${muted}`}>No MCP activity yet.</p>
                  ) : (
                    <div className={`overflow-x-auto rounded-xl border ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
                      <table className="min-w-full text-left text-xs">
                        <thead className={isDarkMode ? 'bg-zinc-900/80 text-zinc-400' : 'bg-zinc-50 text-zinc-600'}>
                          <tr>
                            <th className="px-3 py-2 font-medium">Time</th>
                            <th className="px-3 py-2 font-medium">Type</th>
                            <th className="px-3 py-2 font-medium">User</th>
                            <th className="px-3 py-2 font-medium">Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentMcpEvents.map((e) => {
                            const toolName =
                              typeof e.metadata?.tool_name === 'string' ? e.metadata.tool_name : null;
                            const reason =
                              typeof e.metadata?.reason === 'string' ? e.metadata.reason : null;
                            const durationMs =
                              typeof e.metadata?.duration_ms === 'number' ? e.metadata.duration_ms : null;
                            const success = e.metadata?.success;
                            return (
                              <tr
                                key={e.id}
                                className={isDarkMode ? 'border-t border-zinc-800/80' : 'border-t border-zinc-100'}
                              >
                                <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                                  {format(new Date(e.created_at), 'MMM d HH:mm')}
                                </td>
                                <td className="px-3 py-2">
                                  {isMcpEventType(e.event_type) ? MCP_EVENT_LABELS[e.event_type] : e.event_type}
                                </td>
                                <td className="px-3 py-2 font-mono">
                                  {mcpEventUserLabel(e, nameByUserId)}
                                </td>
                                <td className={`px-3 py-2 ${muted}`}>
                                  {toolName ? (
                                    <>
                                      <span className="font-mono">{toolName}</span>
                                      {success === true ? ' · ok' : success === false ? ' · error' : ''}
                                      {durationMs !== null ? ` · ${durationMs}ms` : ''}
                                      {typeof e.metadata?.error === 'string' ? ` · ${e.metadata.error}` : ''}
                                    </>
                                  ) : reason ? (
                                    <>
                                      reason: {reason}
                                      {typeof e.metadata?.token_fingerprint === 'string' &&
                                      !e.user_id &&
                                      !e.metadata?.attempted_email
                                        ? ` · token:${e.metadata.token_fingerprint.slice(0, 8)}`
                                        : ''}
                                      {typeof e.metadata?.user_agent === 'string'
                                        ? ` · ${e.metadata.user_agent.slice(0, 48)}`
                                        : ''}
                                    </>
                                  ) : typeof e.metadata?.method === 'string' ? (
                                    <>method: {e.metadata.method}</>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                </div>
              </section>

              <section className={`p-6 ${panel}`}>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wide">Volume over time</h2>
                    <p className={`mt-1 text-xs ${muted}`}>
                      {range === '24h'
                        ? 'Events per hour (chronological). Hover points for exact counts.'
                        : `Events per ${volumeGranularityLabel(volumeGranularity)} (chronological). Hover points for exact counts.`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className={`text-xs ${muted}`} htmlFor="analytics-volume-granularity">
                        Break down by
                      </label>
                      <select
                        id="analytics-volume-granularity"
                        value={volumeGranularity}
                        disabled={range === '24h'}
                        onChange={(e) => setVolumeGranularity(e.target.value as VolumeGranularity)}
                        title={range === '24h' ? 'Hourly buckets are used for the 24-hour range.' : undefined}
                        className={
                          isDarkMode
                            ? 'rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50'
                            : 'rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50'
                        }
                      >
                        <option value="day">Day</option>
                        <option value="month">Month</option>
                        <option value="year">Year</option>
                      </select>
                    </div>
                    <p className={`text-xs tabular-nums ${muted}`}>{totalEvents} events in range</p>
                  </div>
                </div>
                <DailyVolumeChart
                  series={dailySeries}
                  isDarkMode={isDarkMode}
                  granularityLabel={range === '24h' ? 'hour' : volumeGranularityLabel(volumeGranularity)}
                />
              </section>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className={`p-6 ${panel}`}>
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">Mix by type</h2>
                  {totalEvents === 0 ? (
                    <p className={`text-sm ${muted}`}>No events in this window.</p>
                  ) : (
                    <>
                      <div className="mb-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                        <div
                          className="relative flex h-28 w-28 shrink-0 items-center justify-center"
                          aria-hidden
                        >
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: donutSegments.length
                                ? `conic-gradient(${donutSegments
                                    .map((s) => `${EVENT_COLORS[s.key].fill} ${s.start}% ${s.end}%`)
                                    .join(', ')})`
                                : isDarkMode
                                  ? 'rgb(39 39 42)'
                                  : 'rgb(228 228 231)',
                            }}
                          />
                          <div
                            className={`relative z-10 flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full ${
                              isDarkMode
                                ? 'border border-zinc-700/80 bg-zinc-900 shadow-inner'
                                : 'border border-zinc-200/90 bg-white shadow-sm'
                            }`}
                          >
                            <span className="text-sm font-semibold tabular-nums">{totalEvents}</span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 space-y-2 sm:pl-2">
                          {typeSegments.map((s) => (
                            <div key={s.key} className="flex items-center justify-between gap-2 text-sm">
                              <span className="flex items-center gap-2 truncate">
                                <span
                                  className="h-2 w-2 shrink-0 rounded-full"
                                  style={{ backgroundColor: EVENT_COLORS[s.key].fill }}
                                />
                                <span className="truncate">{EVENT_LABELS[s.key]}</span>
                              </span>
                              <span className={`shrink-0 tabular-nums ${muted}`}>
                                {s.count}{' '}
                                <span className="opacity-70">({s.pct.toFixed(0)}%)</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        {EVENT_ORDER.map((key) => {
                          const n = totalsByType[key] ?? 0;
                          const pct = eventTypeMax ? (n / eventTypeMax) * 100 : 0;
                          return (
                            <div key={key}>
                              <div className="mb-1 flex justify-between text-xs">
                                <span className={muted}>{EVENT_LABELS[key]}</span>
                                <span className="font-medium tabular-nums">{n}</span>
                              </div>
                              <div
                                className={`h-2 overflow-hidden rounded-full ${
                                  isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'
                                }`}
                              >
                                <div
                                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: EVENT_COLORS[key].fill,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </section>

                <section className={`p-6 ${panel}`}>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold uppercase tracking-wide">Top users &amp; guests</h2>
                    {selectedSubject ? (
                      <button
                        type="button"
                        onClick={() => setSelectedSubject(null)}
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          isDarkMode
                            ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                        }`}
                      >
                        Clear person filter
                      </button>
                    ) : null}
                  </div>
                  {topSubjects.length === 0 ? (
                    <p className={`text-sm ${muted}`}>No events in this window.</p>
                  ) : (
                    <ul className="space-y-3">
                      {topSubjects.map(({ kind, id, count }) => {
                        const pct = (count / topSubjectMax) * 100;
                        const rowKey = kind === 'user' ? `user:${id}` : `guest:${id}`;
                        return (
                          <li key={rowKey}>
                            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                              <span className="min-w-0 flex-1 truncate">
                                <span className="flex flex-wrap items-center gap-2">
                                  {kind === 'guest' ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedSubject({ kind: 'guest', id })}
                                        className="font-medium underline-offset-2 hover:underline"
                                      >
                                        Guest {id.slice(0, 8)}
                                      </button>
                                      <span
                                        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                          isDarkMode
                                            ? 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/25'
                                            : 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80'
                                        }`}
                                      >
                                        Browser
                                      </span>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedSubject({ kind: 'user', id })}
                                      className="font-medium underline-offset-2 hover:underline"
                                    >
                                      {nameByUserId[id] ?? id.slice(0, 8)}
                                    </button>
                                  )}
                                </span>
                                <span className={`mt-0.5 block truncate font-mono text-[10px] ${muted}`}>
                                  {id}
                                </span>
                              </span>
                              <span className="shrink-0 tabular-nums font-semibold">{count}</span>
                            </div>
                            <div
                              className={`h-1.5 overflow-hidden rounded-full ${
                                isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'
                              }`}
                            >
                              <div
                                className={`h-full rounded-full ${
                                  kind === 'guest'
                                    ? isDarkMode
                                      ? 'bg-amber-500/70'
                                      : 'bg-amber-500'
                                    : isDarkMode
                                      ? 'bg-indigo-500/80'
                                      : 'bg-indigo-600'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
