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
    ai:         '인공지능(AI) — 국방 AI 플랫폼, 자율 의사결정, 스마트 전력지원',
    uav:        '유·무인복합 — 드론, 무인기, 로봇전투체계, 유무인 협업작전',
    quantum:    '양자기술 — 양자통신, 양자센서, 양자암호, 양자컴퓨팅',
    space:      '우주전력 — 감시정찰위성, 초정밀 위성항법, 우주상황인식, 대위성 전력',
    energy:     '지향성에너지(DEW) — 고출력 레이저·마이크로파, 에너지 무기체계',
    material:   '첨단소재 — 스텔스 소재, 초고강도 구조재, 나노·메타소재',
    cyber:      '사이버·네트워크 — 사이버전, 전자전, C4I, 전술 네트워크',
    sensor:     '센서·전자기전 — 레이더, 적외선·광학센서, 전자기 공격·방어',
    propulsion: '추진 — 극초음속, 고체추진, 항공·해양 추진체계',
    wmd:        'WMD 대응 — 미사일방어, 고위력 정밀타격, 핵억제, 화생방 방어',
  };

  const topicText = TOPICS[topic] || TOPICS.ai;

  const prompt = `당신은 국방 오피니언 리더를 보좌하는 고급 국방 인텔리전스 에이전트입니다.
방위사업청 「'25~'39 국방기술기획서」 10대 전략기술 분야 중 아래 분야에 대한 브리핑 2건을 작성하세요.

분야: ${topicText}
기준일: ${today}

각 자료는 반드시 아래 8개 항목 형식을 정확히 따르세요:

[자료 1]
- 제목: (구체적 제목)
- 유형: (뉴스기사/싱크탱크보고서/학술논문/정책보고서 중 택1)
- 분야: (위 10대 분야 중 해당 분야명)
- 핵심 내용: (4~5문장. 반드시 구체적 수치·날짜·기관명 포함)
- 전략적 시사점: (3~4문장. 한반도 지형·북한 위협·한미동맹 맥락으로 구체화)
- 선진국 최신 R&D 방향: (미국·이스라엘·영국·일본 등 선진국의 해당 분야 최신 연구개발 트렌드와 핵심 프로그램 3~4문장)
- 국내 개발 기획 방향: (방위사업청 국방기술기획서 10대 분야 기반, 우리 군이 추진해야 할 구체적 R&D 사업·제도 방향 3~4문장)
- 출처: (기관명, 저자, 날짜)

[자료 2]
(동일 형식, 같은 분야의 다른 세부 주제)`;

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
        max_tokens: 2500,
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
