/* ═══════════════════════════════════════
   STAGE 2 — 노을빛 기슭
   천상병 「귀천」 제2연
   기슭에서 놀다가 구름 손짓하면은
   ═══════════════════════════════════════ */
(function() {

const cursorEl = document.getElementById('s2cursor');
document.addEventListener('mousemove', e => {
  cursorEl.style.left = e.clientX + 'px';
  cursorEl.style.top  = e.clientY + 'px';
});

const bgCanvas = document.getElementById('s2bg_canvas');
const bgCtx = bgCanvas.getContext('2d');
const canvas = document.getElementById('s2game_canvas');
const ctx = canvas.getContext('2d');

let W, H;
function resize() {
  W = canvas.width = bgCanvas.width = window.innerWidth;
  H = canvas.height = bgCanvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', () => { resize(); buildWorld(); });

const WORLD_W = 3600;
let camX = 0;
let started = false;
let cleared = false;
let collected = 0;
const TOTAL = 3;

const player = {
  x: 160, y: 0, vy: 0, vx: 0,
  w: 22, h: 48,
  onGround: false, dir: 1,
  walkTimer: 0, mounted: false
};

const keys = {};
let rPressed = false;
document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if ((e.key === 'r' || e.key === 'R') && !rPressed) {
    rPressed = true;
    tryToggleMount();
  }
});
document.addEventListener('keyup', e => {
  keys[e.key] = false;
  if (e.key === 'r' || e.key === 'R') rPressed = false;
});

let platforms = [];
let groundY = 0;

// Cloud "vehicle" — drifting near a riverbank platform
const cloud = {
  x: 1850, baseY: 0, y: 0, vy: 0, vx: 0,
  w: 90, h: 28, phase: 0
};

function buildWorld() {
  groundY = H * 0.74;
  platforms = [
    { x: -200, y: groundY, w: WORLD_W + 400, h: H },
    { x: 460,  y: groundY - 70,  w: 130, h: 14 },
    { x: 720,  y: groundY - 110, w: 120, h: 14 },
    { x: 1000, y: groundY - 80,  w: 130, h: 14 },
    { x: 1280, y: groundY - 130, w: 140, h: 14 },
    { x: 1560, y: groundY - 60,  w: 160, h: 14 },
    // a high "cliff" to launch from with cloud
    { x: 1820, y: groundY - 160, w: 180, h: 14 },
    { x: 2160, y: groundY - 110, w: 140, h: 14 },
    { x: 2480, y: groundY - 150, w: 150, h: 14 },
    { x: 2820, y: groundY - 90,  w: 140, h: 14 },
    { x: 3140, y: groundY - 130, w: 160, h: 14 },
  ];
  player.y = groundY - player.h;
  cloud.baseY = groundY - 200;
  cloud.y = cloud.baseY;
}
buildWorld();

const WORDS = ['나 하늘로 돌아가리라', '노을빛 함께 단 둘이서', '기슭에서 놀다가 구름 손짓하면은'];
let fragments = [];
function initFragments() {
  fragments = [
    { x: 540,  y: groundY - 130, word: WORDS[0], collected: false, bob: 0 },
    { x: 1340, y: groundY - 190, word: WORDS[1], collected: false, bob: 1 },
    { x: 3060, y: groundY - 200, word: WORDS[2], collected: false, bob: 2 },  // requires cloud
  ];
}
initFragments();

// ── Background mountains and river ──
const farMtns = [];
for (let i = 0; i < 16; i++) farMtns.push({ x: i * 260 + Math.random() * 60, h: 100 + Math.random() * 80 });
const midMtns = [];
for (let i = 0; i < 20; i++) midMtns.push({ x: i * 200 + Math.random() * 50, h: 70 + Math.random() * 60 });

// drifting background clouds
const bgClouds = [];
for (let i = 0; i < 12; i++) {
  bgClouds.push({
    x: Math.random() * WORLD_W,
    y: 60 + Math.random() * (groundY * 0.4),
    w: 80 + Math.random() * 120,
    drift: 0.05 + Math.random() * 0.08,
    parallax: 0.15 + Math.random() * 0.15,
  });
}

// reeds at riverbank
const reeds = [];
for (let i = 0; i < 70; i++) reeds.push({
  x: Math.random() * WORLD_W,
  h: 24 + Math.random() * 26,
  sway: Math.random() * Math.PI * 2,
});

// fireflies / drifting embers
const embers = [];
for (let i = 0; i < 50; i++) embers.push({
  x: Math.random() * W,
  y: Math.random() * H,
  r: Math.random() * 1.4 + 0.4,
  vy: -(Math.random() * 0.3 + 0.1),
  vx: (Math.random() - 0.5) * 0.4,
  phase: Math.random() * Math.PI * 2,
});

// ─────────────────────────────────────────
function drawSky() {
  const grad = bgCtx.createLinearGradient(0, 0, 0, groundY + 20);
  grad.addColorStop(0,   '#2a1430');
  grad.addColorStop(0.25,'#5a1f30');
  grad.addColorStop(0.5, '#a83a26');
  grad.addColorStop(0.75,'#e07028');
  grad.addColorStop(1,   '#f0a040');
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0, 0, W, H);
}

