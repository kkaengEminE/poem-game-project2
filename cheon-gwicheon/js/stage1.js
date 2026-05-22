/* ═══════════════════════════════════════
   STAGE 1 — 새벽빛과 이슬
   천상병 「귀천」 제1연
   ═══════════════════════════════════════ */
(function() {

// ── Cursor ──
const cursorEl = document.getElementById('s1cursor');
document.addEventListener('mousemove', e => {
  cursorEl.style.left = e.clientX + 'px';
  cursorEl.style.top  = e.clientY + 'px';
});

// ── Canvases ──
const bgCanvas = document.getElementById('s1bg_canvas');
const bgCtx = bgCanvas.getContext('2d');
const canvas = document.getElementById('s1game_canvas');
const ctx = canvas.getContext('2d');

let W, H;
function resize() {
  W = canvas.width = bgCanvas.width = window.innerWidth;
  H = canvas.height = bgCanvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', () => { resize(); buildWorld(); });

// ── State ──
const WORLD_W = 3400;
let camX = 0;
let started = false;
let cleared = false;
let collected = 0;
const TOTAL = 3;
let dawnProgress = 0;   // 0 → 1, sky brightens over time

// ── Player ──
const player = {
  x: 160, y: 0, vy: 0, vx: 0,
  w: 22, h: 48,
  onGround: false, dir: 1,
  walkTimer: 0, breath: 0
};

// ── Keys ──
const keys = {};
document.addEventListener('keydown', e => { keys[e.key] = true; });
document.addEventListener('keyup',   e => { keys[e.key] = false; });

// ── Platforms ──
let platforms = [];
let groundY = 0;
function buildWorld() {
  groundY = H * 0.74;
  platforms = [
    { x: -200, y: groundY, w: WORLD_W + 400, h: H },
    { x: 480,  y: groundY - 70,  w: 140, h: 14 },
    { x: 760,  y: groundY - 130, w: 120, h: 14 },
    { x: 1040, y: groundY - 90,  w: 130, h: 14 },
    { x: 1380, y: groundY - 50,  w: 160, h: 14 },
    { x: 1700, y: groundY - 110, w: 140, h: 14 },
    { x: 2040, y: groundY - 80,  w: 130, h: 14 },
    { x: 2360, y: groundY - 140, w: 150, h: 14 },
    { x: 2700, y: groundY - 70,  w: 140, h: 14 },
    { x: 3000, y: groundY - 100, w: 160, h: 14 },
  ];
  player.y = groundY - player.h;
}
buildWorld();

// ── Word fragments ──
const WORDS = ['나 하늘로 돌아가리라', '새벽빛 와 닿으면 스러지는', '이슬 더불어 손에 손을 잡고'];
let fragments = [];
function initFragments() {
  fragments = [
    { x: 540,  y: groundY - 130, word: WORDS[0], collected: false, bob: 0 },
    { x: 1450, y: groundY - 110, word: WORDS[1], collected: false, bob: 1 },
    { x: 2780, y: groundY - 130, word: WORDS[2], collected: false, bob: 2 },
  ];
}
initFragments();

// ── Drifting dew particles (foreground) ──
let dewParticles = [];
function initDew() {
  dewParticles = [];
  for (let i = 0; i < 90; i++) {
    dewParticles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.6 + 0.4,
      vy: -(Math.random() * 0.4 + 0.1),
      drift: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.45 + 0.2,
      phase: Math.random() * Math.PI * 2,
    });
  }
}
initDew();

// ── Background hills layers ──
const hillsFar = [];
const hillsMid = [];
for (let i = 0; i < 14; i++) {
  hillsFar.push({ x: i * 280 + Math.random() * 80, h: 80 + Math.random() * 60 });
}
for (let i = 0; i < 18; i++) {
  hillsMid.push({ x: i * 220 + Math.random() * 60, h: 50 + Math.random() * 50 });
}

// ── Reeds (foreground vegetation) ──
const reeds = [];
for (let i = 0; i < 60; i++) {
  reeds.push({
    x: Math.random() * WORLD_W,
    h: 28 + Math.random() * 22,
    sway: Math.random() * Math.PI * 2,
    parallax: 0.7 + Math.random() * 0.2,
  });
}

// ── Dew drops on grass ──
const grassDew = [];
for (let i = 0; i < 80; i++) {
  grassDew.push({
    x: Math.random() * WORLD_W,
    y: groundY + 4 + Math.random() * 8,
    r: Math.random() * 1.5 + 0.6,
    phase: Math.random() * Math.PI * 2,
  });
}

// ─────────────────────────────────────────
//  DRAW
// ─────────────────────────────────────────
function drawSky() {
  // Pre-dawn → dawn gradient
  const t = dawnProgress;
  const topR = 6  + t * 22;
  const topG = 10 + t * 28;
  const topB = 32 + t * 50;
  const midR = 22 + t * 60;
  const midG = 28 + t * 55;
  const midB = 60 + t * 80;
  const horR = 50 + t * 160;
  const horG = 50 + t * 130;
  const horB = 90 + t * 90;
  const grad = bgCtx.createLinearGradient(0, 0, 0, groundY + 30);
  grad.addColorStop(0,    `rgb(${topR},${topG},${topB})`);
  grad.addColorStop(0.55, `rgb(${midR},${midG},${midB})`);
  grad.addColorStop(1,    `rgb(${horR},${horG},${horB})`);
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0, 0, W, H);
}

