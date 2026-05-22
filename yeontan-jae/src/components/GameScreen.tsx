import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { initStage1 } from '../stages/stage1';
import { initStage2 } from '../stages/stage2';
import { initStage3 } from '../stages/stage3';
import AdminPanel from './AdminPanel';

const ADMIN_ENABLED = true;

const STAGE_NAMES: Record<number, string> = {
  1: '연탄재',
  2: '너는',
  3: '뜨거운 사람',
};

declare global {
  interface Window {
    gameStartS1?: () => void;
    gameStartS2?: () => void;
    gameStartS3?: () => void;
    initStage1?: () => void;
    initStage2?: () => void;
    initStage3?: () => void;
    onStageClear?: (stageNum: number) => void;
    onGameComplete?: () => void;
  }
}

export default function GameScreen() {
  const navigate = useNavigate();
  const [currentStage, setCurrentStage] = useState(1);
  const [interludeVisible, setInterludeVisible] = useState(false);
  const [transitionBlack, setTransitionBlack] = useState(true);
  const [adminOpen, setAdminOpen] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    initStage1();
    initStage2();
    initStage3();

    window.onStageClear = (stageNum: number) => {
      if (stageNum < 3) {
        advanceToStage(stageNum + 1);
      }
    };

    window.onGameComplete = () => {};

    activateStage(1);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate({ to: '/' });
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function activateStage(n: number) {
    setCurrentStage(n);

    document.querySelectorAll<HTMLDivElement>('.sw').forEach((el) => {
      el.classList.remove('active');
    });
    const sw = document.getElementById('sw' + n);
    if (sw) {
      sw.classList.add('active');
      const ts = sw.querySelector<HTMLDivElement>('[id$="title_screen"]');
      if (ts) {
        ts.style.display = 'none';
      }
    }

    setInterludeVisible(true);
    setTimeout(() => {
      setTransitionBlack(false);
      setTimeout(() => setInterludeVisible(false), 1800);
    }, 400);

    setTimeout(() => {
      const startFn = (window as any)['gameStartS' + n];
      if (typeof startFn === 'function') startFn();
    }, 2300);
  }

  function advanceToStage(n: number) {
    setTransitionBlack(true);
    setTimeout(() => {
      activateStage(n);
    }, 1200);
  }

  return (
    <>
      <div
        id="screen-transition"
        className={transitionBlack ? 'black' : ''}
      />
      <div
        id="stage-interlude"
        className={interludeVisible ? 'show' : ''}
      >
        <div className="si-label">Stage 0{currentStage}</div>
        <div className="si-title">{STAGE_NAMES[currentStage]}</div>
      </div>

      <button
        id="stage-restart-btn"
        onClick={() => {
          const fn = (window as any)['gameStartS' + currentStage];
          if (typeof fn === 'function') fn();
        }}
      >
        &#8635; 스테이지 다시 시작
      </button>
      {ADMIN_ENABLED && (
        <button id="admin-toggle" onClick={() => setAdminOpen(true)}>
          &#9881; 관리자 모드
        </button>
      )}
      {adminOpen && (
        <AdminPanel stage={currentStage} onClose={() => setAdminOpen(false)} />
      )}

      {/* === STAGE 1 — 연탄재 === */}
      <div className="sw" id="sw1">
        <svg id="s1cursor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="4" />
          <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(180,175,168,0.3)" strokeWidth="0.5" />
        </svg>
        <canvas id="s1ash_canvas" />
        <canvas id="s1game_canvas" />
        <div id="s1hud">
          <div id="s1poem_strip">
            <div className="poem-line" id="s1line0">연탄재 함부로</div>
            <div className="poem-line" id="s1line1">차지 마라</div>
          </div>
          <div id="s1stage_label">Stage 1 &middot; 연탄재</div>
          <div id="s1fragment_hud">
            <div className="frag-dot" id="s1dot0" />
            <div className="frag-dot" id="s1dot1" />
          </div>
          <div id="s1controls_hint">
            방향키 / WASD &middot; 이동<br />
            &uarr; / Space &middot; 점프
          </div>
          <div id="s1word_popup" />
        </div>
        <div id="s1stage_clear">
          <div className="clear-poem">
            연탄재 함부로<br />차지 마라
          </div>
          <div className="poet-note">&mdash; 안도현, 1996</div>
        </div>
        <div id="s1title_screen">
          <div className="title-label">POEM GAME</div>
          <div className="title-main">연탄재 함부로<br />차지 마라</div>
          <div className="title-sub">스테이지 1 &mdash; 연탄재</div>
          <div className="title-author">안도현 (安度眩)</div>
        </div>
      </div>

      {/* === STAGE 2 — 너는 === */}
      <div className="sw" id="sw2">
        <svg id="s2cursor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
          <circle cx="9" cy="9" r="3" fill="rgba(140,170,225,0.8)" />
          <circle cx="9" cy="9" r="7" fill="none" stroke="rgba(120,150,210,0.3)" strokeWidth="0.5" />
        </svg>
        <canvas id="s2game_canvas" />
        <div id="s2hud">
          <div id="s2poem_strip">
            <div className="poem-line" id="s2line0">너는</div>
            <div className="poem-line" id="s2line1">누구에게 한번이라도</div>
          </div>
          <div id="s2stage_label">Stage 2 &middot; 너는</div>
          <div id="s2fragment_hud">
            <div className="frag-dot" id="s2dot0" />
            <div className="frag-dot" id="s2dot1" />
          </div>
          <div id="s2ctrl">
            방향키 이동 &middot; &uarr; 점프
          </div>
          <div id="s2word_popup" />
        </div>
        <div id="s2stage_clear">
          <div className="clear-poem">
            너는<br />누구에게 한번이라도
          </div>
          <div className="poet-note">&mdash; 안도현, 1996</div>
        </div>
        <div id="s2title_screen">
          <div className="t-tag">POEM GAME</div>
          <div className="t-main">너는</div>
          <div className="t-sub">스테이지 2 &mdash; 성찰</div>
        </div>
      </div>

      {/* === STAGE 3 — 뜨거운 사람 === */}
      <div className="sw" id="sw3">
        <svg id="s3cursor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
          <circle cx="9" cy="9" r="3" fill="rgba(240,170,80,0.85)" />
          <circle cx="9" cy="9" r="7" fill="none" stroke="rgba(220,150,60,0.3)" strokeWidth="0.5" />
        </svg>
        <canvas id="s3ember_canvas" />
        <canvas id="s3game_canvas" />
        <div id="s3hud">
          <div id="s3poem_strip">
            <div className="poem-line" id="s3line0">뜨거운 사람이었느냐</div>
          </div>
          <div id="s3stage_label">Stage 3 &middot; 뜨거운 사람</div>
          <div id="s3fragment_hud">
            <div className="frag-dot" id="s3dot0" />
          </div>
          <div id="s3ctrl">
            방향키 이동 &middot; &uarr; 점프
          </div>
          <div id="s3word_popup" />
        </div>
        <div id="s3ending_screen">
          <div id="s3ending_poem">
            연탄재 함부로 차지 마라<br />
            <br />
            너는<br />
            누구에게 한번이라도<br />
            뜨거운 사람이었느냐
          </div>
          <div id="s3ending_poet">&mdash; 안도현 (安度眩), 1996</div>
          <div id="s3ending_author_note">
            안도현(1961–)은 경북 예천 출신의 시인입니다.<br />
            소박하고 따뜻한 시선으로 일상 속 진실을 포착하며,<br />
            「연탄재 함부로 차지 마라」는 자신의 온기를 다 쏟아낸<br />
            존재에 대한 존경과, 나 자신에게 던지는<br />
            뜨거운 질문을 담고 있습니다.
          </div>
          <button id="s3restart_btn" onClick={() => location.reload()}>
            처음부터 다시
          </button>
        </div>
        <div id="s3title_screen">
          <div className="t-tag">POEM GAME &middot; 마지막 스테이지</div>
          <div className="t-main">뜨거운<br />사람</div>
          <div className="t-sub">스테이지 3 &mdash; 깨달음</div>
          <div className="t-verse">뜨거운 사람이었느냐</div>
        </div>
      </div>
    </>
  );
}