function drawSun() {
  const sx = W * 0.7 - camX * 0.04;
  const sy = groundY - 30;
  const grd = bgCtx.createRadialGradient(sx, sy, 0, sx, sy, 200);
  grd.addColorStop(0,    'rgba(255,220,160,0.55)');
  grd.addColorStop(0.25, 'rgba(255,170,90,0.3)');
  grd.addColorStop(0.6,  'rgba(220,90,40,0.12)');
  grd.addColorStop(1,    'rgba(0,0,0,0)');
  bgCtx.fillStyle = grd;
  bgCtx.fillRect(0, 0, W, H);
  bgCtx.beginPath();
  bgCtx.arc(sx, sy, 38, 0, Math.PI * 2);
  bgCtx.fillStyle = 'rgba(255,210,140,0.95)';
  bgCtx.fill();
}

function drawBgClouds() {
  bgCtx.save();
  bgClouds.forEach(c => {
    c.x += c.drift;
    if (c.x > WORLD_W + 200) c.x = -200;
    const cx = c.x - camX * c.parallax;
    if (cx < -200 || cx > W + 200) return;
    const cy = c.y;
    bgCtx.beginPath();
    bgCtx.ellipse(cx, cy, c.w * 0.5, 12, 0, 0, Math.PI * 2);
    bgCtx.ellipse(cx + c.w * 0.25, cy - 6, c.w * 0.35, 10, 0, 0, Math.PI * 2);
    bgCtx.ellipse(cx - c.w * 0.25, cy - 4, c.w * 0.3, 9, 0, 0, Math.PI * 2);
    bgCtx.fillStyle = 'rgba(255,180,120,0.55)';
    bgCtx.fill();
  });
  bgCtx.restore();
}

function drawFarMtns() {
  bgCtx.save();
  bgCtx.translate(-camX * 0.1, 0);
  bgCtx.beginPath();
  bgCtx.moveTo(-100, groundY + 10);
  farMtns.forEach(m => {
    bgCtx.lineTo(m.x, groundY - m.h);
    bgCtx.lineTo(m.x + 130, groundY - m.h * 0.5);
  });
  bgCtx.lineTo(WORLD_W + 200, groundY + 10);
  bgCtx.closePath();
  bgCtx.fillStyle = 'rgba(80,30,40,0.85)';
  bgCtx.fill();
  bgCtx.restore();
}
function drawMidMtns() {
  bgCtx.save();
  bgCtx.translate(-camX * 0.22, 0);
  bgCtx.beginPath();
  bgCtx.moveTo(-100, groundY + 10);
  midMtns.forEach(m => {
    bgCtx.lineTo(m.x, groundY - m.h);
    bgCtx.lineTo(m.x + 110, groundY - m.h * 0.55);
  });
  bgCtx.lineTo(WORLD_W + 200, groundY + 10);
  bgCtx.closePath();
  bgCtx.fillStyle = 'rgba(45,15,25,0.92)';
  bgCtx.fill();
  bgCtx.restore();
}

