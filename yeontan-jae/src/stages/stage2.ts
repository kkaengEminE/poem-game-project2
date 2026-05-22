// @ts-nocheck
let _stage2Initialized = false;
export function initStage2() {
  if (_stage2Initialized) return;
  _stage2Initialized = true;

// ─────────────────────────────────────────
//  CURSOR
// ─────────────────────────────────────────
const cursorEl = document.getElementById('s2cursor');
document.addEventListener('mousemove', e => {
  cursorEl.style.left = e.clientX + 'px';
  cursorEl.style.top  = e.clientY + 'px';
});

// ─────────────────────────────────────────
//  GAME ENGINE
// ─────────────────────────────────────────
const canvas = document.getElementById('s2game_canvas');
const ctx = canvas.getContext('2d');

let W, H;
function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', () => { resize(); buildWorld(); });

const WORLD_W = 2200;
let camX = 0;
let gameStarted = false;
let gameOver = false;
let collectedCount = 0;
const TOTAL_FRAGMENTS = 2;

// ─────────────────────────────────────────
//  @TUNABLES  (stage 2) — 성찰의 공간
// ─────────────────────────────────────────
const tunables = {
  playerStartX: 120,        // @TUNABLE
  playerStartY: -48,        // @TUNABLE
  jumpForce: -12,           // @TUNABLE (무거운 점프)
  moveSpeed: 2.0,           // @TUNABLE (느린 이동 — 성찰)
  gravity: 0.7,             // @TUNABLE
  fragments: [
    { x: 650,  yOffset: -120 }, // @TUNABLE 다이아 0
    { x: 1550, yOffset: -150 }, // @TUNABLE 다이아 1
  ],
  labelOffsetY: -24,        // @TUNABLE
  labelFontSize: 14,        // @TUNABLE
  popupFontSize: 20,        // @TUNABLE
  popupFadeMs: 1300,        // @TUNABLE
};

const player = {
  x: 120, y: 0, vy: 0, vx: 0,
  w: 22, h: 48,
  onGround: false, dir: 1,
  walkFrame: 0, walkTimer: 0,
  breathPhase: 0,
};

const keys = {};
document.addEventListener('keydown', e => { keys[e.key] = true; });
document.addEventListener('keyup',   e => { keys[e.key] = false; });

let platforms = [];
let groundY = 0;

function buildWorld() {
  groundY = H * 0.75;
  platforms = [
    { x: -200, y: groundY, w: WORLD_W + 400, h: H },
    { x: 450,  y: groundY - 80,  w: 130, h: 20 },
    { x: 800,  y: groundY - 130, w: 110, h: 20 },
    { x: 1100, y: groundY - 70,  w: 150, h: 20 },
    { x: 1400, y: groundY - 110, w: 120, h: 20 },
    { x: 1700, y: groundY - 60,  w: 140, h: 20 },
  ];
  player.y = groundY - player.h;
}
buildWorld();

const WORDS = ['너는', '누구에게 한번이라도'];
let fragments = [];

function initFragments() {
  fragments = tunables.fragments.map((f, i) => ({
    x: f.x,
    y: groundY + f.yOffset,
    word: WORDS[i],
    collected: false,
    bob: i,
  }));
}
initFragments();

// ── Reflective puddles on ground ──
const puddles = [];
for (let i = 0; i < 8; i++) {
  puddles.push({
    x: 300 + i * 240 + Math.random() * 80,
    w: 50 + Math.random() * 60,
    phase: Math.random() * Math.PI * 2,
  });
}

// ── Floating question marks (subtle) ──
const questionMarks = [];
for (let i = 0; i < 12; i++) {
  questionMarks.push({
    x: 200 + i * 170 + Math.random() * 60,
    baseY: groundY * 0.3 + Math.random() * groundY * 0.3,
    phase: Math.random() * Math.PI * 2,
    size: 10 + Math.random() * 8,
    alpha: 0.04 + Math.random() * 0.06,
  });
}

// ─────────────────────────────────────────
//  DRAW FUNCTIONS
// ─────────────────────────────────────────

function drawSky() {
  const grad = ctx.createLinearGradient(0, 0, 0, groundY + 30);
  grad.addColorStop(0,   '#060a14');
  grad.addColorStop(0.5, '#0c1424');
  grad.addColorStop(1,   '#141e30');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawStars() {
  ctx.save();
  const offsetX = camX * 0.01;
  for (let i = 0; i < 60; i++) {
    const seed = i * 137.508;
    const sx = ((seed * 93.7 + offsetX) % W + W) % W;
    const sy = ((seed * 51.3) % (groundY * 0.6)) + 15;
    const br = 0.2 + (Math.sin(Date.now() / 1000 + i * 0.7) * 0.5 + 0.5) * 0.35;
    const r  = i % 6 === 0 ? 1.1 : 0.5;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(170,190,220,${br})`;
    ctx.fill();
  }
  ctx.restore();
}

function drawQuestionMarks() {
  const t = Date.now() / 1000;
  questionMarks.forEach(q => {
    const qx = q.x - camX * 0.15;
    const qy = q.baseY + Math.sin(t * 0.4 + q.phase) * 10;
    ctx.save();
    ctx.font = `${q.size}px "Noto Serif KR", serif`;
    ctx.fillStyle = `rgba(120,140,180,${q.alpha})`;
    ctx.textAlign = 'center';
    ctx.fillText('?', qx, qy);
    ctx.restore();
  });
}

function drawGround() {
  const grad = ctx.createLinearGradient(0, groundY, 0, H);
  grad.addColorStop(0, '#1a2438');
  grad.addColorStop(0.05, '#141c2e');
  grad.addColorStop(1, '#0c1220');
  ctx.fillStyle = grad;
  ctx.fillRect(0, groundY, W, H - groundY);
  // surface line
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(W, groundY);
  ctx.strokeStyle = 'rgba(100,120,160,0.2)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

function drawPuddles() {
  const t = Date.now() / 1000;
  puddles.forEach(p => {
    const px = p.x - camX;
    if (px < -80 || px > W + 80) return;
    const ripple = Math.sin(t * 0.8 + p.phase) * 0.3;
    // water reflection
    const glw = ctx.createRadialGradient(px + p.w/2, groundY + 3, 0, px + p.w/2, groundY + 3, p.w * 0.6);
    glw.addColorStop(0, `rgba(80,110,160,${0.12 + ripple * 0.04})`);
    glw.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glw;
    ctx.beginPath();
    ctx.ellipse(px + p.w/2, groundY + 3, p.w/2, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // subtle star reflections in puddle
    ctx.beginPath();
    ctx.arc(px + p.w * 0.3, groundY + 2, 0.8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(150,170,210,${0.2 + ripple * 0.1})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + p.w * 0.7, groundY + 3, 0.6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(140,160,200,${0.15 + ripple * 0.08})`;
    ctx.fill();
  });
}

function drawRaisedPlatforms() {
  platforms.slice(1).forEach(p => {
    const px = p.x - camX;
    if (px > W + 50 || px + p.w < -50) return;
    ctx.fillStyle = '#141c2e';
    ctx.fillRect(px, p.y + 3, p.w, p.h);
    ctx.fillStyle = '#1e2840';
    ctx.fillRect(px, p.y, p.w, 4);
    ctx.beginPath();
    ctx.moveTo(px, p.y);
    ctx.lineTo(px + p.w, p.y);
    ctx.strokeStyle = 'rgba(100,125,170,0.25)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  });
}

function drawFragments() {
  const t = Date.now() / 1000;
  fragments.forEach((f, i) => {
    if (f.collected) return;
    const fx = f.x - camX;
    if (fx < -100 || fx > W + 100) return;
    const bob = Math.sin(t * 1.5 + f.bob * 2) * 5;
    const fy = f.y - 20 + bob;
    // glow - cool blue
    const glw = ctx.createRadialGradient(fx, fy, 0, fx, fy, 50);
    glw.addColorStop(0, 'rgba(130,160,220,0.18)');
    glw.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glw;
    ctx.fillRect(fx - 50, fy - 50, 100, 100);
    // diamond
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(Math.sin(t * 0.8 + i) * 0.12);
    const pulse = 1 + Math.sin(t * 2 + i) * 0.05;
    ctx.scale(pulse, pulse);
    ctx.beginPath();
    ctx.moveTo(0, -14); ctx.lineTo(10, 0); ctx.lineTo(0, 14); ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(140,170,225,0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(120,150,210,0.12)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(170,195,240,0.85)';
    ctx.fill();
    ctx.restore();
    // hover label
    const dist = Math.hypot((f.x - player.x), (f.y - player.y + 30));
    if (dist < 70) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, (70 - dist) / 70);
      ctx.font = `${tunables.labelFontSize}px "Noto Serif KR", serif`;
      ctx.fillStyle = 'rgba(175,195,235,0.9)';
      ctx.textAlign = 'center';
      ctx.fillText(f.word, fx, fy + tunables.labelOffsetY);
      ctx.restore();
    }
  });
}

function drawPlayer() {
  const px = player.x - camX;
  const py = player.y;
  const t = Date.now() / 1000;
  player.breathPhase = t;

  ctx.save();
  ctx.translate(px, py);

  let legSwing = 0;
  let armSwing = 0;
  const moving = Math.abs(player.vx) > 0.5;
  if (moving) {
    player.walkTimer += 0.1;
    legSwing = Math.sin(player.walkTimer) * 10;
    armSwing = Math.cos(player.walkTimer) * 7;
  }

  const flip = player.dir < 0 ? -1 : 1;
  ctx.scale(flip, 1);

  // shadow
  ctx.save();
  ctx.scale(1, 0.3);
  ctx.beginPath();
  ctx.ellipse(0, player.h + 10, 14, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();
  ctx.restore();

  // legs
  ctx.strokeStyle = '#2a3450';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-4, player.h * 0.62); ctx.lineTo(-6 - legSwing * 0.3, player.h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4, player.h * 0.62); ctx.lineTo(6 + legSwing * 0.3, player.h); ctx.stroke();

  // coat
  ctx.beginPath();
  ctx.roundRect(-10, player.h * 0.3, 20, player.h * 0.4, 4);
  ctx.fillStyle = '#1e2845';
  ctx.fill();
  ctx.strokeStyle = '#2a3860';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // arms
  ctx.strokeStyle = '#1e2845';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-9, player.h * 0.35); ctx.lineTo(-16 - armSwing * 0.4, player.h * 0.55); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(9, player.h * 0.35); ctx.lineTo(16 + armSwing * 0.4, player.h * 0.5); ctx.stroke();

  // head
  const breathY = Math.sin(player.breathPhase * 1.5) * 0.5;
  const headY = player.h * 0.15 + breathY;
  ctx.beginPath();
  ctx.arc(0, headY, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#b8a890';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, headY - 2, 9, Math.PI, 0);
  ctx.fillStyle = '#1a1820';
  ctx.fill();

  // scarf
  ctx.beginPath();
  ctx.arc(0, headY + 7, 6, -0.3, Math.PI + 0.3);
  ctx.strokeStyle = '#2a3a60';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();
}

// ─────────────────────────────────────────
//  PHYSICS
// ─────────────────────────────────────────

function updatePlayer() {
  if (!gameStarted || gameOver) return;

  const left  = keys['ArrowLeft']  || keys['a'] || keys['A'];
  const right = keys['ArrowRight'] || keys['d'] || keys['D'];
  const jump  = keys['ArrowUp']    || keys['w'] || keys['W'] || keys[' '];

  if (left)  { player.vx = -tunables.moveSpeed; player.dir = -1; }
  if (right) { player.vx =  tunables.moveSpeed; player.dir =  1; }
  if (!left && !right) player.vx *= 0.7;

  if (jump && player.onGround) {
    player.vy = tunables.jumpForce;
    player.onGround = false;
  }

  player.vy += tunables.gravity;
  player.x  += player.vx;
  player.y  += player.vy;

  if (player.x < 80) player.x = 80;
  if (player.x > WORLD_W - 80) player.x = WORLD_W - 80;

  player.onGround = false;
  platforms.forEach(p => {
    const pb = player.y + player.h;
    const prevB = pb - player.vy;
    if (player.x + 10 > p.x && player.x - 10 < p.x + p.w) {
      if (prevB <= p.y && pb >= p.y && player.vy >= 0) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }
  });

  fragments.forEach((f, i) => {
    if (f.collected) return;
    const dist = Math.hypot(player.x - f.x, player.y + player.h/2 - f.y + 10);
    if (dist < 45) {
      f.collected = true;
      collectedCount++;
      collectFragment(i, f.word);
    }
  });

  const targetCam = player.x - W / 3;
  camX += (targetCam - camX) * 0.06;
  camX = Math.max(0, Math.min(camX, WORLD_W - W));
}

function collectFragment(i, word) {
  document.getElementById('s2dot' + i)?.classList.add('collected');
  document.getElementById('s2line' + i)?.classList.add('collected');
  const popup = document.getElementById('s2word_popup');
  popup.textContent = word;
  const fx = (fragments[i].x - camX);
  const fy = fragments[i].y;
  const margin = 200;
  const clampedX = Math.max(margin, Math.min(fx, W - margin));
  popup.style.left = clampedX + 'px';
  popup.style.top  = fy + 'px';
  popup.style.fontSize = tunables.popupFontSize + 'px';
  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), tunables.popupFadeMs);
  if (collectedCount >= TOTAL_FRAGMENTS) {
    setTimeout(showStageClear, 1500);
  }
}