function drawStars() {
  // Fading stars (visible early, fade as dawn brightens)
  const fade = 1 - dawnProgress * 0.95;
  if (fade <= 0.05) return;
  bgCtx.save();
  for (let i = 0; i < 100; i++) {
    const seed = i * 137.508;
    const sx = ((seed * 91.3 - camX * 0.02) % W + W) % W;
    const sy = ((seed * 47.7) % (groundY * 0.65)) + 10;
    const tw = 0.4 + (Math.sin(Date.now() / 1100 + i) * 0.5 + 0.5) * 0.5;
    bgCtx.beginPath();
    bgCtx.arc(sx, sy, i % 9 === 0 ? 1.2 : 0.55, 0, Math.PI * 2);
    bgCtx.fillStyle = `rgba(220,225,255,${0.7 * tw * fade})`;
    bgCtx.fill();
  }
  bgCtx.restore();
}

function drawHorizonGlow() {
  // Dawn light pooling on horizon
  const intensity = dawnProgress;
  const cx = W * 0.5;
  const cy = groundY - 4;
  const grd = bgCtx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.7);
  grd.addColorStop(0,    `rgba(255,220,180,${0.18 * intensity})`);
  grd.addColorStop(0.3,  `rgba(220,180,200,${0.10 * intensity})`);
  grd.addColorStop(0.6,  `rgba(140,150,210,${0.05 * intensity})`);
  grd.addColorStop(1,    'rgba(0,0,0,0)');
  bgCtx.fillStyle = grd;
  bgCtx.fillRect(0, 0, W, H);
}

function drawHillsFar() {
  bgCtx.save();
  bgCtx.translate(-camX * 0.08, 0);
  bgCtx.beginPath();
  bgCtx.moveTo(-100, groundY + 10);
  hillsFar.forEach(h => {
    bgCtx.lineTo(h.x, groundY - h.h);
    bgCtx.lineTo(h.x + 140, groundY - h.h * 0.6);
  });
  bgCtx.lineTo(WORLD_W + 200, groundY + 10);
  bgCtx.closePath();
  bgCtx.fillStyle = `rgba(40,50,90,${0.55 + dawnProgress * 0.2})`;
  bgCtx.fill();
  bgCtx.restore();
}
function drawHillsMid() {
  bgCtx.save();
  bgCtx.translate(-camX * 0.18, 0);
  bgCtx.beginPath();
  bgCtx.moveTo(-100, groundY + 10);
  hillsMid.forEach(h => {
    bgCtx.lineTo(h.x, groundY - h.h);
    bgCtx.lineTo(h.x + 110, groundY - h.h * 0.55);
  });
  bgCtx.lineTo(WORLD_W + 200, groundY + 10);
  bgCtx.closePath();
  bgCtx.fillStyle = `rgba(25,35,65,${0.7 + dawnProgress * 0.15})`;
  bgCtx.fill();
  bgCtx.restore();
}

