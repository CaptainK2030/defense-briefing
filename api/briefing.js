export const maxDuration = 60;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topic, subtopic } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
  });

  const TOPICS = {
    ai:         '인공지능(AI) — 국방 AI 플랫폼, 자율 의사결정, 전장 인식',
    uav:        '유·무인복합 — 드론, 무인기, 로봇전투체계, 유무인 협업작전',
    quantum:    '양자기술 — 양자통신, 양자센서, 양자암호, 양자컴퓨팅',
    space:      '우주전력 — 정찰위성, 위성항법, 우주상황인식, 대위성 전력',
    energy:     '지향성에너지(DEW) — 고출력 레이저·마이크로파 무기체계',
    material:   '첨단소재 — 스텔스, 초고강도 구조재, 나노·메타소재',
    cyber:      '사이버·네트워크 — 사이버전, 전자전, C4I, 전술 네트워크',
    sensor:     '센서·전자기전 — 레이더, 적외선·광학센서, 전자기 공격·방어',
    propulsion: '추진 — 극초음속, 고체추진, 항공·해양 추진체계',
    wmd:        'WMD 대응 — 미사일방어, 핵억제, 고위력 정밀타격, 화생방',
  };

  const topicText = TOPICS[topic] || TOPICS.ai;
  const subtopicHint = subtopic ? `이전 주제: "${subtopic}". 반드시 다른 세부 주제로 작성.` : '';

  const prompt = `당신은 합참 전략기획부장·방위사업청 기획관 수준의 국방 인텔리전스 전문가입니다.
분야: ${topicText} / 기준일: ${today}
${subtopicHint}

아래 형식으로 브리핑 1건을 작성하세요. 마크다운 기호(#,**,-,*) 사용 금지. 각 섹션은 새 줄에서 [태그]로 시작.
각 사실·수치마다 (기관명, 연도) 괄호 인용 포함.

===자료1===
[제목] 전략적 함의가 드러나는 분석적 제목
[유형] 싱크탱크보고서/정책보고서/학술논문/뉴스분석 중 택1
[분야] 해당 기술 분야명
[핵심내용]
700자 이상. 기술 현황·주요 행위자 의도·기술-작전-정책 연계 구조 분석. 수치·프로그램명·기관명·예산 포함. 전쟁사 선례 비교. 괄호 인용 포함.
[전략적시사점]
800자 이상. ①한반도 특수성(종심250km·수도권·원전·항만 취약성·구체적 시나리오) ②북한 위협(현재역량·우크라이나교훈흡수·러시아기술이전시나리오) ③동맹함의(2026 NDS·한미역할분담·한미일협력). 괄호 인용 포함.
[선진국RD]
500자 이상. 미국·이스라엘·영국·일본 중 3개국 이상. 프로그램명·예산·타임라인. 괄호 인용 포함.
[국내기획]
500자 이상. 사업명·예산·주관기관·기간, 법령개선, 단기·중기·장기 로드맵. 괄호 인용 포함.
[출처]
1. 기관명, 자료명, 연도
2. 기관명, 자료명, 연도
3. 기관명, 자료명, 연도
4. 기관명, 자료명, 연도
5. 기관명, 자료명, 연도
6. 기관명, 자료명, 연도`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 50000);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '';
    const titleMatch = text.match(/\[제목\]\s*([^\n]+)/);
    const subtopic = titleMatch ? titleMatch[1].trim() : '';
    return res.status(200).json({ text, date: today, subtopic });
  } catch (e) {
    const msg = e.name === 'AbortError' ? '응답 시간 초과. 다시 시도해주세요.' : e.message;
    return res.status(500).json({ error: msg });
  }
}
