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

  let topic = 'ai', subtopic = '', desktop = false;
  try {
    const b = await request.json();
    topic = b.topic || 'ai';
    subtopic = b.subtopic || '';
    desktop = b.desktop === true;
  } catch (_) {}

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

  const TOPICS = {
    ai:'인공지능(AI) — 국방 AI 플랫폼, 자율 의사결정, 전장 인식',
    uav:'유·무인복합 — 드론, 무인기, 로봇전투체계, 유무인 협업작전',
    quantum:'양자기술 — 양자통신, 양자센서, 양자암호, 양자컴퓨팅',
    space:'우주전력 — 정찰위성, 위성항법, 우주상황인식, 대위성 전력',
    energy:'지향성에너지(DEW) — 고출력 레이저·마이크로파 무기체계',
    material:'첨단소재 — 스텔스, 초고강도 구조재, 나노·메타소재',
    cyber:'사이버·네트워크 — 사이버전, 전자전, C4I, 전술 네트워크',
    sensor:'센서·전자기전 — 레이더, 적외선·광학센서, 전자기 공격·방어',
    propulsion:'추진 — 극초음속, 고체추진, 항공·해양 추진체계',
    wmd:'WMD 대응 — 미사일방어, 핵억제, 고위력 정밀타격, 화생방',
  };

  const topicText = TOPICS[topic] || TOPICS.ai;
  const subtopicHint = subtopic ? `이전 주제: "${subtopic}". 반드시 다른 세부 주제로 작성.` : '';

  const mobilePrompt = `당신은 합참 전략기획부장 수준의 국방 인텔리전스 전문가입니다.
분야: ${topicText} / 기준일: ${today}
${subtopicHint}

마크다운 기호 사용 금지. [태그]로 섹션 구분. 각 사실마다 (기관명, 연도) 괄호 인용.

===자료1===
[제목] 분석적 제목 (30자 이내)
[유형] 싱크탱크보고서/정책보고서/학술논문/뉴스분석 중 택1
[분야] ${topicText}
[핵심내용]
해당 기술의 최신 동향과 핵심 쟁점을 400자 내외로 서술. 구체적 수치·프로그램명·기관명 포함. 괄호 인용.
[전략적시사점]
①한반도 특수성: 종심250km·수도권·원전·항만 취약성과 이 기술의 연관성 (150자). ②북한 위협: 현재 역량과 기술이전 위험 (150자). ③동맹함의: 한미역할분담·한미일협력 영향 (100자). 괄호 인용.
[선진국RD]
미국·이스라엘·영국·일본 중 3개국. 각국 프로그램명·예산·타임라인. (300자 내외)
[국내기획]
방위사업청 연계 사업명·예산·주관기관, 단기/중기/장기 로드맵 요약. (250자 내외)
[출처]
1. 기관명, 자료명, 연도
2. 기관명, 자료명, 연도
3. 기관명, 자료명, 연도
4. 기관명, 자료명, 연도`;

  const desktopPrompt = `당신은 국방부 장관 정책보좌관, 합참 전략기획부장, 방위사업청 핵심 기획관을 보좌하는 최고급 국방 인텔리전스 분석관입니다. 박사급 전문가 수준으로 전략적 판단과 실행 가능한 정책 방향을 제시하세요.

분야: ${topicText} / 기준일: ${today}
${subtopicHint}

마크다운 기호 사용 금지. [태그]로 섹션 구분. 각 사실·수치마다 (기관명, 연도) 괄호 인용.

===자료1===
[제목] 핵심 쟁점과 전략적 함의가 드러나는 분석적 제목
[유형] 싱크탱크보고서/정책보고서/학술논문/뉴스분석 중 택1
[분야] 해당 기술 분야명
[핵심내용]
700자 이상. 기술 현황, 주요 행위자 전략적 의도, 기술-작전-정책 연계 구조를 입체적으로 분석. 구체적 수치·프로그램명·기관명·예산 반드시 포함. 전쟁사 선례 비교 포함. 괄호 인용.
[전략적시사점]
800자 이상. ①한반도 특수성: 종심 250km, 수도권 2600만, 원전·항만·반도체클러스터 동시 취약성, 구체적 위협 시나리오. ②북한 위협 정밀 분석: 현재 역량, 우크라이나 교훈 전이, 러시아·중국 기술이전 시나리오, 김정은 전략적 계산. ③동맹·다자 전략: 2026 NDS 맥락, 한미 협상력, 한미일 협력, ITAR 제약, QUAD·AUKUS. 괄호 인용.
[선진국RD]
500자 이상. 미국·이스라엘·영국·일본·호주 중 4개국 이상. 각국 프로그램명·예산·주관기관·타임라인·핵심기술목표. 각국 전략적 의도와 기술 경쟁 구도. 한국 벤치마킹 핵심 교훈. 괄호 인용.
[국내기획]
500자 이상. ①신규 과제 제안(사업명·총사업비·주관기관·기간·기술목표) ②법령·제도 개선(방위사업법·신속획득 특례·민군기술협력) ③단기·중기·장기 로드맵 ④예산 확보 전략. 괄호 인용.
[출처]
1. 기관명, 자료명, 연도
2. 기관명, 자료명, 연도
3. 기관명, 자료명, 연도
4. 기관명, 자료명, 연도
5. 기관명, 자료명, 연도
6. 기관명, 자료명, 연도`;

  const prompt = desktop ? desktopPrompt : mobilePrompt;
  const maxTokens = desktop ? 2000 : 2000;

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
        max_tokens: maxTokens,
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
    return new Response(
      JSON.stringify({ text: fullText, date: today, subtopic: newSubtopic }),
      { status: 200, headers: cors }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
}