function showStageClear() {
  gameOver = true;
  document.getElementById('s2stage_clear').classList.add('show');
  setTimeout(() => { if(window.onStageClear) window.onStageClear(2); }, 3000);
}

// ─────────────────────────────────────────
//  MAIN LOOP
// ─────────────────────────────────────────
let _running = false;
let lastTime = 0;
function gameLoop(ts) {
  if (!_running) return;
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;

  ctx.clearRect(0, 0, W, H);
  updatePlayer();

  drawSky();
  drawStars();
  drawQuestionMarks();
  drawGround();
  drawPuddles();
  drawRaisedPlatforms();
  drawFragments();
  drawPlayer();

  requestAnimationFrame(gameLoop);
}

function resetStateS2() {
  resize();
  buildWorld();
  initFragments();
  player.x = tunables.playerStartX;
  player.y = groundY + tunables.playerStartY;
  player.vx = 0; player.vy = 0;
  player.dir = 1;
  player.onGround = false;
  collectedCount = 0;
  gameOver = false;
  camX = 0;
  for (let i = 0; i < TOTAL_FRAGMENTS; i++) {
    document.getElementById('s2dot' + i)?.classList.remove('collected');
    document.getElementById('s2line' + i)?.classList.remove('collected');
  }
  document.getElementById('s2stage_clear')?.classList.remove('show');
}
function gameStartS2() {
  gameStarted = true;
  resetStateS2();
  if (!_running) {
    _running = true;
    requestAnimationFrame(gameLoop);
  }
}

