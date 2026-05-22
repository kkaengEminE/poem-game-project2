// @ts-nocheck
let _stage1Initialized = false;
export function initStage1() {
  if (_stage1Initialized) return;
  _stage1Initialized = true;

// ─────────────────────────────────────────
//  CURSOR
// ─────────────────────────────────────────
const cursorEl = document.getElementById('s1cursor');
let mx = 0, my = 0;
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursorEl.style.left = mx + 'px';
  cursorEl.style.top  = my + 'px';
});

// ─────────────────────────────────────────
//  ASH PARTICLES (연탄재 파티클)
// ─────────────────────────────────────────
const ashCanvas = document.getElementById('s1ash_canvas');
const ashCtx = ashCanvas.getContext('2d');
let ashParticles = [];

function resizeAsh() {
  ashCanvas.width  = window.innerWidth;
  ashCanvas.height = window.innerHeight;
}
resizeAsh();
window.addEventListener('resize', resizeAsh);

function initAsh() {
  ashParticles = [];
  for (let i = 0; i < 60; i++) {
    ashParticles.push({
      x: Math.random() * ashCanvas.width,
      y: Math.random() * ashCanvas.height,
      r: Math.random() * 1.8 + 0.5,
      speed: Math.random() * 0.3 + 0.05,
      drift: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.25 + 0.08,
      phase: Math.random() * Math.PI * 2,
    });
  }
}
initAsh();

function animateAsh() {
  ashCtx.clearRect(0, 0, ashCanvas.width, ashCanvas.height);
  const t = Date.now() / 1000;
  ashParticles.forEach(s => {
    s.y -= s.speed;
    s.x += s.drift + Math.sin(t * 0.3 + s.phase) * 0.2;
    if (s.y < -5) { s.y = ashCanvas.height + 5; s.x = Math.random() * ashCanvas.width; }
    if (s.x > ashCanvas.width) s.x = 0;
    if (s.x < 0) s.x = ashCanvas.width;
    ashCtx.beginPath();
    ashCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ashCtx.fillStyle = `rgba(180,175,168,${s.opacity})`;
    ashCtx.fill();
  });
  requestAnimationFrame(animateAsh);
}
animateAsh();

// ─────────────────────────────────────────
//  GAME ENGINE
// ─────────────────────────────────────────
const canvas = document.getElementById('s1game_canvas');
const ctx = canvas.getContext('2d');

let W, H;
function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', () => { resize(); buildWorld(); });

// ── State ──
const WORLD_W = 2400;
let camX = 0;
let gameStarted = false;
let gameOver = false;
let collectedCount = 0;
const TOTAL_FRAGMENTS = 2;

// ─────────────────────────────────────────
//  @TUNABLES  (stage 1)
// ─────────────────────────────────────────
const tunables = {
  playerStartX: 140,        // @TUNABLE 캐릭터 시작 X
  playerStartY: -48,        // @TUNABLE 캐릭터 시작 Y (groundY 기준 오프셋)
  jumpForce: -14,           // @TUNABLE 점프 힘
  moveSpeed: 2.6,           // @TUNABLE 이동 속도
  gravity: 0.8,             // @TUNABLE 중력
  fragments: [
    { x: 600,  yOffset: -140 }, // @TUNABLE 다이아 0
    { x: 1500, yOffset: -160 }, // @TUNABLE 다이아 1
  ],
  labelOffsetY: -25,        // @TUNABLE 다이아 위 시구 라벨 Y 오프셋
  labelFontSize: 14,        // @TUNABLE 다이아 위 라벨 폰트 크기
  popupFontSize: 22,        // @TUNABLE 수집 시 팝업 폰트 크기
  popupFadeMs: 1200,        // @TUNABLE 수집 팝업 표시 시간(ms)
};

// ── Player ──
const player = {
  x: 140, y: 0, vy: 0, vx: 0,
  w: 22, h: 48,
  onGround: false, dir: 1,
  walkFrame: 0, walkTimer: 0,
  breathPhase: 0,
};

// ── Keys ──
const keys = {};
document.addEventListener('keydown', e => { keys[e.key] = true; });
document.addEventListener('keyup',   e => { keys[e.key] = false; });

// ── Platforms / ground ──
let platforms = [];
let groundY = 0;