function drawGround() {
  const grad = ctx.createLinearGradient(0, groundY, 0, H);
  grad.addColorStop(0, `rgba(${60 + dawnProgress*70},${65 + dawnProgress*70},${100 + dawnProgress*40},0.95)`);
  grad.addColorStop(0.4, `rgba(${30 + dawnProgress*40},${40 + dawnProgress*40},${70 + dawnProgress*30},1)`);
  grad.addColorStop(1, `rgb(${10 + dawnProgress*15},${15 + dawnProgress*15},${30 + dawnProgress*15})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, groundY, W, H - groundY);

  // grass blades silhouette
  ctx.save();
  ctx.translate(-camX, 0);
  ctx.strokeStyle = `rgba(15,25,45,${0.7})`;
  ctx.lineWidth = 1;
  for (let gx = 0; gx < WORLD_W; gx += 14) {
    const sway = Math.sin(Date.now() * 0.0008 + gx * 0.05) * 1.5;
    ctx.beginPath();
    ctx.moveTo(gx, groundY);
    ctx.lineTo(gx + sway, groundY - 6 - (gx % 5));
    ctx.stroke();
  }
  ctx.restore();
}

function drawDewOnGrass() {
  ctx.save();
  ctx.translate(-camX, 0);
  const t = Date.now() / 1000;
  grassDew.forEach(d => {
    const sx = d.x;
    if (sx < camX - 50 || sx > camX + W + 50) return;
    const tw = 0.5 + Math.sin(t * 1.4 + d.phase) * 0.5;
    // glow
    const glw = ctx.createRadialGradient(sx, d.y, 0, sx, d.y, 8);
    glw.addColorStop(0, `rgba(200,225,255,${0.5 * tw})`);
    glw.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glw;
    ctx.fillRect(sx - 8, d.y - 8, 16, 16);
    // dew core
    ctx.beginPath();
    ctx.arc(sx, d.y, d.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(225,240,255,${0.85 * tw})`;
    ctx.fill();
  });
  ctx.restore();
}

function drawReeds() {
  ctx.save();
  const t = Date.now() * 0.0009;
  reeds.forEach(r => {
    const sx = (r.x - camX * r.parallax);
    if (sx < -20 || sx > W + 20) return;
    const sway = Math.sin(t + r.sway) * 4;
    ctx.strokeStyle = `rgba(15,25,45,${0.85})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx, groundY);
    ctx.quadraticCurveTo(sx + sway * 0.5, groundY - r.h * 0.5, sx + sway, groundY - r.h);
    ctx.stroke();
    // reed tip
    ctx.beginPath();
    ctx.arc(sx + sway, groundY - r.h, 1.4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180,195,225,${0.6 + dawnProgress * 0.3})`;
    ctx.fill();
  });
  ctx.restore();
}