function drawRiver() {
  // foreground river reflections at bottom
  const grad = ctx.createLinearGradient(0, groundY, 0, H);
  grad.addColorStop(0, 'rgba(220,110,60,0.85)');
  grad.addColorStop(0.5, 'rgba(120,50,40,0.92)');
  grad.addColorStop(1, 'rgba(30,15,20,1)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, groundY, W, H - groundY);
  // ripple lines
  const t = Date.now() * 0.001;
  for (let i = 0; i < 6; i++) {
    const ry = groundY + 14 + i * 14;
    ctx.beginPath();
    for (let px = 0; px < W; px += 16) {
      const wx = px + camX;
      ctx.lineTo(px, ry + Math.sin(wx * 0.02 + t + i) * 2);
    }
    ctx.strokeStyle = `rgba(255,220,180,${0.18 - i * 0.025})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawReeds() {
  ctx.save();
  const t = Date.now() * 0.0009;
  reeds.forEach(r => {
    const sx = r.x - camX * 0.85;
    if (sx < -20 || sx > W + 20) return;
    const sway = Math.sin(t + r.sway) * 5;
    ctx.strokeStyle = 'rgba(20,8,12,0.85)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(sx, groundY);
    ctx.quadraticCurveTo(sx + sway * 0.5, groundY - r.h * 0.5, sx + sway, groundY - r.h);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx + sway, groundY - r.h, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,180,120,0.7)';
    ctx.fill();
  });
  ctx.restore();
}

function drawPlatforms() {
  platforms.slice(1).forEach(p => {
    const px = p.x - camX;
    if (px > W + 50 || px + p.w < -50) return;
    ctx.fillStyle = 'rgba(40,15,20,0.95)';
    ctx.fillRect(px, p.y, p.w, p.h);
    ctx.fillStyle = 'rgba(255,170,100,0.6)';
    ctx.fillRect(px, p.y, p.w, 1.5);
  });
}

// ── Cloud (rideable) ──
function drawCloud() {
  cloud.phase += 0.02;
  if (!player.mounted) cloud.y = cloud.baseY + Math.sin(cloud.phase) * 8;

  const cx = cloud.x - camX;
  if (cx > -200 && cx < W + 200) {
    const cy = cloud.y;
    // glow underneath
    const glw = ctx.createRadialGradient(cx, cy + 4, 0, cx, cy + 4, 100);
    glw.addColorStop(0, 'rgba(255,200,140,0.35)');
    glw.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glw;
    ctx.fillRect(cx - 100, cy - 50, 200, 120);
    // body
    ctx.beginPath();
    ctx.ellipse(cx, cy, 50, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 22, cy - 6, 28, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - 22, cy - 4, 26, 13, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - 8,  cy - 12, 22, 11, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,225,190,0.95)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,170,100,0.5)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // mount hint
  const dx = Math.abs(cloud.x - player.x);
  const dy = Math.abs(cloud.y - (player.y + player.h/2));
  const hint = document.getElementById('s2mount_hint');
  if (!player.mounted && dx < 70 && dy < 80 && started && !cleared) {
    hint.classList.add('show');
  } else {
    hint.classList.remove('show');
  }
}

function tryToggleMount() {
  if (cleared || !started) return;
  if (player.mounted) {
    player.mounted = false;
    document.getElementById('s2mounted_bar').classList.remove('show');
  } else {
    const dx = Math.abs(cloud.x - player.x);
    const dy = Math.abs(cloud.y - (player.y + player.h/2));
    if (dx < 70 && dy < 80) {
      player.mounted = true;
      document.getElementById('s2mounted_bar').classList.add('show');
      document.getElementById('s2mount_hint').classList.remove('show');
    }
  }
}

function drawFragments() {
  const t = Date.now() / 1000;
  fragments.forEach((f, i) => {
    if (f.collected) return;
    const fx = f.x - camX;
    if (fx < -100 || fx > W + 100) return;
    const bob = Math.sin(t * 1.4 + f.bob * 2) * 6;
    const fy = f.y + bob;
    const glw = ctx.createRadialGradient(fx, fy, 0, fx, fy, 60);
    glw.addColorStop(0, 'rgba(255,200,140,0.32)');
    glw.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glw;
    ctx.fillRect(fx - 60, fy - 60, 120, 120);
    ctx.save();
    ctx.translate(fx, fy);
    const pulse = 1 + Math.sin(t * 2 + i) * 0.06;
    ctx.scale(pulse, pulse);
    ctx.beginPath();
    ctx.moveTo(0, -16); ctx.lineTo(11, 0); ctx.lineTo(0, 16); ctx.lineTo(-11, 0);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,200,140,0.75)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,180,100,0.18)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-3, -4, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,240,210,0.95)';
    ctx.fill();
    ctx.restore();

    const dist = Math.hypot(f.x - player.x, f.y - (player.y + player.h/2));
    if (dist < 90) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, (90 - dist) / 90);
      ctx.font = '14px "Noto Serif KR", serif';
      ctx.fillStyle = 'rgba(255,225,185,0.95)';
      ctx.textAlign = 'center';
      ctx.fillText(f.word, fx, fy - 28);
      ctx.restore();
    }
  });
}

function drawEmbers() {
  const t = Date.now() / 1000;
  embers.forEach(e => {
    e.y += e.vy;
    e.x += e.vx + Math.sin(t * 0.7 + e.phase) * 0.1;
    if (e.y < -10) { e.y = H + 10; e.x = Math.random() * W; }
    if (e.x < 0) e.x = W; if (e.x > W) e.x = 0;
    const tw = 0.5 + Math.sin(t * 2 + e.phase) * 0.5;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,180,100,${0.6 * tw})`;
    ctx.fill();
  });
}

