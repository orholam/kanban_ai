import type { AnalyticsEventRow } from '../types';

export type McpUserRow = {
  userId: string;
  daysActive: number;
  sessions: number;
  toolCalls: number;
  toolSuccess: number;
  toolError: number;
  firstSeen: string;
  lastSeen: string;
  repeat: boolean;
  engaged: boolean;
  clientFamily: string | null;
};

export type McpBotFamilyRow = {
  family: string;
  probes: number;
  fingerprints: number;
  lastSeen: string;
  sampleUserAgent: string;
};

export type McpAuthReasonRow = {
  reason: string;
  count: number;
};

export type McpAudienceSummary = {
  uniqueUsers: number;
  repeatUsers: number;
  oneDayUsers: number;
  engagedUsers: number;
  sessionOnlyUsers: number;
  botProbes: number;
  unknownAuthFailures: number;
  humanAuthFailures: number;
  users: McpUserRow[];
  botFamilies: McpBotFamilyRow[];
  authReasons: McpAuthReasonRow[];
  story: string;
};

const BOT_FAMILIES: { family: string; test: RegExp }[] = [
  { family: 'mcpbeat', test: /mcpbeat/i },
  { family: 'rokmcp', test: /rokmcp/i },
  { family: 'mcp-scanner', test: /mcp[-_ ]?scan/i },
  { family: 'python-aiohttp', test: /aiohttp/i },
  { family: 'python-httpx', test: /httpx/i },
  { family: 'python-requests', test: /python-requests/i },
  { family: 'go-http-client', test: /go-http-client/i },
  { family: 'generic-bot', test: /\b(bot|crawler|spider|liveness)\b/i },
];

const CLIENT_FAMILIES: { family: string; test: RegExp }[] = [
  { family: 'Cursor', test: /cursor/i },
  { family: 'Claude', test: /claude|anthropic/i },
  { family: 'ChatGPT', test: /chatgpt|openai/i },
  { family: 'VS Code', test: /visual studio code|vscode/i },
];

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function readUserAgent(metadata: Record<string, unknown>): string {
  return typeof metadata.user_agent === 'string' ? metadata.user_agent.trim() : '';
}

export function classifyMcpUserAgent(userAgent: string | undefined): {
  kind: 'bot' | 'client' | 'unknown';
  family: string;
} {
  const ua = userAgent?.trim() ?? '';
  if (!ua) return { kind: 'unknown', family: 'unknown' };
  for (const row of CLIENT_FAMILIES) {
    if (row.test.test(ua)) return { kind: 'client', family: row.family };
  }
  for (const row of BOT_FAMILIES) {
    if (row.test.test(ua)) return { kind: 'bot', family: row.family };
  }
  return { kind: 'unknown', family: ua.slice(0, 32) };
}

function fingerprintOf(e: AnalyticsEventRow): string {
  if (typeof e.metadata?.token_fingerprint === 'string' && e.metadata.token_fingerprint.trim()) {
    return e.metadata.token_fingerprint;
  }
  if (e.guest_session_id && e.guest_session_id !== 'mcp_auth_failure') return e.guest_session_id;
  return 'none';
}

function laterIso(a: string, b: string): string {
  return a > b ? a : b;
}

function earlierIso(a: string, b: string): string {
  return a < b ? a : b;
}

