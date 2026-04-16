export const config = { runtime: 'edge' };

export default async function handler(request) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ status: 'fail', reason: 'API 키 없음' }), { headers });
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'OK' }],
      }),
    });
    const data = await res.json();
    if (data.content) {
      return new Response(JSON.stringify({ status: 'ok', message: 'API 정상 작동 ✓' }), { headers });
    }
    return new Response(JSON.stringify({ status: 'fail', reason: JSON.stringify(data) }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ status: 'fail', reason: e.message }), { headers });
  }
}
