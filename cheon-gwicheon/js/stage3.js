/* ═══════════════════════════════════════
   STAGE 3 — 아름다웠더라 (귀천)
   천상병 「귀천」 제3연
   ═══════════════════════════════════════ */
(function() {

const cursorEl = document.getElementById('s3cursor');
document.addEventListener('mousemove', e => {
  cursorEl.style.left = e.clientX + 'px';
  cursorEl.style.top  = e.clientY + 'px';
});

const bgCanvas = document.getElementById('s3bg_canvas');
const bgCtx = bgCanvas.getContext('2d');
const canvas = document.getElementById('s3game_canvas');
const ctx = canvas.getContext('2d');

let W, H;
function resize() {
  W = canvas.width = bgCanvas.width = window.innerWidth;
  H = canvas.height = bgCanvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', () => { resize(); buildWorld(); });

const WORLD_W = 3400;
let camX = 0;
let started = false;
let cleared = false;
let collected = 0;
const TOTAL = 3;
let ascending = false;
let ascendY = 0;     // upward camera lift after clear
let endingShown = false;

const player = {
  x: 160, y: 0, vy: 0, vx: 0,
  w: 22, h: 48,
  onGround: false, dir: 1,
  walkTimer: 0
};

const keys = {};
document.addEventListener('keydown', e => { keys[e.key] = true; });
document.addEventListener('keyup',   e => { keys[e.key] = false; });

let platforms = [];
let groundY = 0;
function buildWorld() {
  groundY = H * 0.76;
  platforms = [
    { x: -200, y: groundY, w: WORLD_W + 400, h: H },
    // floating "stepping stones into the sky"
    { x: 480,  y: groundY - 60,  w: 130, h: 12 },
    { x: 740,  y: groundY - 110, w: 110, h: 12 },
    { x: 980,  y: groundY - 160, w: 120, h: 12 },
    { x: 1240, y: groundY - 130, w: 130, h: 12 },
    { x: 1500, y: groundY - 90,  w: 140, h: 12 },
    { x: 1780, y: groundY - 140, w: 130, h: 12 },
    { x: 2060, y: groundY - 100, w: 140, h: 12 },
    { x: 2340, y: groundY - 150, w: 130, h: 12 },
    { x: 2600, y: groundY - 120, w: 150, h: 12 },
    { x: 2880, y: groundY - 80,  w: 160, h: 12 },
  ];
  player.y = groundY - player.h;
}
buildWorld();

const WORDS = ['나 하늘로 돌아가리라', '아름다운 이 세상 소풍 끝내는 날', '가서, 아름다웠더라고 말하리라……'];
let fragments = [];
function initFragments() {
  fragments = [
    { x: 600,  y: groundY - 110, word: WORDS[0], collected: false, bob: 0 },
    { x: 1620, y: groundY - 150, word: WORDS[1], collected: false, bob: 1 },
    { x: 2780, y: groundY - 140, word: WORDS[2], collected: false, bob: 2 },
  ];
}
initFragments();

// ── Stars (deep space) ──
const stars = [];
for (let i = 0; i < 220; i++) {
  stars.push({
    x: Math.random() * WORLD_W,
    y: Math.random() * H * 1.4,
    r: Math.random() < 0.85 ? Math.random() * 0.9 + 0.3 : Math.random() * 1.6 + 0.8,
    phase: Math.random() * Math.PI * 2,
    parallax: 0.05 + Math.random() * 0.18,
  });
}

// ── Distant cloud strata (lavender) ──
const clouds = [];
for (let i = 0; i < 14; i++) clouds.push({
  x: Math.random() * WORLD_W,
  y: 80 + Math.random() * (groundY * 0.5),
  w: 100 + Math.random() * 140,
  drift: 0.04 + Math.random() * 0.06,
  parallax: 0.18 + Math.random() * 0.18,
});

// ── Petals / souls drifting upward ──
const petals = [];
for (let i = 0; i < 70; i++) petals.push({
  x: Math.random() * W,
  y: Math.random() * H,
  vy: -(Math.random() * 0.6 + 0.2),
  vx: (Math.random() - 0.5) * 0.5,
  r: Math.random() * 1.5 + 0.5,
  phase: Math.random() * Math.PI * 2,
  hue: 0.7 + Math.random() * 0.3,
});

// ── Distant mountains ──
const farMtns = [];
for (let i = 0; i < 14; i++) farMtns.push({ x: i * 280 + Math.random() * 80, h: 80 + Math.random() * 60 });

// ─────────────────────────────────────────
function drawSky() {
  const grad = bgCtx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,   '#04030a');
  grad.addColorStop(0.4, '#0a0820');
  grad.addColorStop(0.75,'#1a1238');
  grad.addColorStop(1,   '#2a1850');
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0, 0, W, H);
}

function drawStars() {
  const t = Date.now() / 1000;
  bgCtx.save();
  stars.forEach(s => {
    const sx = s.x - camX * s.parallax;
    const sy = s.y - ascendY * s.parallax * 0.5;
    const wx = ((sx % W) + W) % W;
    const tw = 0.4 + (Math.sin(t * 1.4 + s.phase) * 0.5 + 0.5) * 0.6;
    bgCtx.beginPath();
    bgCtx.arc(wx, sy, s.r, 0, Math.PI * 2);
    bgCtx.fillStyle = `rgba(225,215,255,${tw})`;
    bgCtx.fill();
    if (s.r > 1.2) {
      bgCtx.beginPath();
      bgCtx.arc(wx, sy, s.r * 2.5, 0, Math.PI * 2);
      bgCtx.fillStyle = `rgba(190,170,255,${tw * 0.18})`;
      bgCtx.fill();
    }
  });
  bgCtx.restore();
}

function drawGalaxyHaze() {
  const cx = W * 0.5;
  const cy = H * 0.35;
  const grd = bgCtx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.7);
  grd.addColorStop(0,    'rgba(120,90,200,0.12)');
  grd.addColorStop(0.4,  'rgba(80,60,160,0.06)');
  grd.addColorStop(1,    'rgba(0,0,0,0)');
  bgCtx.fillStyle = grd;
  bgCtx.fillRect(0, 0, W, H);
}

