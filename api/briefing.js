export const config = { runtime: 'edge' };

export default async function handler(request) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });
  if (request.method !== 'POST') return new Response('err', { status: 405, headers: cors });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response('NOKEY', { status: 500, headers: cors });

  let topic = 'ai', subtopic = '';
  try { const b = await request.json(); topic = b.topic || 'ai'; subtopic = b.subtopic || ''; } catch (_) {}

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

  const TOPICS = {
    ai:'인공지능(AI) — 국방 AI 플랫폼, 자율 의사결정',
    uav:'유·무인복합 — 드론, 무인기, 로봇전투체계',
    quantum:'양자기술 — 양자통신, 양자센서, 양자암호',
    space:'우주전력 — 정찰위성, 위성항법, 우주상황인식',
    energy:'지향성에너지(DEW) — 고출력 레이저·마이크로파',
    material:'첨단소재 — 스텔스, 초고강도 구조재, 나노소재',
    cyber:'사이버·네트워크 — 사이버전, 전자전, C4I',
    sensor:'센서·전자기전 — 레이더, 적외선·광학센서',
    propulsion:'추진 — 극초음속, 고체추진, 항공·해양 추진',
    wmd:'WMD 대응 — 미사일방어, 핵억제, 화생방 방어',
  };

  const topicText = TOPICS[topic] || TOPICS.ai;
  const subtopicHint = subtopic ? `이전 주제: "${subtopic}". 다른 세부 주제로 작성.` : '';

  const prompt = `당신은 합참 전략기획부장·방위사업청 기획관 수준의 국방 인텔리전스 전문가입니다.
분야: ${topicText} / 기준일: ${today}
${subtopicHint}

아래 형식으로 브리핑 1건 작성. 마크다운 기호 사용 금지. 각 섹션은 새 줄에서 [태그]로 시작. 각 사실·수치마다 (기관명, 연도) 괄호 인용.

===자료1===
[제목] 전략적 함의가 드러나는 분석적 제목
[유형] 싱크탱크보고서/정책보고서/학술논문/뉴스분석 중 택1
[분야] 해당 기술 분야명
[핵심내용]
500자 이상. 기술 현황, 주요 행위자 의도, 기술-작전-정책 연계. 수치·프로그램명·기관명 포함. 괄호 인용.
[전략적시사점]
600자 이상. ①한반도 특수성(종심250km·수도권·원전 취약성·시나리오) ②북한 위협(역량·우크라이나교훈·러시아기술이전) ③동맹함의(한미역할분담·한미일협력). 괄호 인용.
[선진국RD]
300자 이상. 미국·이스라엘·영국·일본 중 3개국. 프로그램명·예산·타임라인.
[국내기획]
300자 이상. 사업명·예산·주관기관, 법령개선, 단기·중기·장기 로드맵.
[출처]
1. 기관명, 자료명, 연도
2. 기관명, 자료명, 연도
3. 기관명, 자료명, 연도
4. 기관명, 자료명, 연도
5. 기관명, 자료명, 연도`;

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1800,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    return new Response(err, { status: upstream.status, headers: cors });
  }

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  (async () => {
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buf = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
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
              const chunk = evt.delta.text;
              fullText += chunk;
              // 청크를 16진수로 인코딩해서 전송 (줄바꿈 안전)
              const hex = Array.from(new TextEncoder().encode(chunk))
                .map(b => b.toString(16).padStart(2, '0')).join('');
              await writer.write(encoder.encode('c' + hex + '\n'));
            }
          } catch (_) {}
        }
      }
      // 완료 메타데이터 전송
      const titleMatch = fullText.match(/\[제목\]\s*([^\n]+)/);
      const newSubtopic = titleMatch ? titleMatch[1].trim() : '';
      const metaHex = Array.from(new TextEncoder().encode(JSON.stringify({ date: today, subtopic: newSubtopic })))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      await writer.write(encoder.encode('m' + metaHex + '\n'));
      await writer.write(encoder.encode('d\n'));
    } catch (e) {
      const errHex = Array.from(new TextEncoder().encode(e.message))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      await writer.write(encoder.encode('e' + errHex + '\n'));
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
  });
}
