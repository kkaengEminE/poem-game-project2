// @ts-nocheck
let _stage3Initialized = false;
export function initStage3() {
  if (_stage3Initialized) return;
  _stage3Initialized = true;

// ─────────────────────────────────────────
//  CURSOR
// ─────────────────────────────────────────
const cursorEl = document.getElementById('s3cursor');
document.addEventListener('mousemove', e => {
  cursorEl.style.left = e.clientX + 'px';
  cursorEl.style.top  = e.clientY + 'px';
});

// ─────────────────────────────────────────
//  EMBER PARTICLES (타오르는 불씨)
// ─────────────────────────────────────────
const emberCanvas = document.getElementById('s3ember_canvas');
const emberCtx = emberCanvas.getContext('2d');
let embers = [];

function resizeEmber() {
  emberCanvas.width  = window.innerWidth;
  emberCanvas.height = window.innerHeight;
}
resizeEmber();
window.addEventListener('resize', resizeEmber);

function initEmbers() {
  embers = [];
  for (let i = 0; i < 50; i++) {
    embers.push({
      x: Math.random() * emberCanvas.width,
      y: Math.random() * emberCanvas.height,
      r: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.6 + 0.15,
      drift: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.4 + 0.1,
      phase: Math.random() * Math.PI * 2,
      hue: Math.random() * 40, // 0=red, 40=orange
    });
  }
}
initEmbers();

function animateEmbers() {
  emberCtx.clearRect(0, 0, emberCanvas.width, emberCanvas.height);
  const t = Date.now() / 1000;
  embers.forEach(e => {
    e.y -= e.speed;
    e.x += e.drift + Math.sin(t * 0.5 + e.phase) * 0.3;
    if (e.y < -5) { e.y = emberCanvas.height + 5; e.x = Math.random() * emberCanvas.width; }
    if (e.x > emberCanvas.width) e.x = 0;
    if (e.x < 0) e.x = emberCanvas.width;
    const flicker = 0.7 + Math.sin(t * 3 + e.phase) * 0.3;
    emberCtx.beginPath();
    emberCtx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    const r = 220 + e.hue * 0.5;
    const g = 120 + e.hue * 2;
    const b = 40 + e.hue * 0.3;
    emberCtx.fillStyle = `rgba(${r},${g},${b},${e.opacity * flicker})`;
    emberCtx.fill();
  });
  requestAnimationFrame(animateEmbers);
}
animateEmbers();

// ─────────────────────────────────────────
//  GAME ENGINE
// ─────────────────────────────────────────
const canvas = document.getElementById('s3game_canvas');
const ctx = canvas.getContext('2d');

let W, H;
function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', () => { resize(); buildWorld(); });

const WORLD_W = 2000;
let camX = 0;
let gameStarted = false;
let gameOver = false;
let collectedCount = 0;
const TOTAL_FRAGMENTS = 1;

// ── Color transition progress (0~1) ──
let warmthProgress = 0;

// ─────────────────────────────────────────
//  @TUNABLES  (stage 3) — 뜨거운 사람
// ─────────────────────────────────────────
const tunables = {
  playerStartX: 120,        // @TUNABLE
  playerStartY: -48,        // @TUNABLE
  jumpForce: -13,           // @TUNABLE
  moveSpeed: 2.8,           // @TUNABLE
  gravity: 0.75,            // @TUNABLE
  fragments: [
    { x: 1000, yOffset: -180 }, // @TUNABLE 다이아 0 — 중앙 높이
  ],
  labelOffsetY: -26,        // @TUNABLE
  labelFontSize: 15,        // @TUNABLE
  popupFontSize: 24,        // @TUNABLE
  popupFadeMs: 1500,        // @TUNABLE
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
    // gradual ascending platforms (6-step)
    { x: 350,  y: groundY - 50,  w: 120, h: 20 },
    { x: 550,  y: groundY - 90,  w: 110, h: 20 },
    { x: 750,  y: groundY - 130, w: 130, h: 20 },
    { x: 950,  y: groundY - 170, w: 140, h: 20 },
    { x: 1200, y: groundY - 120, w: 120, h: 20 },
    { x: 1450, y: groundY - 70,  w: 130, h: 20 },
    { x: 1700, y: groundY - 50,  w: 150, h: 20 },
  ];
  player.y = groundY - player.h;
}
buildWorld();

const WORDS = ['뜨거운 사람이었느냐'];
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

// ── Briquette (연탄) glowing in center ──
const glowingBriquette = {
  x: 1000,
  pulsePhase: 0,
};

// ─────────────────────────────────────────
//  DRAW FUNCTIONS
// ─────────────────────────────────────────

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpColor(r1,g1,b1, r2,g2,b2, t) {
  return [lerp(r1,r2,t), lerp(g1,g2,t), lerp(b1,b2,t)];
}

