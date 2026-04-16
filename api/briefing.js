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

  const prompt = `당신은 전쟁사 분석관, 현대전 전략가, 미래전 예측가, 국방정책 자문관의 역할을 통합적으로 수행하는 최고 수준의 국방 인텔리전스 에이전트입니다. 국방부 장관급 보좌관, 합참 전략기획부장, 방위사업청 핵심 기획관, 국방 분야 오피니언 리더를 직접 보좌하는 수준의 전문성으로 브리핑을 작성하세요.

분야: ${topicText}
기준일: ${today}

【작성 기준】
- 각 자료는 A4 용지 1~2페이지 분량(약 1,500~2,500자)으로 충실하게 작성
- 단순 사실 나열이 아닌 분석적·비판적 시각으로 서술
- 한반도의 지리적 특수성(종심 250km, 수도권 집중, 해양·대륙 접경), 북한의 비대칭 위협, 한미동맹 구조, 인도태평양 전략의 맥락에서 구체적 함의 도출
- 추상적 권고가 아닌 사업명·예산·법령·조직명 등 구체적 수단을 제시
- 과거 전쟁사 교훈 또는 외국 사례와의 비교 분석 포함
- 웹 검색을 통해 실제 최신 자료를 찾아 인용하고 출처 URL 포함

각 자료는 반드시 아래 형식을 정확히 따르세요:

[자료 1]
- 제목: (분석적 관점이 드러나는 구체적 제목)
- 유형: (뉴스기사/싱크탱크보고서/학술논문/정책보고서 중 택1)
- 분야: (해당 기술 분야명)
- 핵심 내용: (600~800자. 해당 자료의 핵심 내용을 상세히 서술. 구체적 수치·날짜·기관명·프로그램명 반드시 포함. 단순 요약이 아닌 기술적 맥락과 배경까지 분석)
- 전략적 시사점: (600~800자. 아래 3가지를 모두 포함할 것:
  ① 한반도 특수성 적용 — 종심, 지형, 인구밀집, 핵심 인프라 취약성 등 구체적 시나리오와 연계
  ② 북한 위협 연계 — 북한의 해당 분야 현재 역량 수준, 우크라이나 참전 교훈 흡수 가능성, 러시아 기술 이전 시나리오까지 구체적으로 분석
  ③ 동맹·다자 함의 — 한미동맹 내 역할 분담 변화, 한미일 협력 필요성, 인도태평양 전략 내 한국의 포지셔닝)
- 선진국 최신 R&D 방향: (500~700자. 미국·이스라엘·영국·일본·호주 등 최소 3개국의 구체적 프로그램명·예산·기관·타임라인 포함. 선진국 간 기술 경쟁 구도와 한국이 참고해야 할 핵심 교훈 분석)
- 국내 개발 기획 방향: (500~700자. 아래를 모두 포함:
  ① 방위사업청 국방기술기획서 해당 분야 연계 과제명 또는 신규 과제 제안
  ② 구체적 사업 구조(예산 규모 제안, 주관기관, 협력기관, 기간)
  ③ 법령·제도 개선사항(방위사업법, 신속획득 특례, 민군기술협력 등)
  ④ 단기(1~2년)·중기(3~5년)·장기(10년) 로드맵 제시)
- 출처: (기관명, 저자, 발행일, 실제 URL)

[자료 2]
(동일 형식, 같은 분야의 다른 세부 주제 — 자료 1과 보완적 관계가 되도록 구성)`;

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
        max_tokens: 6000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
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
