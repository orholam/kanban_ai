import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'GET') {
    res.status(200).json({ configured: Boolean(process.env.OPENAI_API_KEY) });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'OpenAI is not configured on the server' });
    return;
  }

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {};
  const stream = Boolean((body as { stream?: unknown }).stream);

  let upstream: Response;
  try {
    upstream = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'Failed to reach OpenAI' });
    return;
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    res.status(upstream.status).send(errText || upstream.statusText);
    return;
  }

  if (stream && upstream.body) {
    const ct = upstream.headers.get('content-type') || 'text/event-stream; charset=utf-8';
    res.status(200);
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders?.();

    const reader = upstream.body.getReader();
    try {
      let chunk = await reader.read();
      while (!chunk.done) {
        res.write(Buffer.from(chunk.value));
        chunk = await reader.read();
      }
    } finally {
      res.end();
    }
    return;
  }

  const json = await upstream.json().catch(() => null);
  if (json === null) {
    res.status(502).json({ error: 'Invalid JSON from OpenAI' });
    return;
  }

  res.status(200).json(json);
}
