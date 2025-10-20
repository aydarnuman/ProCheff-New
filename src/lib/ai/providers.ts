type RequestFn = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }
) => Promise<{ statusCode: number; body: { json: () => Promise<any>; text: () => Promise<string> } }>;

async function resolveRequest(): Promise<RequestFn> {
  try {
    const undici = await import('undici');
    if (typeof undici.request === 'function') {
      return undici.request as RequestFn;
    }
  } catch (error) {
    // fall back to fetch below
  }

  const fallback: RequestFn = async (url, init) => {
    const res = await fetch(url, {
      method: init?.method,
      headers: init?.headers,
      body: init?.body,
    });
    return {
      statusCode: res.status,
      body: {
        json: () => res.json(),
        text: () => res.text(),
      },
    };
  };

  return fallback;
}

async function request(url: string, init?: Parameters<RequestFn>[1]) {
  const fn = await resolveRequest();
  return fn(url, init);
}

export async function callClaude(prompt: string, model = 'claude-3-haiku-20240307') {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY missing');
  const { body } = await request('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const j: any = await body.json();
  return j?.content?.[0]?.text ?? '';
}

export async function callOpenAI(prompt: string, model = 'gpt-4o-mini') {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY missing');
  const { body } = await request('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0,
    }),
  });
  const j: any = await body.json();
  return j?.choices?.[0]?.message?.content ?? '';
}

export async function callGemini(prompt: string, model = 'models/gemini-1.5-flash') {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) throw new Error('GOOGLE_GEMINI_API_KEY missing');
  const { body } = await request(
    `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
    }
  );
  const j: any = await body.json();
  const parts = j?.candidates?.[0]?.content?.parts;
  return Array.isArray(parts) ? parts.map((p: any) => p.text).join('\n') : '';
}

export async function aiFallback(prompt: string) {
  try {
    return { provider: 'anthropic', text: await callClaude(prompt) } as const;
  } catch (error) {
    // continue to other providers
  }
  try {
    return { provider: 'openai', text: await callOpenAI(prompt) } as const;
  } catch (error) {
    // continue to other providers
  }
  try {
    return { provider: 'gemini', text: await callGemini(prompt) } as const;
  } catch (error) {
    // continue to fallback response
  }
  return { provider: 'none', text: '' } as const;
}