function drawPlayer() {
  let px, py;
  if (player.mounted) {
    px = cloud.x - camX;
    py = cloud.y - player.h - 4;
  } else {
    px = player.x - camX;
    py = player.y;
  }
  const t = Date.now() / 1000;
  ctx.save();
  ctx.translate(px, py);

  let legSwing = 0, armSwing = 0;
  const moving = Math.abs(player.vx) > 0.5 && !player.mounted;
  if (moving) {
    player.walkTimer += 0.13;
    legSwing = Math.sin(player.walkTimer) * 12;
    armSwing = Math.cos(player.walkTimer) * 8;
  }
  const flip = player.dir < 0 ? -1 : 1;
  ctx.scale(flip, 1);

  if (!player.mounted) {
    ctx.save();
    ctx.scale(1, 0.3);
    ctx.beginPath();
    ctx.ellipse(0, player.h + 10, 14, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();
    ctx.restore();
  }

  ctx.strokeStyle = '#3a1818';
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
  ctx.fillStyle = '#5a2018';
  ctx.fill();

  ctx.strokeStyle = '#5a2018';
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
  ctx.fillStyle = '#e0b88c';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, headY - 2, 9, Math.PI, 0);
  ctx.fillStyle = '#1a0808';
  ctx.fill();
  ctx.restore();
}

const GRAVITY = 0.45;
const MOVE_SPEED = 2.9;
const JUMP_FORCE = -10;

function updatePlayer() {
  if (!started || cleared) return;
  const left  = keys['ArrowLeft']  || keys['a'] || keys['A'];
  const right = keys['ArrowRight'] || keys['d'] || keys['D'];
  const jump  = keys['ArrowUp']    || keys['w'] || keys['W'] || keys[' '];
  const down  = keys['ArrowDown']  || keys['s'] || keys['S'];

  if (player.mounted) {
    // Flying control on cloud
    let cvx = 0, cvy = 0;
    if (left)  { cvx -= 2.4; player.dir = -1; }
    if (right) { cvx += 2.4; player.dir =  1; }
    if (jump)  cvy -= 2.0;
    if (down)  cvy += 2.0;
    cloud.vx += (cvx - cloud.vx) * 0.18;
    cloud.vy += (cvy - cloud.vy) * 0.18;
    cloud.x += cloud.vx;
    cloud.y += cloud.vy;
    if (cloud.x < 60) cloud.x = 60;
    if (cloud.x > WORLD_W - 60) cloud.x = WORLD_W - 60;
    if (cloud.y < 60) cloud.y = 60;
    if (cloud.y > groundY - 40) cloud.y = groundY - 40;
    // sync player position
    player.x = cloud.x;
    player.y = cloud.y - player.h - 4;
    player.vy = 0;
  } else {
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
  }

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
  document.getElementById('s2dot' + i).classList.add('collected');
  const lineEl = document.getElementById('s2line' + i);
  if (lineEl) lineEl.classList.add('collected');
  const popup = document.getElementById('s2word_popup');
  popup.textContent = word;
  popup.style.left = (fragments[i].x - camX) + 'px';
  popup.style.top  = (fragments[i].y - 10) + 'px';
  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), 1400);
  if (collected >= TOTAL) setTimeout(showStageClear, 1600);
}

function showStageClear() {
  cleared = true;
  document.getElementById('s2stage_clear').classList.add('show');
  setTimeout(() => { if (window.onStageClear) window.onStageClear(2); }, 3200);
}

function loop() {
  bgCtx.clearRect(0, 0, W, H);
  ctx.clearRect(0, 0, W, H);
  drawSky();
  drawSun();
  drawBgClouds();
  drawFarMtns();
  drawMidMtns();
  drawRiver();
  drawReeds();
  drawPlatforms();
  drawCloud();
  drawFragments();
  drawEmbers();
  drawPlayer();
  updatePlayer();
  requestAnimationFrame(loop);
}

function gameStartS2() { started = true; }

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    const ts = document.getElementById('s2title_screen');
    if (ts && ts.style.display !== 'none' && !ts.classList.contains('out')) {
      if (typeof startGame === 'function') startGame();
    }
  }
});

requestAnimationFrame(loop);

window.gameStartS2 = gameStartS2;
window.initStage2 = function() {
  resize(); buildWorld(); initFragments();
  collected = 0; cleared = false; started = false; camX = 0;
  player.x = 160; player.vx = 0; player.vy = 0; player.mounted = false;
  cloud.x = 1850; cloud.y = cloud.baseY; cloud.vx = 0; cloud.vy = 0;
  for (let i = 0; i < 3; i++) {
    const d = document.getElementById('s2dot' + i); if (d) d.classList.remove('collected');
    const l = document.getElementById('s2line' + i); if (l) l.classList.remove('collected');
  }
  const sc = document.getElementById('s2stage_clear'); if (sc) sc.classList.remove('show');
  const mb = document.getElementById('s2mounted_bar'); if (mb) mb.classList.remove('show');
};

})();