function drawPlatforms() {
  platforms.slice(1).forEach(p => {
    const px = p.x - camX;
    if (px > W + 50 || px + p.w < -50) return;
    ctx.fillStyle = `rgba(40,55,85,0.95)`;
    ctx.fillRect(px, p.y, p.w, p.h);
    // dew sheen
    ctx.fillStyle = `rgba(200,220,250,${0.35 + dawnProgress * 0.2})`;
    ctx.fillRect(px, p.y, p.w, 1.5);
    // tiny dew drops on top
    for (let i = 0; i < 3; i++) {
      const dx = px + p.w * (0.2 + i * 0.3);
      ctx.beginPath();
      ctx.arc(dx, p.y - 1, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(220,235,255,0.85)';
      ctx.fill();
    }
  });
}

function drawFragments() {
  const t = Date.now() / 1000;
  fragments.forEach((f, i) => {
    if (f.collected) return;
    const fx = f.x - camX;
    if (fx < -100 || fx > W + 100) return;
    const bob = Math.sin(t * 1.4 + f.bob * 2) * 6;
    const fy = f.y + bob;
    // glow aura
    const glw = ctx.createRadialGradient(fx, fy, 0, fx, fy, 60);
    glw.addColorStop(0, 'rgba(180,210,255,0.28)');
    glw.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glw;
    ctx.fillRect(fx - 60, fy - 60, 120, 120);
    // dewdrop crystal
    ctx.save();
    ctx.translate(fx, fy);
    const pulse = 1 + Math.sin(t * 2 + i) * 0.06;
    ctx.scale(pulse, pulse);
    ctx.beginPath();
    ctx.moveTo(0, -16); ctx.lineTo(11, 0); ctx.lineTo(0, 16); ctx.lineTo(-11, 0);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(200,225,255,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(180,215,255,0.18)';
    ctx.fill();
    // inner highlight
    ctx.beginPath();
    ctx.arc(-3, -4, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(240,250,255,0.95)';
    ctx.fill();
    ctx.restore();

    // proximity word label
    const dist = Math.hypot(f.x - player.x, f.y - (player.y + player.h/2));
    if (dist < 90) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, (90 - dist) / 90);
      ctx.font = '14px "Noto Serif KR", serif';
      ctx.fillStyle = 'rgba(220,235,255,0.95)';
      ctx.textAlign = 'center';
      ctx.fillText(f.word, fx, fy - 28);
      ctx.restore();
    }
  });
}

function drawDewParticles() {
  const t = Date.now() / 1000;
  dewParticles.forEach(p => {
    p.y += p.vy;
    p.x += p.drift + Math.sin(t * 0.6 + p.phase) * 0.12;
    if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
    if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220,235,255,${p.opacity})`;
    ctx.fill();
  });
}

function drawPlayer() {
  const px = player.x - camX;
  const py = player.y;
  const t = Date.now() / 1000;
  player.breath = t;

  ctx.save();
  ctx.translate(px, py);

  let legSwing = 0, armSwing = 0;
  const moving = Math.abs(player.vx) > 0.5;
  if (moving) {
    player.walkTimer += 0.13;
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
  ctx.strokeStyle = '#1a2a45';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, player.h * 0.62);
  ctx.lineTo(-6 - legSwing * 0.3, player.h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, player.h * 0.62);
  ctx.lineTo(6 + legSwing * 0.3, player.h);
  ctx.stroke();

  // body
  ctx.beginPath();
  ctx.roundRect(-10, player.h * 0.3, 20, player.h * 0.4, 4);
  ctx.fillStyle = '#22365a';
  ctx.fill();
  ctx.strokeStyle = 'rgba(180,200,235,0.4)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // arms
  ctx.strokeStyle = '#22365a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-9, player.h * 0.35);
  ctx.lineTo(-16 - armSwing * 0.4, player.h * 0.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(9, player.h * 0.35);
  ctx.lineTo(16 + armSwing * 0.4, player.h * 0.5);
  ctx.stroke();

  // head
  const breathY = Math.sin(player.breath * 1.5) * 0.5;
  const headY = player.h * 0.15 + breathY;
  ctx.beginPath();
  ctx.arc(0, headY, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#d4b896';
  ctx.fill();
  // hair
  ctx.beginPath();
  ctx.arc(0, headY - 2, 9, Math.PI, 0);
  ctx.fillStyle = '#1a1208';
  ctx.fill();

  // breath cloud (cool morning air)
  if (!moving) {
    const ba = (Math.sin(t * 1.5) * 0.5 + 0.5) * 0.4;
    ctx.beginPath();
    ctx.arc(12, headY, 5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(230,245,255,${ba})`;
    ctx.fill();
  }

  ctx.restore();
}

// ─────────────────────────────────────────
//  PHYSICS
// ─────────────────────────────────────────
const GRAVITY = 0.45;
const MOVE_SPEED = 2.9;
const JUMP_FORCE = -10;

function updatePlayer() {
  if (!started || cleared) return;
  const left  = keys['ArrowLeft']  || keys['a'] || keys['A'];
  const right = keys['ArrowRight'] || keys['d'] || keys['D'];
  const jump  = keys['ArrowUp']    || keys['w'] || keys['W'] || keys[' '];

  if (left)  { player.vx = -MOVE_SPEED; player.dir = -1; }
  if (right) { player.vx =  MOVE_SPEED; player.dir =  1; }
  if (!left && !right) player.vx *= 0.7;

  if (jump && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
  }

  player.vy += GRAVITY;
  player.x  += player.vx;
  player.y  += player.vy;

  if (player.x < 60) player.x = 60;
  if (player.x > WORLD_W - 60) player.x = WORLD_W - 60;

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
    const dist = Math.hypot(player.x - f.x, player.y + player.h/2 - f.y);
    if (dist < 42) {
      f.collected = true;
      collected++;
      collectFragment(i, f.word);
    }
  });

  // camera
  const targetCam = player.x - W / 3;
  camX += (targetCam - camX) * 0.07;
  camX = Math.max(0, Math.min(camX, WORLD_W - W));

  // dawn brightens slowly
  dawnProgress = Math.min(1, dawnProgress + 0.0008);
}

