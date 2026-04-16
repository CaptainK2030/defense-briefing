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

반드시 아래 형식을 정확히 지켜 브리핑 2건을 작성하세요.
각 자료는 A4 1~2페이지 분량으로 전문가 수준의 깊이 있는 내용을 작성합니다.
각 섹션은 반드시 새 줄에서 시작하고, 마크다운 기호(#, **, - 등)는 사용하지 마세요.

===자료1===
[제목] 여기에 구체적 제목 작성
[유형] 뉴스기사/싱크탱크보고서/학술논문/정책보고서 중 택1
[분야] 해당 기술 분야명
[핵심내용]
여기에 600자 이상 상세 서술. 구체적 수치, 날짜, 기관명, 프로그램명 반드시 포함. 단순 요약이 아닌 기술적 맥락과 배경까지 분석적으로 서술.
[전략적시사점]
여기에 700자 이상 전문가적 분석 서술. 반드시 아래 세 가지 포함:
①한반도 특수성: 종심 250km, 수도권 2600만 인구 밀집, 원전·항만·LNG기지 취약성, 구체적 위협 시나리오
②북한 위협 연계: 북한의 현재 역량 수준, 우크라이나 참전 교훈 흡수 가능성, 러시아 기술이전 시나리오
③동맹·다자 함의: 한미동맹 역할 분담 변화, 한미일 협력, 인도태평양 전략 내 한국 포지셔닝
[선진국RD]
여기에 500자 이상 서술. 미국·이스라엘·영국·일본 중 3개국 이상, 구체적 프로그램명·예산·타임라인 포함.
[국내기획]
여기에 500자 이상 서술. ①방위사업청 연계 과제명 ②예산·주관기관·기간 ③법령·제도 개선 ④단기(1~2년)·중기(3~5년)·장기(10년) 로드맵
[출처] 기관명, 저자, 날짜, URL

===자료2===
[제목] 여기에 구체적 제목 작성 (자료1과 다른 세부 주제)
[유형] 뉴스기사/싱크탱크보고서/학술논문/정책보고서 중 택1
[분야] 해당 기술 분야명
[핵심내용]
여기에 600자 이상 상세 서술.
[전략적시사점]
여기에 700자 이상 전문가적 분석 서술. ①한반도 특수성 ②북한 위협 연계 ③동맹·다자 함의 포함.
[선진국RD]
여기에 500자 이상 서술.
[국내기획]
여기에 500자 이상 서술.
[출처] 기관명, 저자, 날짜, URL`;

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