function drawClouds() {
  bgCtx.save();
  clouds.forEach(c => {
    c.x += c.drift;
    if (c.x > WORLD_W + 200) c.x = -200;
    const cx = c.x - camX * c.parallax;
    const cy = c.y - ascendY * c.parallax;
    if (cx < -200 || cx > W + 200) return;
    bgCtx.beginPath();
    bgCtx.ellipse(cx, cy, c.w * 0.5, 11, 0, 0, Math.PI * 2);
    bgCtx.ellipse(cx + 22, cy - 6, 28, 9, 0, 0, Math.PI * 2);
    bgCtx.ellipse(cx - 22, cy - 4, 26, 8, 0, 0, Math.PI * 2);
    bgCtx.fillStyle = 'rgba(160,130,220,0.35)';
    bgCtx.fill();
  });
  bgCtx.restore();
}

function drawFarMtns() {
  bgCtx.save();
  bgCtx.translate(-camX * 0.1, ascendY * 0.05);
  bgCtx.beginPath();
  bgCtx.moveTo(-100, groundY + 10);
  farMtns.forEach(m => {
    bgCtx.lineTo(m.x, groundY - m.h);
    bgCtx.lineTo(m.x + 140, groundY - m.h * 0.6);
  });
  bgCtx.lineTo(WORLD_W + 200, groundY + 10);
  bgCtx.closePath();
  bgCtx.fillStyle = 'rgba(20,12,40,0.92)';
  bgCtx.fill();
  bgCtx.restore();
}

