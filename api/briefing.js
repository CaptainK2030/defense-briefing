export const config = { runtime: 'edge' };

export default async function handler(request) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });
  if (request.method !== 'POST') return new Response('{}', { status: 405, headers: cors });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: 'API 키 없음' }), { status: 500, headers: cors });

  let topic = 'ai', subtopic = '';
  try { const b = await request.json(); topic = b.topic || 'ai'; subtopic = b.subtopic || ''; } catch (_) {}

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

  const TOPICS = {
    ai:'인공지능(AI)', uav:'유·무인복합', quantum:'양자기술',
    space:'우주전력', energy:'지향성에너지(DEW)', material:'첨단소재',
    cyber:'사이버·네트워크', sensor:'센서·전자기전',
    propulsion:'추진기술', wmd:'WMD 대응',
  };

  const topicText = TOPICS[topic] || TOPICS.ai;
  const subtopicHint = subtopic ? `이전 주제: "${subtopic}". 다른 세부 주제로 작성.` : '';

  const prompt = `당신은 합참 전략기획부장 수준의 국방 인텔리전스 전문가입니다.
분야: ${topicText} / 기준일: ${today}
${subtopicHint}

아래 형식으로 브리핑 1건 작성. 마크다운 기호 사용 금지. [태그]로 섹션 구분. 각 사실마다 (기관명, 연도) 괄호 인용.

===자료1===
[제목] 분석적 제목 (30자 이내)
[유형] 싱크탱크보고서/정책보고서/학술논문/뉴스분석 중 택1
[분야] ${topicText}
[핵심내용]
해당 기술의 최신 동향과 핵심 쟁점을 400자 내외로 서술. 구체적 수치·프로그램명·기관명 포함. 괄호 인용.
[전략적시사점]
①한반도 특수성: 종심250km·수도권·원전·항만 취약성과 이 기술의 연관성 (150자).
②북한 위협: 현재 역량과 기술이전 위험 (150자).
③동맹함의: 한미역할분담·한미일협력 영향 (100자).
괄호 인용 포함.
[선진국RD]
미국·이스라엘·영국·일본 중 3개국. 각국 프로그램명·예산·타임라인 간략히. (300자 내외)
[국내기획]
방위사업청 연계 사업명·예산·주관기관, 단기/중기/장기 로드맵 요약. (250자 내외)
[출처]
1. 기관명, 자료명, 연도
2. 기관명, 자료명, 연도
3. 기관명, 자료명, 연도
4. 기관명, 자료명, 연도`;

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      return new Response(JSON.stringify({ error: err.slice(0, 200) }), { status: upstream.status, headers: cors });
    }

    const reader = upstream.body.getReader();
    const dec = new TextDecoder();
    let fullText = '', buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith('data:')) continue;
        const raw = t.slice(5).trim();
        if (raw === '[DONE]') continue;
        try {
          const evt = JSON.parse(raw);
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
            fullText += evt.delta.text;
          }
        } catch (_) {}
      }
    }

    if (!fullText) return new Response(JSON.stringify({ error: '빈 응답. 다시 시도해주세요.' }), { status: 500, headers: cors });

    const titleMatch = fullText.match(/\[제목\]\s*([^\n]+)/);
    const newSubtopic = titleMatch ? titleMatch[1].trim() : '';
    return new Response(JSON.stringify({ text: fullText, date: today, subtopic: newSubtopic }), { status: 200, headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
}