function drawSky() {
  const w = warmthProgress;
  // cold: dark blue → warm: dark red-brown
  const [t1r,t1g,t1b] = lerpColor(6,10,20, 18,8,6, w);
  const [t2r,t2g,t2b] = lerpColor(12,18,32, 35,16,10, w);
  const [t3r,t3g,t3b] = lerpColor(20,28,45, 50,25,15, w);

  const grad = ctx.createLinearGradient(0, 0, 0, groundY + 30);
  grad.addColorStop(0,   `rgb(${t1r},${t1g},${t1b})`);
  grad.addColorStop(0.5, `rgb(${t2r},${t2g},${t2b})`);
  grad.addColorStop(1,   `rgb(${t3r},${t3g},${t3b})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawStars() {
  ctx.save();
  const offsetX = camX * 0.015;
  const starAlpha = 1 - warmthProgress * 0.6; // stars fade as warmth increases
  for (let i = 0; i < 50; i++) {
    const seed = i * 137.508;
    const sx = ((seed * 93.7 + offsetX) % W + W) % W;
    const sy = ((seed * 51.3) % (groundY * 0.5)) + 20;
    const br = (0.2 + (Math.sin(Date.now() / 1000 + i) * 0.5 + 0.5) * 0.3) * starAlpha;
    const r  = i % 5 === 0 ? 1.0 : 0.5;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,190,180,${br})`;
    ctx.fill();
  }
  ctx.restore();
}

function drawGlowingBriquette() {
  const bx = glowingBriquette.x - camX;
  const by = groundY - 14;
  const t = Date.now() / 1000;
  const pulse = 0.7 + Math.sin(t * 1.5) * 0.3;

  // radiant glow
  const glowR = 80 + warmthProgress * 100;
  const glw = ctx.createRadialGradient(bx, by, 0, bx, by, glowR);
  const warmAlpha = 0.08 + warmthProgress * 0.15;
  glw.addColorStop(0, `rgba(230,120,40,${warmAlpha * pulse})`);
  glw.addColorStop(0.4, `rgba(200,80,30,${warmAlpha * 0.5 * pulse})`);
  glw.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glw;
  ctx.fillRect(bx - glowR, by - glowR, glowR * 2, glowR * 2);

  // briquette body
  ctx.save();
  ctx.translate(bx, by);
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  const bri = 0.4 + warmthProgress * 0.5;
  ctx.fillStyle = `rgba(180,80,30,${bri})`;
  ctx.fill();
  // inner glow
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(240,140,50,${bri * 0.6 * pulse})`;
  ctx.fill();
  // holes
  for (let h = 0; h < 5; h++) {
    const angle = (h / 5) * Math.PI * 2;
    const hx = Math.cos(angle) * 5;
    const hy = Math.sin(angle) * 5;
    ctx.beginPath();
    ctx.arc(hx, hy, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,180,80,${bri * 0.8 * pulse})`;
    ctx.fill();
  }
  ctx.restore();
}