function drawGround() {
  ctx.save();
  ctx.translate(0, ascendY);
  const grad = ctx.createLinearGradient(0, groundY, 0, H);
  grad.addColorStop(0, 'rgba(60,40,90,0.9)');
  grad.addColorStop(0.4, 'rgba(20,15,40,1)');
  grad.addColorStop(1, 'rgba(5,3,15,1)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, groundY, W, H - groundY);
  // little floor stars
  for (let i = 0; i < 30; i++) {
    const sx = ((i * 137 - camX * 0.6) % W + W) % W;
    const sy = groundY + 8 + (i * 13) % (H - groundY - 10);
    ctx.beginPath();
    ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(220,200,255,0.5)';
    ctx.fill();
  }
  ctx.restore();
}

function drawPlatforms() {
  ctx.save();
  ctx.translate(0, ascendY);
  platforms.slice(1).forEach(p => {
    const px = p.x - camX;
    if (px > W + 50 || px + p.w < -50) return;
    // glowing stepping stone
    const glw = ctx.createRadialGradient(px + p.w/2, p.y + 6, 0, px + p.w/2, p.y + 6, p.w * 0.8);
    glw.addColorStop(0, 'rgba(190,170,255,0.25)');
    glw.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glw;
    ctx.fillRect(px - p.w * 0.5, p.y - 30, p.w * 2, 60);
    ctx.fillStyle = 'rgba(40,25,70,0.95)';
    ctx.fillRect(px, p.y, p.w, p.h);
    ctx.fillStyle = 'rgba(220,200,255,0.7)';
    ctx.fillRect(px, p.y, p.w, 1.5);
  });
  ctx.restore();
}

function drawFragments() {
  const t = Date.now() / 1000;
  ctx.save();
  ctx.translate(0, ascendY);
  fragments.forEach((f, i) => {
    if (f.collected) return;
    const fx = f.x - camX;
    if (fx < -100 || fx > W + 100) return;
    const bob = Math.sin(t * 1.4 + f.bob * 2) * 6;
    const fy = f.y + bob;
    const glw = ctx.createRadialGradient(fx, fy, 0, fx, fy, 70);
    glw.addColorStop(0, 'rgba(200,180,255,0.35)');
    glw.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glw;
    ctx.fillRect(fx - 70, fy - 70, 140, 140);
    ctx.save();
    ctx.translate(fx, fy);
    const pulse = 1 + Math.sin(t * 2 + i) * 0.07;
    ctx.scale(pulse, pulse);
    ctx.beginPath();
    ctx.moveTo(0, -16); ctx.lineTo(11, 0); ctx.lineTo(0, 16); ctx.lineTo(-11, 0);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(220,200,255,0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(200,180,255,0.2)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-3, -4, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245,235,255,0.96)';
    ctx.fill();
    ctx.restore();

    const dist = Math.hypot(f.x - player.x, f.y - (player.y + player.h/2));
    if (dist < 95) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, (95 - dist) / 95);
      ctx.font = '14px "Noto Serif KR", serif';
      ctx.fillStyle = 'rgba(235,225,255,0.96)';
      ctx.textAlign = 'center';
      ctx.fillText(f.word, fx, fy - 28);
      ctx.restore();
    }
  });
  ctx.restore();
}

