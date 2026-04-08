# CreatePoemGameProject — 시(詩) 게임 자동 생성 프롬프트

이 문서는 AI에게 **시 제목과 시인 이름만 전달하면**, AI가 시 전문을 스스로 찾아서(또는 지식 기반으로 재구성하여) 횡스크롤 포임(Poem) 게임 프로젝트를 자동으로 생성하도록 하는 프롬프트입니다.

> **⚠ 필수 선행 문서**
> 이 문서는 **[# POEM GAME — 설계 의도 문서.md](# POEM GAME — 설계 의도 문서.md)** 와 짝을 이룹니다.
> 본 문서(`CreatePoemGameProject.md`)는 **프로젝트의 기술 구조·파일 레이아웃·생성 절차**를 정의하고,
> 짝 문서(`설계 의도 문서.md`)는 **시 → 게임 요소 도출 방법론**(연 분석·메카닉 카탈로그·색/사운드/속도/지형 도출 규칙·금지 사항)을 정의합니다.
>
> AI는 새로운 시로 게임을 만들기 전에 **반드시 두 문서를 모두 읽고**, 다음 순서로 작업합니다:
> 1. `설계 의도 문서.md` §0 철학과 §8 금지 사항을 머리에 새긴다
> 2. `설계 의도 문서.md` §2 워크시트를 모든 연에 대해 채운다
> 3. `설계 의도 문서.md` §3 메카닉 카탈로그에서 각 연의 메카닉을 도출한다
> 4. `설계 의도 문서.md` §4·§5·§6·§7로 색·사운드·속도·지형을 도출한다
> 5. 본 문서의 프로젝트 구조와 기술 스택대로 코드를 생성한다
> 6. `설계 의도 문서.md` §9 체크리스트로 검증한다
>
> 부록 A의 「나와 나타샤와 흰 당나귀」 케이스 스터디는 **구체 예시**로 항상 참조합니다.

---

## 사용법

1. 새 폴더를 만듭니다 (예: `my-poem-game/`)
2. 이 파일의 내용을 AI에게 전달하면서, **시 제목**과 **시인 이름**만 알려줍니다
3. AI가 시 전문을 찾아(또는 재현하여) 아래 구조의 프로젝트를 자동 생성합니다

### 예시 프롬프트:

```
아래 CreatePoemGameProject.md 프롬프트대로 포임게임 프로젝트를 만들어줘.

시: 진달래꽃
시인: 김소월
```

또는 더 간결하게:

```
포임게임 만들어줘: 김소월 「진달래꽃」
```

AI는 다음 단계를 **스스로** 수행합니다:

1. **시 전문 확보**
   - 지식 기반에서 시 전문을 불러옴 (대중적으로 잘 알려진 시는 바로 재현 가능)
   - 불확실하거나 잘 모르는 시일 경우, WebFetch/WebSearch로 검색하여 확보
   - 시 전문, 발표 연도, 시인의 한자 이름을 정확히 확인
2. **시 분석**
   - 연(stanza) 단위로 분할 → 스테이지 수 결정
   - 각 연의 분위기/색채/이미지 파악 → 스테이지별 테마 결정
   - 탈것/장소전환/특수 이벤트 식별 → 메커닉 결정
3. **시인 정보 수집**
   - 출생/사망 연도, 출신지, 문학사적 위치
   - 이 시의 창작 배경과 의미 해석
4. **프로젝트 생성**
   - 아래 명시된 구조대로 파일 작성

---

## 프로젝트 구조

```
project-root/
├── index.html          # 메인 HTML (메뉴 + 스테이지 HTML)
├── css/
│   └── common.css      # 모든 스타일
├── js/
│   ├── game.js         # 게임 컨트롤러 (메뉴, 화면전환, 자동진행)
│   ├── stage1.js       # 스테이지 1 (IIFE 래핑)
│   ├── stage2.js       # 스테이지 2
│   ├── ...
│   └── stageN.js       # 마지막 스테이지
└── README.md           # (선택)
```

---

## AI에게 전달할 전체 프롬프트

사용자는 **시 제목과 시인 이름만** 전달합니다. AI가 나머지(시 전문, 연도, 한자, 시인 정보, 해석)를 스스로 확보합니다.

아래 내용을 AI에게 **그대로** 전달하되, `{{시_제목}}`과 `{{시인_이름}}`만 채우세요.

---

### 프롬프트 시작

```
다음 시를 기반으로 횡스크롤 포임(Poem) 게임 프로젝트를 만들어줘.

## 입력 (사용자가 제공)
- 제목: {{시_제목}}
- 시인: {{시인_이름}}

## 먼저 해야 할 일 (AI가 자동 수행)
시 제목과 시인 이름만 주어졌으니, 다음 정보를 **스스로** 확보해줘:

1. **시 전문** — 연(stanza)과 행(line)을 정확히 구분하여 확보
   - 네가 확실히 알고 있는 시면 지식 기반에서 바로 사용
   - 불확실하면 WebSearch / WebFetch 도구로 검색해서 정확한 원문을 확인
   - **원문 그대로**를 사용 (현대어 번역본이 아닌 원작 그대로)
2. **메타데이터** — 시인의 한자 이름, 발표 연도, 수록 시집
3. **시인 약력** — 출생/사망 연도, 출신지, 문학사적 위치, 대표작
4. **시 해석** — 창작 배경, 주제, 상징, 역사적 맥락
5. **분위기 분석** — 각 연의 계절/시간/색채/감정을 파악해서 스테이지 테마로 매핑

이 정보들을 확보한 뒤에야 프로젝트 생성을 시작해. 확보한 시 전문이 긴 경우 사용자에게 "이 시 전문으로 진행하면 될까요?" 하고 한 번 확인해도 좋음 (단, 잘 알려진 시는 바로 진행).

만약 주어진 제목+시인 조합의 시를 도저히 찾을 수 없으면, 사용자에게 시 전문을 제공해달라고 요청해.

## 요구사항

### 1. 스테이지 분할
- 시의 각 연(stanza)을 하나의 스테이지로 만들어줘
- 각 스테이지에는 해당 연의 시어가 파편(fragment)으로 흩어져 있고, 플레이어가 수집해야 함
- 모든 파편을 수집하면 해당 연이 완성되고, 클리어 화면이 나온 뒤 자동으로 다음 스테이지로 넘어감
- 마지막 스테이지는 엔딩 화면(전체 시 표시 + 시인 소개)으로 끝남

### 2. 메뉴 화면
메인 메뉴에 3개 버튼:
- **시작하기** — 스테이지 1부터 시작
- **설정** — 조작키 안내(방향키/WASD/Space=점프, E=조사, R=탑승) + 프로그램 구성 설명
- **{{시_제목}}란** — 시에 대한 설명 (시인 소개, 시의 배경/의미, 창작 맥락)
  - 버튼 라벨은 시 제목에 맞게 자연스럽게 (예: "진달래꽃이란", "님의 침묵이란")

### 3. 게임 메커닉
각 스테이지는 HTML5 Canvas 기반 횡스크롤 플랫포머:
- **플레이어**: 걷기(방향키/WASD), 점프(↑/W/Space), 조사(E)
- **시어 파편**: 다이아몬드 형태 크리스탈, 부유하며 빛남, 접근하면 시구 표시, 터치하면 수집
- **HUD**: 상단에 시 구절(수집되면 빛남), 하단에 파편 수집 도트, 우하단에 조작 힌트
- **스테이지 클리어**: 전체 연 표시 + 시인 이름 → 3초 후 자동으로 다음 스테이지

### 4. 스테이지별 테마 변주
각 스테이지는 시의 분위기에 맞는 고유한 비주얼 테마를 가져야 함. **테마 도출은 짝 문서 `설계 의도 문서.md`의 도출 규칙을 그대로 따른다**:

- **배경색/팔레트** → 설계 의도 문서 §4 (감정 → 색 온도 매핑 표). 첫 연 → 마지막 연으로 갈수록 색 여정이 한 방향으로 변화해야 함.
- **배경 오브젝트/지형** → 설계 의도 문서 §7 (시의 공간 → 지형 패턴 표).
- **날씨/환경 변화** → 설계 의도 문서 §6.2 (시간은 타이머 금지, 환경 누적 변화로만 표현).
- **사운드 3계층** → 설계 의도 문서 §5 (환경음·행동음·멜로디).
- **메카닉 선택** → 설계 의도 문서 §3 메카닉 카탈로그에서 검색해 매핑. 시에 새 요소가 나오면 카탈로그에 항목 추가 권장.

⚠ 모든 스테이지에 같은 메카닉을 쓰지 말 것. 각 연의 감정이 다르면 메카닉도 달라야 함 (설계 의도 문서 §8).

### 5. 선택적 메커닉 (시 내용에 따라)
시에 탈것(당나귀, 말, 배 등)이 등장하면:
- R키로 탑승/하차 가능한 탈것 추가
- 탑승 시 이동 속도 증가, 점프력 변화

시에 특정 장소 전환이 있으면:
- E키로 문/입구를 통해 방(room) 전환
- 각 방마다 다른 배경과 파편 배치

시에 특별한 이벤트/감정 전환이 있으면:
- 오버레이 연출 (화면 전체에 텍스트 표시)

### 6. 기술 스택
**Vite + React + TypeScript + TanStack Router + HTML5 Canvas**

- `package.json`에 다음 의존성 포함:
  - `react`, `react-dom`, `@tanstack/react-router`
  - devDeps: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`
- `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts` 설정
- `index.html`은 Vite 엔트리 (root div + main.tsx 로드)
- `src/main.tsx`가 `RouterProvider`로 앱 마운트
- `src/routeTree.tsx`에 TanStack Router 라우트 정의: `/`, `/settings`, `/poem`, `/game`
- 각 스테이지 게임 로직(`src/stages/stageN.ts`)은 기존 vanilla JS를 `export function initStageN()`로 래핑
  - 상단에 `let _stageNInitialized = false;` 플래그로 idempotent (React StrictMode 이중 마운트 대비)
  - `// @ts-nocheck` 주석으로 TS 엄격 모드 완화 (vanilla JS 그대로 포팅용)
  - 함수 내부에서 `window.gameStartSN`, `window.initStageN`을 할당
- `src/components/GameScreen.tsx`:
  - 마운트 시 `initStage1~5()` 호출
  - `window.onStageClear(N)` = React의 `setCurrentStage(N+1)` 트리거
  - `window.onGameComplete()` = 엔딩 처리
  - 5개 스테이지 HTML을 JSX로 모두 렌더링 (CSS class `.active`로 가시성 전환)
  - `ESC` 키로 `/`로 돌아가기 (`useNavigate`)
- CSS는 각 스테이지를 `#swN` prefix로 스코핑 (`src/styles/common.css`)
- Google Fonts: Noto Serif KR + Noto Sans KR (index.html head에서 로드)
- 커서 숨기고 커스텀 SVG 커서 사용

### 7. 비주얼 스타일
- 어두운 배경 (#03050c ~ #0a1520 계열)
- 반투명 텍스트/UI (rgba 활용)
- 미니멀한 선(0.5px border)
- 부드러운 트랜지션과 애니메이션
- 시의 분위기에 맞는 text-shadow 글로우 효과
- 전체적으로 시적이고 명상적인 분위기

### 8. 설정 화면 내용
- 조작키: ← → ↑ (이동/점프), A D W (대체), Space (점프), E (오브젝트 조사), R (탑승/하차)
- 프로그램 구성: "이 게임은 [시인]의 시 「[제목]」을 [N]개의 스테이지로 나누어, 각 구절의 파편을 수집하며 시를 완성하는 횡스크롤 탐험 게임입니다."

### 9. 시 설명 화면 내용
- 시 제목 + 시인(한자) + 연도
- 시 전문
- 시인 소개 (출생~사망, 출신지, 문학적 위치)
- 시의 배경과 의미 해석
- 창작 맥락 (어떤 상황에서 쓰였는지)

### 10. 자동 진행 플로우
메뉴 → 시작하기 클릭 → Stage 1 인터루드(2.3초) → 자동 게임 시작 → 게임플레이 → 클리어 → (3초) → Stage 2 인터루드 → 자동 게임 시작 → ... → Stage N 클리어 → 엔딩 화면 (전체 시 + 시인 소개 + "처음부터 다시" 버튼)

각 스테이지의 별도 "시작하기" 버튼은 없음. 한 게임처럼 쭉 이어져야 함.
중간에 메뉴로 돌아가려면 ESC 키.

### 11. 관리자 모드 (튜닝용 — 배포 시 제거)

각 스테이지는 게임 디자인을 쉽게 조정할 수 있도록 다음 패턴을 따라야 함:

**(1) 각 `src/stages/stageN.ts` 상단에 `tunables` 객체 + `// @TUNABLE` 주석:**
```ts
const tunables = {
  playerStartX: 120,        // @TUNABLE 캐릭터 시작 X
  playerStartY: -46,        // @TUNABLE 캐릭터 시작 Y (groundY 기준 오프셋)
  jumpForce: -10.5,         // @TUNABLE 점프 힘 (음수가 강함)
  moveSpeed: 3.0,           // @TUNABLE 이동 속도
  gravity: 0.44,            // @TUNABLE 중력
  fragments: [
    { x: 480,  yOffset: -60  }, // @TUNABLE 다이아 0
    { x: 1080, yOffset: -230 }, // @TUNABLE 다이아 1
    // …연 길이에 맞게
  ],
  labelOffsetY: -24,        // @TUNABLE 다이아 위 시구 라벨 Y 오프셋
  labelFontSize: 13,        // @TUNABLE 다이아 위 라벨 폰트 크기
  popupFontSize: 19,        // @TUNABLE 수집 시 팝업 폰트 크기
  popupFadeMs: 1100,        // @TUNABLE 수집 팝업 표시 시간 (ms)
};
```

**(2) 게임 로직에서 하드코딩 대신 `tunables.X` 참조:**
- `player.vy = tunables.jumpForce` (점프 시)
- `player.vy += tunables.gravity` (매 프레임)
- `player.vx = ±tunables.moveSpeed`
- 다이아 라벨 그리기: `ctx.font = ${tunables.labelFontSize}px ...; ctx.fillText(word, fx, fy + tunables.labelOffsetY)`
- 수집 팝업: `popup.style.fontSize = tunables.popupFontSize + 'px'; setTimeout(..., tunables.popupFadeMs)`

**(3) `gameStartSN()`을 진짜 reset 함수로 만들기:**
- `_running` 플래그로 중복 게임루프 방지
- 캐릭터 위치, 다이아 수집 상태, HUD class 모두 초기 상태로 복원

**(4) `window.s<N>API` 등록 — 관리자 패널이 읽음:**
```ts
(window as any).s1API = {
  tunables,
  schema: {
    playerStartX:  { min: 0,    max: 3000, step: 10,  label: '캐릭터 시작 X' },
    jumpForce:     { min: -20,  max: -3,   step: 0.5, label: '점프 힘' },
    // … 각 키마다 슬라이더 범위
  },
  fragmentSchema: { xMin: 0, xMax: 3200, yOffsetMin: -400, yOffsetMax: 0 },
  setTunable(key, value) { (tunables as any)[key] = value; },
  setFragment(idx, x, yOffset) { /* tunables.fragments + live fragments 모두 갱신 */ },
  restart: gameStartS1,
};
```

**(5) `src/components/AdminPanel.tsx` (모달 + 슬라이더 UI):**
- 좌측 하단의 "⚙ 관리자 모드" 버튼 클릭 시 열림
- 현재 스테이지(`window.s<N>API`)의 `schema`를 읽어 슬라이더 자동 생성
- 각 슬라이더는 숫자 값을 함께 표시
- "이 스테이지 다시 시작" 버튼 → `api.restart()` 호출
- "현재 값 복사 (코드용)" 버튼 → tunables를 클립보드에 복사 → 코드에 붙여넣기 가능

**(6) 배포 시 제거:**
- `GameScreen.tsx` 상단에 `const ADMIN_ENABLED = true;` 플래그
- 배포 빌드 전 `false`로 변경하면 관리자 버튼이 사라짐
- 사용자가 슬라이더로 찾은 값은 `tunables` 블록에 직접 하드코딩

## 참고: 프로젝트 구조
```
project-root/
├── index.html                     # Vite 엔트리
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── src/
│   ├── main.tsx                   # React 엔트리 + RouterProvider
│   ├── routeTree.tsx              # TanStack Router 라우트
│   ├── styles/
│   │   └── common.css
│   ├── components/
│   │   ├── Menu.tsx               # 시작하기/설정/시설명 버튼
│   │   ├── Settings.tsx
│   │   ├── PoemInfo.tsx
│   │   ├── GameScreen.tsx         # N 스테이지 관리 + 자동진행 + 관리자 버튼
│   │   └── AdminPanel.tsx         # 튜닝용 모달 (배포 시 제거 가능)
│   └── stages/
│       ├── stage1.ts              # tunables 블록 + window.s1API
│       ├── stage2.ts
│       ├── stage3.ts
│       └── ...                    # 연 개수만큼
└── README.md
```

레퍼런스 프로젝트: /Users/cclss/Desktop/me-natasha-white-donkey/ (백석 「나와 나타샤와 흰 당나귀」)
— 파일 구조, tunables 패턴, AdminPanel 구현 모두 그대로 참고할 것.

설계 방법론 문서: ./# POEM GAME — 설계 의도 문서.md
— 시 → 게임 변환의 모든 도출 규칙(워크시트, 메카닉 카탈로그, 색/사운드/속도/지형 도출, 금지 사항).
— 부록 A에 위 레퍼런스 프로젝트의 5개 스테이지 케이스 스터디 포함.
— 새 시 작업 전 반드시 정독.
```

### 프롬프트 끝

---

## 핵심 체크리스트

AI가 생성한 프로젝트가 다음을 만족하는지 확인:

- [ ] 시 전문이 원작 그대로 정확히 사용됨 (AI가 직접 확보)
- [ ] 시의 각 연이 하나의 스테이지로 분할됨
- [ ] `npm install && npm run dev`로 바로 실행됨
- [ ] `npm run build`가 에러 없이 성공
- [ ] TanStack Router `/`, `/settings`, `/poem`, `/game` 4개 라우트 작동
- [ ] 각 스테이지가 `src/stages/stageN.ts`로 분리되고 `initStageN()` export
- [ ] `_stageNInitialized` 플래그로 StrictMode 이중 마운트 처리
- [ ] 변수 충돌 없음 (각 스테이지가 자체 함수 스코프)
- [ ] 각 스테이지에 `tunables` 블록 + `// @TUNABLE` 주석 표기
- [ ] 각 스테이지가 `window.s<N>API`를 등록 (관리자 패널이 읽음)
- [ ] `_running` 플래그로 게임루프 중복 실행 방지
- [ ] `gameStartSN()`이 진짜 reset 함수 (위치/HUD/수집상태 초기화)
- [ ] `AdminPanel.tsx` 좌하단 버튼으로 토글 가능
- [ ] AdminPanel에서 슬라이더 + 숫자 + 다시 시작 버튼 + 값 복사 작동
- [ ] `ADMIN_ENABLED` 플래그로 배포 시 제거 가능
- [ ] 메뉴 화면에 시작하기/설정/시설명 3개 버튼
- [ ] 설정에 조작키 + 프로그램 설명
- [ ] 시 설명 페이지에 시인 소개(출생~사망, 출신지) + 시 해석 + 창작 맥락
- [ ] 스테이지 클리어 → 자동으로 다음 스테이지 (메뉴 안 거침)
- [ ] 마지막 스테이지 → 엔딩 화면 (전체 시 표시)
- [ ] 각 스테이지 고유 색상/분위기 (시의 연별 이미지에 맞게)
- [ ] 커스텀 커서
- [ ] 시어 파편 수집 시 HUD 업데이트

---

## 사용 예시 (한 줄)

```
포임게임 만들어줘: 윤동주 「서시」
포임게임 만들어줘: 한용운 「님의 침묵」
포임게임 만들어줘: 김소월 「진달래꽃」
포임게임 만들어줘: 정지용 「향수」
```

이렇게만 전달하면 AI가 CreatePoemGameProject.md를 읽고 시 전문을 확보한 뒤 프로젝트를 생성합니다.