(window as any).s2API = {
  tunables,
  schema: {
    playerStartX:   { min: 0,    max: 2200, step: 10,  label: '캐릭터 시작 X' },
    playerStartY:   { min: -200, max: 0,    step: 1,   label: '캐릭터 시작 Y' },
    jumpForce:      { min: -20,  max: -3,   step: 0.5, label: '점프 힘' },
    moveSpeed:      { min: 0.5,  max: 8,    step: 0.1, label: '이동 속도' },
    gravity:        { min: 0.1,  max: 1.5,  step: 0.05,label: '중력' },
    labelOffsetY:   { min: -80,  max: 0,    step: 1,   label: '다이아 라벨 Y 오프셋' },
    labelFontSize:  { min: 8,    max: 32,   step: 1,   label: '다이아 라벨 폰트 크기' },
    popupFontSize:  { min: 10,   max: 48,   step: 1,   label: '수집 팝업 폰트 크기' },
    popupFadeMs:    { min: 200,  max: 5000, step: 100, label: '수집 팝업 표시 시간(ms)' },
  },
  fragmentSchema: { xMin: 0, xMax: 2200, yOffsetMin: -400, yOffsetMax: 0 },
  setTunable(key: string, value: number) {
    (tunables as any)[key] = value;
  },
  setFragment(idx: number, x: number, yOffset: number) {
    if (tunables.fragments[idx]) {
      tunables.fragments[idx].x = x;
      tunables.fragments[idx].yOffset = yOffset;
      initFragments();
    }
  },
  restart: gameStartS2,
};

window.gameStartS2 = gameStartS2;
window.initStage2 = function() { resize(); buildWorld(); initFragments(); };

}