export function summarizeMcpAudience(
  sessions: AnalyticsEventRow[],
  toolCalls: AnalyticsEventRow[],
  authFailures: AnalyticsEventRow[],
): McpAudienceSummary {
  const byUser = new Map<
    string,
    {
      days: Set<string>;
      sessions: number;
      toolCalls: number;
      toolSuccess: number;
      toolError: number;
      firstSeen: string;
      lastSeen: string;
      clientFamily: string | null;
    }
  >();

  const touchUser = (userId: string, createdAt: string, clientFamily: string | null) => {
    let row = byUser.get(userId);
    if (!row) {
      row = {
        days: new Set<string>(),
        sessions: 0,
        toolCalls: 0,
        toolSuccess: 0,
        toolError: 0,
        firstSeen: createdAt,
        lastSeen: createdAt,
        clientFamily,
      };
      byUser.set(userId, row);
    } else {
      row.firstSeen = earlierIso(row.firstSeen, createdAt);
      row.lastSeen = laterIso(row.lastSeen, createdAt);
      if (!row.clientFamily && clientFamily) row.clientFamily = clientFamily;
    }
    row.days.add(dayKey(createdAt));
    return row;
  };

  for (const e of sessions) {
    if (!e.user_id) continue;
    const ua = readUserAgent(e.metadata);
    const classified = classifyMcpUserAgent(ua);
    const family = classified.kind === 'client' ? classified.family : ua ? classified.family : null;
    const row = touchUser(e.user_id, e.created_at, family);
    row.sessions += 1;
  }

  for (const e of toolCalls) {
    if (!e.user_id) continue;
    const row = touchUser(e.user_id, e.created_at, null);
    row.toolCalls += 1;
    if (e.metadata?.success === true) row.toolSuccess += 1;
    else if (e.metadata?.success === false) row.toolError += 1;
  }

  const users: McpUserRow[] = [...byUser.entries()]
    .map(([userId, row]) => {
      const daysActive = row.days.size;
      const engaged = row.toolCalls > 0;
      return {
        userId,
        daysActive,
        sessions: row.sessions,
        toolCalls: row.toolCalls,
        toolSuccess: row.toolSuccess,
        toolError: row.toolError,
        firstSeen: row.firstSeen,
        lastSeen: row.lastSeen,
        repeat: daysActive >= 2,
        engaged,
        clientFamily: row.clientFamily,
      };
    })
    .sort((a, b) => (a.lastSeen < b.lastSeen ? 1 : a.lastSeen > b.lastSeen ? -1 : b.toolCalls - a.toolCalls));

  const uniqueUsers = users.length;
  const repeatUsers = users.filter((u) => u.repeat).length;
  const oneDayUsers = users.filter((u) => !u.repeat).length;
  const engagedUsers = users.filter((u) => u.engaged).length;
  const sessionOnlyUsers = users.filter((u) => !u.engaged).length;

  const botByFamily = new Map<
    string,
    { probes: number; fingerprints: Set<string>; lastSeen: string; sampleUserAgent: string }
  >();
  let botProbes = 0;
  let unknownAuthFailures = 0;
  let humanAuthFailures = 0;

  for (const e of authFailures) {
    const ua = readUserAgent(e.metadata);
    const classified = classifyMcpUserAgent(ua);
    if (classified.kind === 'client' || e.user_id) {
      humanAuthFailures += 1;
      continue;
    }
    if (classified.kind === 'unknown' && !ua) {
      unknownAuthFailures += 1;
      continue;
    }
    botProbes += 1;
    const family = classified.kind === 'bot' ? classified.family : classified.family || 'unknown';
    let row = botByFamily.get(family);
    if (!row) {
      row = { probes: 0, fingerprints: new Set(), lastSeen: e.created_at, sampleUserAgent: ua || family };
      botByFamily.set(family, row);
    }
    row.probes += 1;
    row.fingerprints.add(fingerprintOf(e));
    if (e.created_at > row.lastSeen) row.lastSeen = e.created_at;
    if (ua && (!row.sampleUserAgent || ua.length < row.sampleUserAgent.length)) row.sampleUserAgent = ua;
  }

  const botFamilies: McpBotFamilyRow[] = [...botByFamily.entries()]
    .map(([family, row]) => ({
      family,
      probes: row.probes,
      fingerprints: row.fingerprints.size,
      lastSeen: row.lastSeen,
      sampleUserAgent: row.sampleUserAgent,
    }))
    .sort((a, b) => b.probes - a.probes);

  const reasonCounts = new Map<string, number>();
  for (const e of authFailures) {
    const reason = typeof e.metadata?.reason === 'string' && e.metadata.reason.trim() ? e.metadata.reason : 'unknown';
    reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
  }
  const authReasons: McpAuthReasonRow[] = [...reasonCounts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  return {
    uniqueUsers,
    repeatUsers,
    oneDayUsers,
    engagedUsers,
    sessionOnlyUsers,
    botProbes,
    unknownAuthFailures,
    humanAuthFailures,
    users,
    botFamilies,
    authReasons,
    story: buildMcpAudienceStory({
      uniqueUsers,
      repeatUsers,
      engagedUsers,
      sessionOnlyUsers,
      botProbes,
      botFamilies,
      authFailures: authFailures.length,
    }),
  };
}

function buildMcpAudienceStory(input: {
  uniqueUsers: number;
  repeatUsers: number;
  engagedUsers: number;
  sessionOnlyUsers: number;
  botProbes: number;
  botFamilies: McpBotFamilyRow[];
  authFailures: number;
}): string {
  const parts: string[] = [];
  if (input.uniqueUsers === 0) {
    parts.push('No signed-in people used MCP in this range.');
  } else {
    parts.push(
      `${input.uniqueUsers} signed-in ${input.uniqueUsers === 1 ? 'person' : 'people'} used MCP.`,
    );
    if (input.repeatUsers > 0) {
      parts.push(
        `${input.repeatUsers} came back on more than one day.`,
      );
    }
    if (input.engagedUsers > 0 && input.sessionOnlyUsers > 0) {
      parts.push(
        `${input.engagedUsers} called tools; ${input.sessionOnlyUsers} only opened a session.`,
      );
    } else if (input.engagedUsers > 0) {
      parts.push('Every signed-in person called at least one tool.');
    } else {
      parts.push('Nobody called tools — activity is sessions (handshake / list) only.');
    }
  }
  if (input.botProbes > 0) {
    const top = input.botFamilies[0];
    const topBit = top ? ` ${top.family} is the noisiest (${top.probes} probes).` : '';
    parts.push(`Unauthenticated traffic is mostly scanners (${input.botProbes} probes).${topBit}`);
  } else if (input.authFailures > 0) {
    parts.push(`${input.authFailures} auth failures were not classified as known scanners.`);
  }
  return parts.join(' ');
}

export function uniqueMcpUsersByDay(
  sessions: AnalyticsEventRow[],
  toolCalls: AnalyticsEventRow[],
): { created_at: string; userId: string }[] {
  const out: { created_at: string; userId: string }[] = [];
  for (const e of [...sessions, ...toolCalls]) {
    if (!e.user_id) continue;
    out.push({ created_at: e.created_at, userId: e.user_id });
  }
  return out;
}