function drawPetals() {
  const t = Date.now() / 1000;
  petals.forEach(p => {
    p.y += p.vy;
    p.x += p.vx + Math.sin(t * 0.6 + p.phase) * 0.1;
    if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
    if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
    const tw = 0.5 + Math.sin(t * 1.8 + p.phase) * 0.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220,${180 + p.hue * 30},255,${0.6 * tw})`;
    ctx.fill();
  });
}

function drawPlayer() {
  const px = player.x - camX;
  const py = player.y + ascendY;
  const t = Date.now() / 1000;
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

  // soft halo
  const halo = ctx.createRadialGradient(0, player.h * 0.4, 0, 0, player.h * 0.4, 50);
  halo.addColorStop(0, 'rgba(220,200,255,0.18)');
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(-50, player.h * 0.4 - 50, 100, 100);

  ctx.strokeStyle = '#241a44';
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

  ctx.beginPath();
  ctx.roundRect(-10, player.h * 0.3, 20, player.h * 0.4, 4);
  ctx.fillStyle = '#3a2860';
  ctx.fill();

  ctx.strokeStyle = '#3a2860';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-9, player.h * 0.35);
  ctx.lineTo(-16 - armSwing * 0.4, player.h * 0.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(9, player.h * 0.35);
  ctx.lineTo(16 + armSwing * 0.4, player.h * 0.5);
  ctx.stroke();

  const headY = player.h * 0.15 + Math.sin(t * 1.5) * 0.5;
  ctx.beginPath();
  ctx.arc(0, headY, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#dcb88c';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, headY - 2, 9, Math.PI, 0);
  ctx.fillStyle = '#150a1c';
  ctx.fill();
  ctx.restore();
}

const GRAVITY = 0.45;
const MOVE_SPEED = 2.9;
const JUMP_FORCE = -10;

function updatePlayer() {
  if (!started || cleared) {
    if (ascending) {
      ascendY -= 0.8;
      // keep within reasonable bounds
      if (ascendY < -H * 0.6) ascendY = -H * 0.6;
    }
    return;
  }
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

  const targetCam = player.x - W / 3;
  camX += (targetCam - camX) * 0.07;
  camX = Math.max(0, Math.min(camX, WORLD_W - W));
}

function collectFragment(i, word) {
  document.getElementById('s3dot' + i).classList.add('collected');
  const lineEl = document.getElementById('s3line' + i);
  if (lineEl) lineEl.classList.add('collected');
  const popup = document.getElementById('s3word_popup');
  popup.textContent = word;
  popup.style.left = (fragments[i].x - camX) + 'px';
  popup.style.top  = (fragments[i].y - 10) + 'px';
  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), 1400);
  if (collected >= TOTAL) setTimeout(showStageClear, 1600);
}

function showStageClear() {
  cleared = true;
  // ascend overlay text
  const overlay = document.getElementById('s3ascend_overlay');
  const text = document.getElementById('s3ascend_text');
  text.textContent = '아름다웠더라……';
  overlay.classList.add('show');
  ascending = true;

  // After ascending animation, show stage clear and ending
  setTimeout(() => {
    document.getElementById('s3stage_clear').classList.add('show');
  }, 2400);
  setTimeout(() => {
    document.getElementById('s3stage_clear').classList.remove('show');
    overlay.classList.remove('show');
    showEnding();
  }, 6200);
}

function showEnding() {
  if (endingShown) return;
  endingShown = true;
  document.getElementById('s3ending_screen').classList.add('show');
  if (window.onGameComplete) window.onGameComplete();
}

function loop() {
  bgCtx.clearRect(0, 0, W, H);
  ctx.clearRect(0, 0, W, H);
  drawSky();
  drawGalaxyHaze();
  drawStars();
  drawClouds();
  drawFarMtns();
  drawGround();
  drawPlatforms();
  drawFragments();
  drawPetals();
  drawPlayer();
  updatePlayer();
  requestAnimationFrame(loop);
}

function gameStartS3() { started = true; }

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    const ts = document.getElementById('s3title_screen');
    if (ts && ts.style.display !== 'none' && !ts.classList.contains('out')) {
      if (typeof startGame === 'function') startGame();
    }
  }
});

requestAnimationFrame(loop);

window.gameStartS3 = gameStartS3;
window.initStage3 = function() {
  resize(); buildWorld(); initFragments();
  collected = 0; cleared = false; started = false; camX = 0;
  ascending = false; ascendY = 0; endingShown = false;
  player.x = 160; player.vx = 0; player.vy = 0;
  for (let i = 0; i < 3; i++) {
    const d = document.getElementById('s3dot' + i); if (d) d.classList.remove('collected');
    const l = document.getElementById('s3line' + i); if (l) l.classList.remove('collected');
  }
  const sc = document.getElementById('s3stage_clear'); if (sc) sc.classList.remove('show');
  const ov = document.getElementById('s3ascend_overlay'); if (ov) ov.classList.remove('show');
  const es = document.getElementById('s3ending_screen'); if (es) es.classList.remove('show');
};

})();