function buildWorld() {
  groundY = H * 0.75;
  platforms = [
    { x: -200, y: groundY, w: WORLD_W + 400, h: H },
    { x: 500,  y: groundY - 70,  w: 140, h: 20 },
    { x: 850,  y: groundY - 110, w: 120, h: 20 },
    { x: 1200, y: groundY - 80,  w: 160, h: 20 },
    { x: 1600, y: groundY - 60,  w: 130, h: 20 },
    { x: 1900, y: groundY - 90,  w: 150, h: 20 },
  ];
  player.y = groundY - player.h;
}
buildWorld();

// ── Word fragments ──
const WORDS = ['연탄재 함부로', '차지 마라'];
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

// ── Background: alley buildings ──
const buildings = [];
for (let i = 0; i < 24; i++) {
  buildings.push({
    x: i * 110 + Math.random() * 50,
    w: 50 + Math.random() * 40,
    h: 80 + Math.random() * 100,
    parallax: 0.2 + Math.random() * 0.15,
    hasChimney: Math.random() > 0.6,
    lit: Math.random() > 0.55,
    litX: Math.random(),
    litY: Math.random(),
  });
}

// ── Ground briquette remnants (연탄 잔해) ──
const briquettes = [];
for (let i = 0; i < 18; i++) {
  briquettes.push({
    x: 200 + i * 130 + Math.random() * 60,
    size: 8 + Math.random() * 12,
    rotation: Math.random() * Math.PI,
    brightness: 0.2 + Math.random() * 0.3,
  });
}

// ─────────────────────────────────────────
//  DRAW FUNCTIONS
// ─────────────────────────────────────────

function drawSky() {
  const grad = ctx.createLinearGradient(0, 0, 0, groundY + 30);
  grad.addColorStop(0,   '#0e0e10');
  grad.addColorStop(0.4, '#1a1a1e');
  grad.addColorStop(0.75,'#252528');
  grad.addColorStop(1,   '#2e2e32');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawStars() {
  ctx.save();
  const offsetX = camX * 0.02;
  for (let i = 0; i < 40; i++) {
    const seed = i * 137.508;
    const sx = ((seed * 93.7 + offsetX) % W + W) % W;
    const sy = ((seed * 51.3) % (groundY * 0.5)) + 20;
    const br = 0.15 + (Math.sin(Date.now() / 1200 + i) * 0.5 + 0.5) * 0.2;
    const r  = i % 7 === 0 ? 1.0 : 0.5;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,200,210,${br})`;
    ctx.fill();
  }
  ctx.restore();
}

function drawBuildings() {
  ctx.save();
  buildings.forEach(b => {
    const bx = b.x - camX * b.parallax;
    const by = groundY - b.h;
    // building body
    ctx.fillStyle = '#161618';
    ctx.fillRect(bx, by, b.w, b.h + 5);
    // roof
    ctx.fillStyle = '#111113';
    ctx.fillRect(bx - 3, by - 4, b.w + 6, 6);
    // chimney
    if (b.hasChimney) {
      ctx.fillStyle = '#1a1a1c';
      ctx.fillRect(bx + b.w * 0.6, by - 24, 8, 24);
      // smoke
      const t = Date.now() / 1000;
      const smokeAlpha = 0.12 + Math.sin(t + b.x) * 0.04;
      ctx.beginPath();
      ctx.arc(bx + b.w * 0.6 + 4, by - 30 - Math.sin(t * 0.5 + b.x) * 8, 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(160,155,150,${smokeAlpha})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bx + b.w * 0.6 + 8, by - 42 - Math.sin(t * 0.3 + b.x) * 6, 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(160,155,150,${smokeAlpha * 0.6})`;
      ctx.fill();
    }
    // window
    if (b.lit) {
      const wx = bx + b.w * b.litX * 0.6 + 5;
      const wy = by + b.h * 0.3 + b.litY * b.h * 0.3;
      const flicker = 0.6 + Math.sin(Date.now() / 700 + b.litX * 8) * 0.08;
      const glw = ctx.createRadialGradient(wx+4, wy+4, 0, wx+4, wy+4, 18);
      glw.addColorStop(0, `rgba(220,180,100,${0.2 * flicker})`);
      glw.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glw;
      ctx.fillRect(wx - 12, wy - 12, 32, 32);
      ctx.fillStyle = `rgba(240,200,120,${0.65 * flicker})`;
      ctx.fillRect(wx, wy, 7, 8);
    }
  });
  ctx.restore();
}