function collectFragment(i, word) {
  document.getElementById('s1dot' + i).classList.add('collected');
  const lineEl = document.getElementById('s1line' + i);
  if (lineEl) lineEl.classList.add('collected');
  const popup = document.getElementById('s1word_popup');
  popup.textContent = word;
  popup.style.left = (fragments[i].x - camX) + 'px';
  popup.style.top  = (fragments[i].y - 10) + 'px';
  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), 1400);
  if (collected >= TOTAL) setTimeout(showStageClear, 1600);
}

function showStageClear() {
  cleared = true;
  document.getElementById('s1stage_clear').classList.add('show');
  setTimeout(() => { if (window.onStageClear) window.onStageClear(1); }, 3200);
}

// ─────────────────────────────────────────
//  MAIN LOOP
// ─────────────────────────────────────────
function loop() {
  bgCtx.clearRect(0, 0, W, H);
  ctx.clearRect(0, 0, W, H);

  drawSky();
  drawStars();
  drawHorizonGlow();
  drawHillsFar();
  drawHillsMid();

  drawGround();
  drawReeds();
  drawDewOnGrass();
  drawPlatforms();
  drawFragments();
  drawDewParticles();
  drawPlayer();
  updatePlayer();

  requestAnimationFrame(loop);
}

function gameStartS1() { started = true; }

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    const ts = document.getElementById('s1title_screen');
    if (ts && ts.style.display !== 'none' && !ts.classList.contains('fade-out')) {
      // simulate clicking start (so screen fades)
      if (typeof startGame === 'function') startGame();
    }
  }
});

requestAnimationFrame(loop);

window.gameStartS1 = gameStartS1;
window.initStage1 = function() {
  resize(); buildWorld(); initFragments(); initDew();
  collected = 0; cleared = false; started = false; dawnProgress = 0; camX = 0;
  player.x = 160; player.vx = 0; player.vy = 0;
  for (let i = 0; i < 3; i++) {
    const d = document.getElementById('s1dot' + i); if (d) d.classList.remove('collected');
    const l = document.getElementById('s1line' + i); if (l) l.classList.remove('collected');
  }
  const sc = document.getElementById('s1stage_clear'); if (sc) sc.classList.remove('show');
};

})();
