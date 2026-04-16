export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topic, topicLabel } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
  });

  const TOPICS = {
    auto: '국방·안보 전 분야에서 오늘 가장 주목할 이슈',
    drone: '드론·무인체계·AI 자율전투',
    korus: '한미동맹·인도태평양 전략·방위비 분담',
    nk: '북한 군사동향·한반도 안보',
    cyber: '사이버전·우주전·전자전',
    nuclear: '핵억제·핵비확산·WMD',
    kdef: '방위산업·K-방산 수출',
  };

  const topicText = TOPICS[topic] || TOPICS.auto;

  const prompt = `당신은 국방 오피니언 리더를 보좌하는 고급 국방 인텔리전스 에이전트입니다.
오늘(${today}) 기준으로 ${topicText} 분야 브리핑 2건을 작성하세요.

각 자료는 아래 형식을 정확히 따르세요:

[자료 1]
- 제목: (구체적 제목)
- 유형: (뉴스기사/싱크탱크보고서/학술논문/정책보고서 중 택1)
- 분야: (드론·AI/한미동맹/북한·한반도/사이버/핵·WMD/방위산업 중 택1)
- 핵심 내용: (4~5문장. 반드시 구체적 수치·날짜·기관명 포함)
- 전략적 시사점: (3~4문장. 한반도 지형·북한 위협·한미동맹 맥락으로 구체화)
- 출처: (기관명, 저자, 날짜)
- 토론 주제: (논쟁적이고 미래지향적인 질문 1개)

[자료 2]
(동일 형식, 다른 분야)`;

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
        max_tokens: 2000,
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
