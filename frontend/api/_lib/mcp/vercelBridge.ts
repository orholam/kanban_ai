import type { VercelRequest, VercelResponse } from '@vercel/node';

export function vercelRequestToWebRequest(req: VercelRequest): Request {
  const host = req.headers.host ?? 'localhost';
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https';
  const path = req.url ?? '/';
  const url = `${proto}://${host}${path}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    headers.set(key, Array.isArray(value) ? value.join(', ') : String(value));
  }

  const method = req.method ?? 'GET';
  const init: RequestInit = { method, headers };

  if (method !== 'GET' && method !== 'HEAD') {
    if (typeof req.body === 'string') {
      init.body = req.body;
    } else if (Buffer.isBuffer(req.body)) {
      init.body = req.body;
    } else if (req.body != null) {
      init.body = JSON.stringify(req.body);
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
      }
    }
  }

  return new Request(url, init);
}

export async function sendWebResponse(res: VercelResponse, response: Response): Promise<void> {
  res.status(response.status);
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'transfer-encoding') return;
    res.setHeader(key, value);
  });
  res.setHeader('Cache-Control', 'no-store');

  const buffer = Buffer.from(await response.arrayBuffer());
  res.send(buffer);
}
