# 국방 인텔리전스 브리핑 에이전트

버튼 하나로 매일 국방·안보 브리핑을 생성하는 개인 웹 서비스입니다.

---

## 💰 비용

| 항목 | 비용 |
|------|------|
| Vercel 호스팅 | **무료** |
| Claude API (1회 생성) | 약 ₩30 |
| 월 30회 생성 기준 | 약 ₩900/월 |

---

## 🚀 배포 방법 (10분 소요)

### STEP 1 — GitHub에 업로드
1. [github.com](https://github.com) 회원가입 (이미 있으면 생략)
2. 우상단 `+` → `New repository` → 이름 입력 → `Create repository`
3. 이 폴더의 파일 전체를 업로드 (`uploading an existing file` 클릭)

### STEP 2 — Vercel 배포
1. [vercel.com](https://vercel.com) 접속 → GitHub으로 로그인
2. `Add New Project` → 위에서 만든 저장소 선택 → `Deploy`
3. 배포 완료 후 URL 확인 (예: `https://defense-briefing-xxx.vercel.app`)

### STEP 3 — API 키 설정 (핵심!)
1. Vercel 프로젝트 대시보드 → `Settings` → `Environment Variables`
2. 아래 값 추가:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** (Anthropic Console에서 발급받은 API 키)
3. `Save` → `Deployments` 탭에서 `Redeploy`

### STEP 4 — API 키 발급
1. [console.anthropic.com](https://console.anthropic.com) 접속
2. `API Keys` → `Create Key` → 복사
3. 결제 수단 등록 (사용량만큼만 청구, 월 몇백~천 원 수준)

---

## 📱 스마트폰에서 사용
배포된 URL을 스마트폰 홈 화면에 추가하면 앱처럼 사용 가능합니다.
- iPhone: Safari → 공유 → 홈 화면에 추가
- Android: Chrome → 메뉴 → 홈 화면에 추가

---

## 🔒 보안
API 키는 Vercel 환경변수에만 저장되며 외부에 노출되지 않습니다.
프론트엔드 코드에는 API 키가 포함되어 있지 않습니다.
