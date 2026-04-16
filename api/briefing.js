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
  const subtopicHint = subtopic ? `이전에 다룬 세부 주제: "${subtopic}". 이와 다른 세부 주제를 선택하세요.` : '';

  const prompt = `당신은 국방부 장관 정책보좌관, 합참 전략기획부장, 방위사업청 핵심 기획관을 동시에 보좌하는 최고급 국방 인텔리전스 분석관입니다. 순수 군사·국방 분야 박사급 전문가로서, 단순한 정보 요약이 아닌 전략적 판단과 실행 가능한 정책 방향을 제시합니다.

분야: ${topicText}
기준일: ${today}
${subtopicHint}

아래 형식으로 브리핑 1건을 작성합니다.
절대 마크다운 기호(#, **, -, * 등)를 사용하지 마세요.
각 섹션은 반드시 새 줄에서 [태그]로 시작하세요.
각 사실·수치·주장마다 (기관명/자료명, 연도) 형식으로 괄호 인용을 문장 끝에 반드시 포함하세요.

===자료1===
[제목] 핵심 쟁점이 드러나는 분석적 제목 (단순 현황 보고가 아닌 전략적 함의가 제목에 반영될 것)
[유형] 싱크탱크보고서/정책보고서/학술논문/뉴스분석 중 택1
[분야] 해당 기술 분야명

[핵심내용]
최소 900자. 단순 사실 나열이 아닌 심층 분석. 해당 기술의 현재 발전 수준, 주요 행위자들의 전략적 의도, 기술-작전-정책의 연계 구조를 입체적으로 서술. 구체적 수치·프로그램명·기관명·날짜·예산 반드시 포함. 전쟁사적 선례나 유사 기술 발전 패턴과의 비교 분석 포함. 각 문장 끝에 괄호 인용 포함.

[전략적시사점]
최소 1000자. 박사급 전문가의 시각으로 한국 국방에 주는 전략적 함의를 3개 축으로 깊이 있게 분석.

①한반도 특수성: 종심 250km의 지리적 제약, 수도권 2,600만 집중, 원전·항만·반도체클러스터·LNG기지의 동시 취약성을 이 기술의 위협·기회와 구체적으로 연결. 북한의 선제타격 시나리오(시간·공간·수단 구체화)와 이 기술이 해당 시나리오에 미치는 영향을 분석. 괄호 인용 포함.

②북한 위협 정밀 분석: 북한의 해당 분야 현재 역량을 구체적 증거와 함께 제시. 우크라이나 전장에서 북한군이 습득한 교훈이 이 분야에 어떻게 전이될 수 있는지 추론. 러시아로부터의 기술이전 가능성과 경로, 중국의 기술 지원 시나리오까지 포함. 김정은 정권의 전략적 계산과 연결. 괄호 인용 포함.

③동맹·다자 전략 함의: 2026 미국 NDS의 대북억제 책임 이전 맥락에서 이 기술이 한국의 협상력에 미치는 영향. 한미 기술협력의 구체적 기회와 제약(기술이전 통제, ITAR 장벽 등). 한미일 안보협력에서 이 기술의 역할. QUAD·AUKUS 등 다자 구도에서의 기술 협력 전략. 괄호 인용 포함.

[선진국RD]
최소 700자. 미국·이스라엘·영국·일본·호주 중 최소 4개국. 각국의 구체적 프로그램명, 예산, 주관기관, 타임라인, 핵심 기술 목표를 서술. 단순 나열이 아닌 각국의 전략적 의도와 기술 경쟁 구도 분석. 한국이 벤치마킹해야 할 핵심 교훈 도출. 괄호 인용 포함.

[국내기획]
최소 700자. 방위사업청 국방기술기획서 해당 분야와 연계한 구체적 사업 기획.
①신규 과제 제안: 사업명, 총사업비(구체적 금액 제시), 주관기관(ADD/방사청/민간기업), 참여기관, 기간, 핵심 기술목표
②제도·법령 개선: 방위사업법 신속획득 특례 적용 방안, 민군기술협력 확대 조항, 필요시 국방과학기술혁신촉진법 개정 방향
③단기(1~2년): 즉시 착수 가능한 선행연구·기술조사·파일럿 사업
④중기(3~5년): 체계개발 진입 및 초도 전력화 목표
⑤장기(6~10년): 완전 전력화 및 수출 전략화
⑥예산 확보 전략: 국방중기계획 반영 시기, 기재부 협의 포인트, 민간 투자 유치 방안
괄호 인용 포함.

[출처]
이 브리핑에서 인용한 자료 목록. URL 없이 아래 형식으로 최소 6개 이상:
1. 기관명, 자료/보고서 제목, 연도
2. 기관명, 자료/보고서 제목, 연도`;

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
        max_tokens: 5000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }
    const data = await response.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '';
    // 제목 추출해서 subtopic으로 반환
    const titleMatch = text.match(/\[제목\]\s*([^\n]+)/);
    const subtopic = titleMatch ? titleMatch[1].trim() : '';
    return res.status(200).json({ text, date: today, subtopic });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
