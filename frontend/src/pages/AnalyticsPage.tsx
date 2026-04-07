import React, { useEffect, useMemo, useState } from 'react';
import { eachDayOfInterval, eachHourOfInterval, format, startOfHour, subDays, subHours } from 'date-fns';
import { BarChart3, CalendarRange, Sparkles, LogIn, UserPlus, ListTodo } from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { AnalyticsEventRow, AnalyticsEventType } from '../types';

const EVENT_LABELS: Record<AnalyticsEventType, string> = {
  sign_up: 'Sign-ups',
  sign_in: 'Sign-ins',
  ai_interaction: 'AI interactions',
  task_write: 'Task writes',
};

const EVENT_ORDER: AnalyticsEventType[] = [
  'sign_up',
  'sign_in',
  'ai_interaction',
  'task_write',
];

const EVENT_ICONS: Record<AnalyticsEventType, React.ElementType> = {
  sign_up: UserPlus,
  sign_in: LogIn,
  ai_interaction: Sparkles,
  task_write: ListTodo,
};

/** Distinct bar colors per event type (Tailwind-ish, inline for SVG/CSS). */
const EVENT_COLORS: Record<AnalyticsEventType, { fill: string; soft: string }> = {
  sign_up: { fill: 'rgb(34 197 94)', soft: 'rgba(34, 197, 94, 0.2)' },
  sign_in: { fill: 'rgb(59 130 246)', soft: 'rgba(59, 130, 246, 0.2)' },
  ai_interaction: { fill: 'rgb(139 92 246)', soft: 'rgba(139, 92, 246, 0.2)' },
  task_write: { fill: 'rgb(245 158 11)', soft: 'rgba(245, 158, 11, 0.2)' },
};

function dayKey(iso: string): string {
  return iso.slice(0, 10);
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

function DailyVolumeChart({
  series,
  isDarkMode,
}: {
  series: { day: string; label: string; count: number }[];
  isDarkMode: boolean;
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
        No daily data in this range.
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
        aria-label={`Daily event counts, max ${max} in this range`}
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
  const [range, setRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [selectedSubject, setSelectedSubject] = useState<{ kind: 'user' | 'guest'; id: string } | null>(null);
  const [events, setEvents] = useState<AnalyticsEventRow[]>([]);
  const [nameByUserId, setNameByUserId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setEvents([]);
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
      const query = supabase
        .from('analytics_events')
        .select('id, created_at, user_id, guest_session_id, event_type, metadata')
        .order('created_at', { ascending: false })
        .limit(50000);

      if (range === '24h') {
        query.gte('created_at', subHours(new Date(), 24).toISOString());
      } else if (range === '7d') {
        query.gte('created_at', subDays(new Date(), 7).toISOString());
      } else if (range === '30d') {
        query.gte('created_at', subDays(new Date(), 30).toISOString());
      }

      const { data: rows, error: qErr } = await query;

      if (cancelled) return;

      if (qErr) {
        setError(qErr.message);
        setEvents([]);
        setNameByUserId({});
        setLoading(false);
        return;
      }

      const list = (rows ?? []) as AnalyticsEventRow[];
      setEvents(list);

      const ids = [...new Set(list.map((e) => e.user_id).filter((id): id is string => Boolean(id)))];
      if (ids.length === 0) {
        setNameByUserId({});
        setLoading(false);
        return;
      }

      const { data: profs, error: pErr } = await supabase
        .from('profiles')
        .select('id, display_name, full_name, name, username')
        .in('id', ids);

      if (cancelled) return;

      if (pErr) {
        console.warn('Analytics profiles:', pErr.message);
        const fallback: Record<string, string> = {};
        for (const id of ids) fallback[id] = id.slice(0, 8);
        setNameByUserId(fallback);
        setLoading(false);
        return;
      }

      const map: Record<string, string> = {};
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

  const filteredEvents = useMemo(() => {
    if (!selectedSubject) return events;
    if (selectedSubject.kind === 'user') {
      return events.filter((e) => e.user_id === selectedSubject.id);
    }
    return events.filter((e) => (e.guest_session_id ?? '').trim() === selectedSubject.id);
  }, [events, selectedSubject]);

  const totalsByType = useMemo(() => {
    const m: Partial<Record<AnalyticsEventType, number>> = {};
    for (const e of filteredEvents) {
      const t = e.event_type as AnalyticsEventType;
      m[t] = (m[t] ?? 0) + 1;
    }
    return m;
  }, [filteredEvents]);

  const totalEvents = filteredEvents.length;

  const eventTypeMax = useMemo(
    () => Math.max(...EVENT_ORDER.map((k) => totalsByType[k] ?? 0), 1),
    [totalsByType]
  );

  /** Aggregated by signed-in user or guest browser session. */
  const topSubjects = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of events) {
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
  }, [events]);

  const topSubjectMax = useMemo(
    () => Math.max(...topSubjects.map((u) => u.count), 1),
    [topSubjects]
  );

  const dailySeries = useMemo(() => {
    const byBucket: Record<string, number> = {};
    if (range === '24h') {
      const end = startOfHour(new Date());
      const start = subHours(end, 23);
      const hours = eachHourOfInterval({ start, end });
      for (const e of filteredEvents) {
        const ts = new Date(e.created_at);
        ts.setMinutes(0, 0, 0);
        const key = format(ts, "yyyy-MM-dd'T'HH:00");
        byBucket[key] = (byBucket[key] ?? 0) + 1;
      }
      return hours.map((h) => {
        const key = format(h, "yyyy-MM-dd'T'HH:00");
        return {
          day: key,
          label: format(h, 'ha'),
          count: byBucket[key] ?? 0,
        };
      });
    }

    const end = new Date();
    end.setHours(0, 0, 0, 0);

    const inferredStart = range === 'all'
      ? (filteredEvents.length ? new Date(dayKey(filteredEvents[filteredEvents.length - 1].created_at)) : end)
      : range === '7d'
        ? subDays(end, 6)
        : subDays(end, 29);

    const days = eachDayOfInterval({ start: inferredStart, end });
    for (const e of filteredEvents) {
      const k = dayKey(e.created_at);
      byBucket[k] = (byBucket[k] ?? 0) + 1;
    }
    return days.map((d) => {
      const day = format(d, 'yyyy-MM-dd');
      return {
        day,
        label: format(d, 'MMM d'),
        count: byBucket[day] ?? 0,
      };
    });
  }, [filteredEvents, range]);

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

  const shell = isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900';
  const panel = isDarkMode
    ? 'rounded-2xl border border-zinc-800/80 bg-zinc-900/50'
    : 'rounded-2xl border border-zinc-200/90 bg-white';
  const muted = isDarkMode ? 'text-zinc-400' : 'text-zinc-600';

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
                onChange={(e) => setRange(e.target.value as '24h' | '7d' | '30d' | 'all')}
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
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wide">Volume over time</h2>
                    <p className={`mt-1 text-xs ${muted}`}>
                      {range === '24h'
                        ? 'Events per hour (chronological). Hover points for exact counts.'
                        : 'Events per day (chronological). Hover points for exact counts.'}
                    </p>
                  </div>
                  <p className={`text-xs tabular-nums ${muted}`}>{totalEvents} events in range</p>
                </div>
                <DailyVolumeChart series={dailySeries} isDarkMode={isDarkMode} />
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
