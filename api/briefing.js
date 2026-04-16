export const maxDuration = 60;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topic } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
  });

  const TOPICS = {
    ai:         '인공지능(AI) — 국방 AI 플랫폼, 자율 의사결정',
    uav:        '유·무인복합 — 드론, 무인기, 로봇전투체계',
    quantum:    '양자기술 — 양자통신, 양자센서, 양자암호',
    space:      '우주전력 — 정찰위성, 위성항법, 우주상황인식',
    energy:     '지향성에너지(DEW) — 고출력 레이저·마이크로파',
    material:   '첨단소재 — 스텔스, 초고강도 구조재, 나노소재',
    cyber:      '사이버·네트워크 — 사이버전, 전자전, C4I',
    sensor:     '센서·전자기전 — 레이더, 적외선·광학센서',
    propulsion: '추진 — 극초음속, 고체추진, 항공·해양 추진',
    wmd:        'WMD 대응 — 미사일방어, 핵억제, 화생방 방어',
  };

  const topicText = TOPICS[topic] || TOPICS.ai;

  const prompt = `당신은 합참 전략기획부장·방위사업청 기획관 수준의 국방 인텔리전스 전문가입니다.
분야: ${topicText} / 기준일: ${today}

아래 형식으로 브리핑 2건을 작성하세요. 각 자료는 A4 1~2페이지 분량으로 충실하게 작성합니다.

[자료 1]
- 제목:
- 유형: (뉴스기사/싱크탱크보고서/학술논문/정책보고서)
- 분야:
- 핵심 내용: (600자 이상. 최신 동향, 구체적 수치·기관명·프로그램명 포함. 기술적 맥락과 배경 분석)
- 전략적 시사점: (700자 이상. ①한반도 특수성-종심250km·수도권밀집·구체적위협시나리오 ②북한위협-현재역량·우크라이나교훈흡수·러시아기술이전시나리오 ③동맹함의-한미역할분담·한미일협력·인도태평양포지셔닝 세 가지 모두 포함)
- 선진국 최신 R&D 방향: (500자 이상. 미국·이스라엘·영국·일본 중 3개국 이상, 프로그램명·예산·타임라인 포함)
- 국내 개발 기획 방향: (500자 이상. ①방위사업청 연계 과제명 ②예산·주관기관·기간 ③법령·제도 개선 ④단기·중기·장기 로드맵)
- 출처: (기관명, 저자, 날짜, URL)

[자료 2]
(동일 형식, 자료 1과 보완적인 다른 세부 주제)`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }
    const data = await response.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '';
    return res.status(200).json({ text, date: today });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
