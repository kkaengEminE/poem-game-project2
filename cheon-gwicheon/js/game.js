/* ═══════════════════════════════════════
   GAME CONTROLLER
   귀천 (歸天) — POEM GAME
   ═══════════════════════════════════════ */

const STAGE_NAMES = {
  1: '새벽빛과 이슬',
  2: '노을빛 기슭',
  3: '아름다웠더라'
};
const TOTAL_STAGES = 3;

let currentStage = null;
let gameStarted = false;

const GameController = {
  showMenu() {
    document.getElementById('settings-screen').classList.remove('active');
    document.getElementById('poem-screen').classList.remove('active');
    document.getElementById('menu-screen').classList.remove('out');
    document.getElementById('menu-screen').style.display = '';
  },

  showSettings() {
    document.getElementById('menu-screen').classList.add('out');
    setTimeout(() => {
      document.getElementById('settings-screen').classList.add('active');
    }, 300);
  },

  showPoemInfo() {
    document.getElementById('menu-screen').classList.add('out');
    setTimeout(() => {
      document.getElementById('poem-screen').classList.add('active');
    }, 300);
  },

  startGame() {
    document.getElementById('menu-screen').classList.add('out');
    setTimeout(() => {
      document.getElementById('menu-screen').style.display = 'none';
      launchStage(1);
    }, 800);
  }
};

// ─── Launch a stage ───
function launchStage(n) {
  currentStage = n;

  const trans = document.getElementById('screen-transition');
  trans.classList.add('black');

  setTimeout(() => {
    document.querySelectorAll('.sw').forEach(s => s.classList.remove('active'));

    const sw = document.getElementById('sw' + n);
    sw.classList.add('active');

    const ts = sw.querySelector('[id$="title_screen"]');
    if (ts) {
      ts.classList.remove('out', 'fade-out');
      ts.style.display = '';
      ts.style.opacity = '';
    }

    const siLabel = document.getElementById('si-label');
    const siTitle = document.getElementById('si-title');
    siLabel.textContent = 'Stage 0' + n;
    siTitle.textContent = STAGE_NAMES[n];
    document.getElementById('stage-interlude').classList.add('show');

    if (window['initStage' + n]) window['initStage' + n]();

    setTimeout(() => {
      trans.classList.remove('black');
      setTimeout(() => {
        document.getElementById('stage-interlude').classList.remove('show');
      }, 1800);
    }, 400);
  }, 700);
}

// ─── Global startGame (called by stage title screens) ───
function startGame() {
  if (!currentStage) return;

  const sw = document.getElementById('sw' + currentStage);
  const ts = sw.querySelector('[id$="title_screen"]');
  if (ts) {
    if (!ts.classList.contains('fade-out') && !ts.classList.contains('out')) {
      ts.classList.add(currentStage === 1 ? 'fade-out' : 'out');
    }
    setTimeout(() => { ts.style.display = 'none'; }, 1500);
  }

  gameStarted = true;
  setTimeout(() => {
    if (window['gameStartS' + currentStage]) {
      window['gameStartS' + currentStage]();
    }
  }, 100);
}

// ─── Stage clear handler (auto-advance) ───
window.onStageClear = function(stageNum) {
  if (stageNum < TOTAL_STAGES) {
    const trans = document.getElementById('screen-transition');
    trans.classList.add('black');

    setTimeout(() => {
      document.querySelectorAll('.sw').forEach(s => s.classList.remove('active'));

      const next = stageNum + 1;
      currentStage = next;

      const sw = document.getElementById('sw' + next);
      sw.classList.add('active');

      const ts = sw.querySelector('[id$="title_screen"]');
      if (ts) {
        ts.classList.remove('out', 'fade-out');
        ts.style.display = '';
        ts.style.opacity = '';
      }

      const siLabel = document.getElementById('si-label');
      const siTitle = document.getElementById('si-title');
      siLabel.textContent = 'Stage 0' + next;
      siTitle.textContent = STAGE_NAMES[next];
      document.getElementById('stage-interlude').classList.add('show');

      if (window['initStage' + next]) window['initStage' + next]();

      setTimeout(() => {
        trans.classList.remove('black');
        setTimeout(() => {
          document.getElementById('stage-interlude').classList.remove('show');
        }, 1800);
      }, 400);
    }, 1200);
  }
  // Stage 3 ending handled inside stage3.js
};

window.onGameComplete = function() {
  // Stage 3 ending screen handles itself
};

window.GameController = GameController;