function drawGround() {
  // ground base - concrete / asphalt alley
  const grad = ctx.createLinearGradient(0, groundY, 0, H);
  grad.addColorStop(0, '#3a3a3e');
  grad.addColorStop(0.05, '#2e2e32');
  grad.addColorStop(1, '#1a1a1e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, groundY, W, H - groundY);
  // surface line
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(W, groundY);
  ctx.strokeStyle = 'rgba(120,118,115,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawBriquettes() {
  briquettes.forEach(b => {
    const bx = b.x - camX;
    if (bx < -30 || bx > W + 30) return;
    ctx.save();
    ctx.translate(bx, groundY - 2);
    ctx.rotate(b.rotation);
    // briquette cylinder shape (연탄재 - circular with holes)
    ctx.beginPath();
    ctx.arc(0, 0, b.size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(160,155,148,${b.brightness})`;
    ctx.fill();
    // holes pattern
    for (let h = 0; h < 4; h++) {
      const angle = (h / 4) * Math.PI * 2;
      const hx = Math.cos(angle) * b.size * 0.2;
      const hy = Math.sin(angle) * b.size * 0.2;
      ctx.beginPath();
      ctx.arc(hx, hy, b.size * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(90,88,85,${b.brightness * 0.8})`;
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawRaisedPlatforms() {
  platforms.slice(1).forEach(p => {
    const px = p.x - camX;
    if (px > W + 50 || px + p.w < -50) return;
    // concrete block
    ctx.fillStyle = '#2a2a2e';
    ctx.fillRect(px, p.y + 3, p.w, p.h);
    ctx.fillStyle = '#3a3a3e';
    ctx.fillRect(px, p.y, p.w, 4);
    // top edge highlight
    ctx.beginPath();
    ctx.moveTo(px, p.y);
    ctx.lineTo(px + p.w, p.y);
    ctx.strokeStyle = 'rgba(140,138,134,0.35)';
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
    // glow aura - warm grey
    const glw = ctx.createRadialGradient(fx, fy, 0, fx, fy, 50);
    glw.addColorStop(0, 'rgba(200,190,170,0.18)');
    glw.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glw;
    ctx.fillRect(fx - 50, fy - 50, 100, 100);
    // crystal shard
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(Math.sin(t * 0.8 + i) * 0.12);
    const pulse = 1 + Math.sin(t * 2 + i) * 0.05;
    ctx.scale(pulse, pulse);
    // diamond
    ctx.beginPath();
    ctx.moveTo(0, -14); ctx.lineTo(10, 0); ctx.lineTo(0, 14); ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(200,190,170,0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(190,180,160,0.12)';
    ctx.fill();
    // inner dot
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(220,210,195,0.85)';
    ctx.fill();
    ctx.restore();
    // hover proximity label
    const dist = Math.hypot((f.x - player.x), (f.y - player.y + 30));
    if (dist < 70) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, (70 - dist) / 70);
      ctx.font = `${tunables.labelFontSize}px "Noto Serif KR", serif`;
      ctx.fillStyle = 'rgba(220,215,205,0.9)';
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
    player.walkTimer += 0.12;
    legSwing = Math.sin(player.walkTimer) * 12;
    armSwing = Math.cos(player.walkTimer) * 8;
  }

  const flip = player.dir < 0 ? -1 : 1;
  ctx.scale(flip, 1);

  // shadow
  ctx.save();
  ctx.scale(1, 0.3);
  ctx.beginPath();
  ctx.ellipse(0, player.h + 10, 14, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();
  ctx.restore();

  // legs
  const legY = player.h * 0.62;
  ctx.strokeStyle = '#4a4540';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, legY);
  ctx.lineTo(-6 - legSwing * 0.3, player.h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, legY);
  ctx.lineTo(6 + legSwing * 0.3, player.h);
  ctx.stroke();

  // coat body - dark grey
  ctx.beginPath();
  ctx.roundRect(-10, player.h * 0.3, 20, player.h * 0.4, 4);
  ctx.fillStyle = '#3a3530';
  ctx.fill();
  ctx.strokeStyle = '#4a4540';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // arms
  ctx.strokeStyle = '#3a3530';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-9, player.h * 0.35);
  ctx.lineTo(-16 - armSwing * 0.4, player.h * 0.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(9, player.h * 0.35);
  ctx.lineTo(16 + armSwing * 0.4, player.h * 0.5);
  ctx.stroke();

  // head
  const breathY = Math.sin(player.breathPhase * 1.5) * 0.5;
  const headY = player.h * 0.15 + breathY;
  ctx.beginPath();
  ctx.arc(0, headY, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#c8b8a0';
  ctx.fill();

  // hair
  ctx.beginPath();
  ctx.arc(0, headY - 2, 9, Math.PI, 0);
  ctx.fillStyle = '#2a2420';
  ctx.fill();

  // scarf - dark red
  ctx.beginPath();
  ctx.arc(0, headY + 7, 6, -0.3, Math.PI + 0.3);
  ctx.strokeStyle = '#5a2020';
  ctx.lineWidth = 3;
  ctx.stroke();

  // breath cloud
  if (!moving) {
    const breathAlpha = (Math.sin(t * 1.5) * 0.5 + 0.5) * 0.25;
    ctx.beginPath();
    ctx.arc(12, headY, 4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180,175,170,${breathAlpha})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(17, headY - 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180,175,170,${breathAlpha * 0.5})`;
    ctx.fill();
  }

  ctx.restore();
}

// ─────────────────────────────────────────
//  PHYSICS & COLLISION
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

// ─────────────────────────────────────────
//  COLLECTION EFFECTS
// ─────────────────────────────────────────
function collectFragment(i, word) {
  document.getElementById('s1dot' + i)?.classList.add('collected');
  document.getElementById('s1line' + i)?.classList.add('collected');
  const popup = document.getElementById('s1word_popup');
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
  document.getElementById('s1stage_clear').classList.add('show');
  setTimeout(() => { if(window.onStageClear) window.onStageClear(1); }, 3000);
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
  drawBuildings();
  drawGround();
  drawBriquettes();
  drawRaisedPlatforms();
  drawFragments();
  drawPlayer();

  requestAnimationFrame(gameLoop);
}

// ─────────────────────────────────────────
//  START / RESTART
// ─────────────────────────────────────────
function resetStateS1() {
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
    document.getElementById('s1dot' + i)?.classList.remove('collected');
    document.getElementById('s1line' + i)?.classList.remove('collected');
  }
  document.getElementById('s1stage_clear')?.classList.remove('show');
}
function gameStartS1() {
  gameStarted = true;
  resetStateS1();
  if (!_running) {
    _running = true;
    requestAnimationFrame(gameLoop);
  }
}

// ─────────────────────────────────────────
//  ADMIN API
// ─────────────────────────────────────────
(window as any).s1API = {
  tunables,
  schema: {
    playerStartX:   { min: 0,    max: 2400, step: 10,  label: '캐릭터 시작 X' },
    playerStartY:   { min: -200, max: 0,    step: 1,   label: '캐릭터 시작 Y (groundY 기준)' },
    jumpForce:      { min: -20,  max: -3,   step: 0.5, label: '점프 힘' },
    moveSpeed:      { min: 0.5,  max: 8,    step: 0.1, label: '이동 속도' },
    gravity:        { min: 0.1,  max: 1.5,  step: 0.05,label: '중력' },
    labelOffsetY:   { min: -80,  max: 0,    step: 1,   label: '다이아 라벨 Y 오프셋' },
    labelFontSize:  { min: 8,    max: 32,   step: 1,   label: '다이아 라벨 폰트 크기' },
    popupFontSize:  { min: 10,   max: 48,   step: 1,   label: '수집 팝업 폰트 크기' },
    popupFadeMs:    { min: 200,  max: 5000, step: 100, label: '수집 팝업 표시 시간(ms)' },
  },
  fragmentSchema: { xMin: 0, xMax: 2400, yOffsetMin: -400, yOffsetMax: 0 },
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
  restart: gameStartS1,
};

window.gameStartS1 = gameStartS1;
window.initStage1 = function() { resize(); buildWorld(); initFragments(); };

}