function drawGround() {
  const w = warmthProgress;
  const [gr,gg,gb] = lerpColor(26,32,50, 50,30,22, w);
  const [gr2,gg2,gb2] = lerpColor(18,24,38, 38,22,16, w);

  const grad = ctx.createLinearGradient(0, groundY, 0, H);
  grad.addColorStop(0, `rgb(${gr},${gg},${gb})`);
  grad.addColorStop(0.05, `rgb(${gr2},${gg2},${gb2})`);
  grad.addColorStop(1, `rgb(${Math.floor(gr2*0.6)},${Math.floor(gg2*0.6)},${Math.floor(gb2*0.6)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, groundY, W, H - groundY);
}

function drawRaisedPlatforms() {
  const w = warmthProgress;
  platforms.slice(1).forEach(p => {
    const px = p.x - camX;
    if (px > W + 50 || px + p.w < -50) return;
    const [pr,pg,pb] = lerpColor(20,26,42, 45,25,18, w);
    ctx.fillStyle = `rgb(${pr},${pg},${pb})`;
    ctx.fillRect(px, p.y + 3, p.w, p.h);
    const [sr,sg,sb] = lerpColor(30,38,58, 60,35,22, w);
    ctx.fillStyle = `rgb(${sr},${sg},${sb})`;
    ctx.fillRect(px, p.y, p.w, 4);
    ctx.beginPath();
    ctx.moveTo(px, p.y);
    ctx.lineTo(px + p.w, p.y);
    const lineAlpha = 0.25 + w * 0.15;
    const [lr,lg,lb] = lerpColor(100,120,170, 180,120,80, w);
    ctx.strokeStyle = `rgba(${lr},${lg},${lb},${lineAlpha})`;
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
    // warm glow
    const glw = ctx.createRadialGradient(fx, fy, 0, fx, fy, 55);
    glw.addColorStop(0, 'rgba(230,150,60,0.22)');
    glw.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glw;
    ctx.fillRect(fx - 55, fy - 55, 110, 110);
    // diamond
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(Math.sin(t * 0.8 + i) * 0.12);
    const pulse = 1 + Math.sin(t * 2 + i) * 0.05;
    ctx.scale(pulse, pulse);
    ctx.beginPath();
    ctx.moveTo(0, -14); ctx.lineTo(10, 0); ctx.lineTo(0, 14); ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(240,180,80,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(230,160,60,0.15)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,200,100,0.9)';
    ctx.fill();
    ctx.restore();
    // label
    const dist = Math.hypot((f.x - player.x), (f.y - player.y + 30));
    if (dist < 70) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, (70 - dist) / 70);
      ctx.font = `${tunables.labelFontSize}px "Noto Serif KR", serif`;
      ctx.fillStyle = 'rgba(255,220,150,0.9)';
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
  const w = warmthProgress;
  const legColor = `rgb(${lerp(42,80,w)},${lerp(40,40,w)},${lerp(50,30,w)})`;
  ctx.strokeStyle = legColor;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-4, player.h * 0.62); ctx.lineTo(-6 - legSwing * 0.3, player.h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4, player.h * 0.62); ctx.lineTo(6 + legSwing * 0.3, player.h); ctx.stroke();

  // coat — transitions from dark to warm
  const coatColor = `rgb(${lerp(30,70,w)},${lerp(28,35,w)},${lerp(40,25,w)})`;
  ctx.beginPath();
  ctx.roundRect(-10, player.h * 0.3, 20, player.h * 0.4, 4);
  ctx.fillStyle = coatColor;
  ctx.fill();

  // arms
  ctx.strokeStyle = coatColor;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-9, player.h * 0.35); ctx.lineTo(-16 - armSwing * 0.4, player.h * 0.55); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(9, player.h * 0.35); ctx.lineTo(16 + armSwing * 0.4, player.h * 0.5); ctx.stroke();

  // head
  const breathY = Math.sin(player.breathPhase * 1.5) * 0.5;
  const headY = player.h * 0.15 + breathY;
  ctx.beginPath();
  ctx.arc(0, headY, 9, 0, Math.PI * 2);
  ctx.fillStyle = `rgb(${lerp(184,210,w)},${lerp(168,180,w)},${lerp(144,150,w)})`;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, headY - 2, 9, Math.PI, 0);
  ctx.fillStyle = '#2a2018';
  ctx.fill();

  // scarf — warms up
  ctx.beginPath();
  ctx.arc(0, headY + 7, 6, -0.3, Math.PI + 0.3);
  ctx.strokeStyle = `rgb(${lerp(60,160,w)},${lerp(40,50,w)},${lerp(30,30,w)})`;
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

  // warmth progress based on player X position
  warmthProgress = Math.min(1, Math.max(0, (player.x - 200) / (WORLD_W - 400)));

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
  document.getElementById('s3dot' + i)?.classList.add('collected');
  document.getElementById('s3line' + i)?.classList.add('collected');
  const popup = document.getElementById('s3word_popup');
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
    setTimeout(showEnding, 2000);
  }
}

function showEnding() {
  gameOver = true;
  // Show the ending screen instead of stage clear
  document.getElementById('s3ending_screen').classList.add('show');
  if (window.onGameComplete) window.onGameComplete();
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
  drawGround();
  drawGlowingBriquette();
  drawRaisedPlatforms();
  drawFragments();
  drawPlayer();

  requestAnimationFrame(gameLoop);
}

function resetStateS3() {
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
  warmthProgress = 0;
  for (let i = 0; i < TOTAL_FRAGMENTS; i++) {
    document.getElementById('s3dot' + i)?.classList.remove('collected');
    document.getElementById('s3line' + i)?.classList.remove('collected');
  }
  document.getElementById('s3ending_screen')?.classList.remove('show');
}
function gameStartS3() {
  gameStarted = true;
  resetStateS3();
  if (!_running) {
    _running = true;
    requestAnimationFrame(gameLoop);
  }
}

(window as any).s3API = {
  tunables,
  schema: {
    playerStartX:   { min: 0,    max: 2000, step: 10,  label: '캐릭터 시작 X' },
    playerStartY:   { min: -200, max: 0,    step: 1,   label: '캐릭터 시작 Y' },
    jumpForce:      { min: -20,  max: -3,   step: 0.5, label: '점프 힘' },
    moveSpeed:      { min: 0.5,  max: 8,    step: 0.1, label: '이동 속도' },
    gravity:        { min: 0.1,  max: 1.5,  step: 0.05,label: '중력' },
    labelOffsetY:   { min: -80,  max: 0,    step: 1,   label: '다이아 라벨 Y 오프셋' },
    labelFontSize:  { min: 8,    max: 32,   step: 1,   label: '다이아 라벨 폰트 크기' },
    popupFontSize:  { min: 10,   max: 48,   step: 1,   label: '수집 팝업 폰트 크기' },
    popupFadeMs:    { min: 200,  max: 5000, step: 100, label: '수집 팝업 표시 시간(ms)' },
  },
  fragmentSchema: { xMin: 0, xMax: 2000, yOffsetMin: -400, yOffsetMax: 0 },
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
  restart: gameStartS3,
};

window.gameStartS3 = gameStartS3;
window.initStage3 = function() { resize(); buildWorld(); initFragments(); };

}
