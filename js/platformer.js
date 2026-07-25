const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const healthBar = document.getElementById('health-bar');
const scoreEl = document.getElementById('score');
const startOverlay = document.getElementById('start-overlay');
const gameOverOverlay = document.getElementById('gameover-overlay');
const endTitle = document.getElementById('end-title');
const endScore = document.getElementById('end-score');
const startBtn = document.getElementById('start-btn');
const retryBtn = document.getElementById('retry-btn');
const hint = document.getElementById('hint');

let isPlaying = false;
let lastTime = 0;
let camera = { x: 0, y: 0 };
let particles = [];
let floatingTexts = [];
let shake = { amount: 0, duration: 0 };
let levelComplete = false;

const GAME_WIDTH = 3200;
const GAME_HEIGHT = 1200;
const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 540;

canvas.width = VIEW_WIDTH;
canvas.height = VIEW_HEIGHT;

const keys = { left: false, right: false, up: false, down: false, jump: false, jumpPressed: false };

const player = {
  x: 120,
  y: 400,
  w: 24,
  h: 40,
  vx: 0,
  vy: 0,
  onGround: false,
  wasOnGround: false,
  facingRight: true,
  dead: false,
  invincible: 0,
  spawnX: 120,
  spawnY: 400,
  visualScaleX: 1,
  visualScaleY: 1,
  runTime: 0,
  coyoteTimer: 0,
  jumpBuffer: 0,
  airJumpsLeft: 1,
  health: 5,
  coins: 0
};

const CONSTANTS = {
  maxSpeed: 280,
  acceleration: 1800,
  friction: 2400,
  airAcceleration: 1400,
  airFriction: 300,
  turnBoost: 1.6,
  jumpVelocity: -440,
  doubleJumpVelocity: -380,
  gravityUp: 1100,
  gravityDown: 1400,
  maxFallSpeed: 700,
  coyoteTime: 0.08,
  jumpBufferTime: 0.1,
  jumpCutMultiplier: 0.4,
  stompBounceVelocity: -340
};

let platforms = [];
let enemies = [];
let coins = [];
let hazards = [];
let bouncePads = [];
let checkpoints = [];
let levelEnd = null;

function initLevel() {
  platforms = [];
  enemies = [];
  coins = [];
  hazards = [];
  bouncePads = [];
  checkpoints = [];
  particles = [];
  floatingTexts = [];
  levelComplete = false;

  // Ground
  platforms.push({ x: 0, y: 600, w: 700, h: 60 });
  platforms.push({ x: 820, y: 600, w: 600, h: 60 });
  platforms.push({ x: 1520, y: 600, w: 800, h: 60 });
  platforms.push({ x: 2460, y: 600, w: 740, h: 60 });

  // Platforms
  platforms.push({ x: 300, y: 480, w: 140, h: 20 });
  platforms.push({ x: 520, y: 380, w: 140, h: 20 });
  platforms.push({ x: 900, y: 450, w: 140, h: 20 });
  platforms.push({ x: 1150, y: 340, w: 140, h: 20 });
  platforms.push({ x: 1400, y: 240, w: 180, h: 20 });
  platforms.push({ x: 1700, y: 400, w: 140, h: 20 });
  platforms.push({ x: 1950, y: 300, w: 140, h: 20 });
  platforms.push({ x: 2200, y: 420, w: 140, h: 20 });
  platforms.push({ x: 2500, y: 320, w: 140, h: 20 });
  platforms.push({ x: 2800, y: 220, w: 200, h: 20 });

  // One-way platforms (drop through with down+jump)
  platforms.push({ x: 640, y: 520, w: 100, h: 12, oneWay: true });
  platforms.push({ x: 1080, y: 520, w: 100, h: 12, oneWay: true });

  // Enemies
  enemies.push({ x: 900, y: 560, w: 28, h: 36, vx: 80, direction: 1, dead: false, type: 'patrol' });
  enemies.push({ x: 1700, y: 560, w: 28, h: 36, vx: 80, direction: -1, dead: false, type: 'patrol' });
  enemies.push({ x: 2200, y: 560, w: 28, h: 36, vx: 80, direction: 1, dead: false, type: 'patrol' });
  enemies.push({ x: 2600, y: 280, w: 28, h: 36, vx: 60, direction: 1, dead: false, type: 'patrol' });

  // Flying enemies
  enemies.push({ x: 1300, y: 200, w: 28, h: 28, baseY: 200, time: 0, vx: 0, dead: false, type: 'flying' });
  enemies.push({ x: 2400, y: 180, w: 28, h: 28, baseY: 180, time: 2, vx: 0, dead: false, type: 'flying' });

  // Coins
  const coinPositions = [
    [340, 430], [560, 330], [960, 400], [1200, 290], [1460, 190],
    [1740, 350], [1990, 250], [2240, 370], [2540, 270], [2860, 170]
  ];
  coinPositions.forEach(([x, y], i) => {
    coins.push({ x, y, r: 10, collected: false, time: i * 0.7 });
  });

  // Hazards (spikes)
  hazards.push({ x: 760, y: 580, w: 40, h: 20 });
  hazards.push({ x: 1640, y: 580, w: 40, h: 20 });
  hazards.push({ x: 2100, y: 580, w: 40, h: 20 });

  // Bounce pads
  bouncePads.push({ x: 450, y: 360, w: 30, h: 12, active: 0 });
  bouncePads.push({ x: 2050, y: 280, w: 30, h: 12, active: 0 });

  // Checkpoints
  checkpoints.push({ x: 600, y: 560, w: 8, h: 40, active: false });
  checkpoints.push({ x: 1800, y: 560, w: 8, h: 40, active: false });
  checkpoints.push({ x: 2700, y: 560, w: 8, h: 40, active: false });

  // Level end
  levelEnd = { x: 3050, y: 160, w: 40, h: 60 };
}

function resetPlayer() {
  player.x = player.spawnX;
  player.y = player.spawnY;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.wasOnGround = false;
  player.dead = false;
  player.invincible = 0;
  player.airJumpsLeft = 1;
  player.visualScaleX = 1;
  player.visualScaleY = 1;
}

function startGame() {
  isPlaying = true;
  player.health = 5;
  player.coins = 0;
  player.spawnX = 120;
  player.spawnY = 400;
  resetPlayer();
  initLevel();
  updateHealthUI();
  updateScoreUI();
  startOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  hint.style.display = 'block';
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function gameOver(won) {
  isPlaying = false;
  endTitle.textContent = won ? 'LEVEL COMPLETE' : 'GAME OVER';
  endTitle.style.color = won ? '#32cd32' : '#cc0000';
  endScore.textContent = 'Coins: ' + player.coins;
  gameOverOverlay.classList.remove('hidden');
  hint.style.display = 'none';
}

function rectIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function updatePlayer(dt) {
  if (player.dead) return;

  const inputX = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);

  // Horizontal movement
  if (inputX !== 0) {
    let accel = player.onGround ? CONSTANTS.acceleration : CONSTANTS.airAcceleration;
    if (Math.sign(inputX) !== Math.sign(player.vx) && Math.abs(player.vx) > 10) {
      accel *= CONSTANTS.turnBoost;
    }
    const target = inputX * CONSTANTS.maxSpeed;
    player.vx = moveToward(player.vx, target, accel * dt);
  } else {
    const fric = player.onGround ? CONSTANTS.friction : CONSTANTS.airFriction;
    player.vx = moveToward(player.vx, 0, fric * dt);
  }

  // Facing
  if (inputX > 0.1) player.facingRight = true;
  if (inputX < -0.1) player.facingRight = false;

  // Gravity
  if (!player.onGround) {
    const grav = player.vy < 0 ? CONSTANTS.gravityUp : CONSTANTS.gravityDown;
    player.vy = Math.min(player.vy + grav * dt, CONSTANTS.maxFallSpeed);
  }

  // Coyote time and jump buffer
  if (player.onGround) {
    player.coyoteTimer = CONSTANTS.coyoteTime;
    player.airJumpsLeft = 1;
  } else {
    player.coyoteTimer = Math.max(player.coyoteTimer - dt, 0);
  }

  if (keys.jumpPressed) {
    player.jumpBuffer = CONSTANTS.jumpBufferTime;
    keys.jumpPressed = false;
  } else {
    player.jumpBuffer = Math.max(player.jumpBuffer - dt, 0);
  }

  // Jump
  if (player.jumpBuffer > 0) {
    if (player.coyoteTimer > 0) {
      player.vy = CONSTANTS.jumpVelocity;
      player.coyoteTimer = 0;
      player.jumpBuffer = 0;
      player.onGround = false;
      player.visualScaleX = 0.8;
      player.visualScaleY = 1.2;
      spawnParticles(player.x + player.w / 2, player.y + player.h, 8, '#aaa');
    } else if (player.airJumpsLeft > 0) {
      player.vy = CONSTANTS.doubleJumpVelocity;
      player.airJumpsLeft -= 1;
      player.jumpBuffer = 0;
      player.visualScaleX = 0.8;
      player.visualScaleY = 1.2;
      spawnParticles(player.x + player.w / 2, player.y + player.h, 6, '#aaa');
    }
  }

  // Jump cut
  if (keys.jumpReleased) {
    if (player.vy < 0) {
      player.vy *= CONSTANTS.jumpCutMultiplier;
    }
    keys.jumpReleased = false;
  }

  // Apply velocity
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // Collision detection
  player.onGround = false;

  // Platform collisions
  platforms.forEach(p => {
    if (rectIntersect(player, p)) {
      const overlapTop = (player.y + player.h) - p.y;
      const overlapBottom = (p.y + p.h) - player.y;
      const overlapLeft = (player.x + player.w) - p.x;
      const overlapRight = (p.x + p.w) - player.x;

      const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight);

      if (minOverlap === overlapTop && player.vy >= 0 && (!p.oneWay || player.y + player.h - player.vy * dt <= p.y + 5)) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (!p.oneWay) {
        if (minOverlap === overlapBottom && player.vy <= 0) {
          player.y = p.y + p.h;
          player.vy = 0;
        } else if (minOverlap === overlapLeft && player.vx >= 0) {
          player.x = p.x - player.w;
          player.vx = 0;
        } else if (minOverlap === overlapRight && player.vx <= 0) {
          player.x = p.x + p.w;
          player.vx = 0;
        }
      }
    }
  });

  // Detect landing
  if (!player.wasOnGround && player.onGround && player.vy >= 0) {
    player.visualScaleX = 1.3;
    player.visualScaleY = 0.7;
    spawnParticles(player.x + player.w / 2, player.y + player.h, 6, '#888');
  }
  player.wasOnGround = player.onGround;

  // Bounds
  if (player.y > GAME_HEIGHT + 200) {
    takeDamage();
  }

  // Invincibility
  if (player.invincible > 0) {
    player.invincible -= dt;
  }

  // Visual squash/stretch recovery
  player.visualScaleX = lerp(player.visualScaleX, 1, 14 * dt);
  player.visualScaleY = lerp(player.visualScaleY, 1, 14 * dt);

  // Run animation
  const speedRatio = Math.abs(player.vx) / CONSTANTS.maxSpeed;
  if (player.onGround && speedRatio > 0.2) {
    player.runTime += dt * 14 * speedRatio;
  } else {
    player.runTime = 0;
  }
}

function updateEnemies(dt) {
  enemies.forEach(e => {
    if (e.dead) return;

    if (e.type === 'patrol') {
      e.x += e.vx * e.direction * dt;

      // Turn at platform edges
      let onGround = false;
      platforms.forEach(p => {
        if (e.x + e.w / 2 > p.x && e.x + e.w / 2 < p.x + p.w && e.y + e.h <= p.y + 5 && e.y + e.h >= p.y - 5) {
          onGround = true;
        }
      });

      // Simple wall/edge turn
      let blocked = false;
      platforms.forEach(p => {
        const probeX = e.direction > 0 ? e.x + e.w + 2 : e.x - 2;
        if (probeX > p.x && probeX < p.x + p.w && e.y + e.h > p.y && e.y < p.y + p.h) {
          blocked = true;
        }
      });

      const edgeAhead = !platforms.some(p => {
        const probeX = e.x + e.w / 2 + e.direction * 20;
        return probeX > p.x && probeX < p.x + p.w && e.y + e.h <= p.y + 5 && e.y + e.h >= p.y - 20;
      });

      if (blocked || edgeAhead) {
        e.direction *= -1;
      }

      // Gravity
      if (!onGround) {
        e.y += CONSTANTS.gravityDown * dt * dt * 0.5;
      }

      // Stomp detection
      if (rectIntersect(player, e)) {
        if (player.vy > 0 && player.y + player.h - player.vy * dt <= e.y + e.h * 0.3) {
          e.dead = true;
          player.vy = CONSTANTS.stompBounceVelocity;
          player.visualScaleX = 0.8;
          player.visualScaleY = 1.2;
          spawnParticles(e.x + e.w / 2, e.y + e.h / 2, 10, '#fff');
          addFloatingText(e.x, e.y, '+100');
          shakeScreen(4, 0.1);
        } else if (player.invincible <= 0) {
          takeDamage();
        }
      }
    } else if (e.type === 'flying') {
      e.time += dt;
      e.y = e.baseY + Math.sin(e.time * 3) * 30;

      if (rectIntersect(player, e) && player.invincible <= 0) {
        takeDamage();
      }
    }
  });
}

function updateCollectibles(dt) {
  // Coins
  coins.forEach(c => {
    if (c.collected) return;
    c.time += dt;
    const bob = Math.sin(c.time * 4) * 4;

    const playerCenter = { x: player.x + player.w / 2, y: player.y + player.h / 2 };
    const dx = playerCenter.x - c.x;
    const dy = playerCenter.y - (c.y + bob);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < c.r + player.w / 2) {
      c.collected = true;
      player.coins++;
      updateScoreUI();
      spawnParticles(c.x, c.y + bob, 6, '#ffd700');
      addFloatingText(c.x, c.y + bob, '+10');
    }
  });

  // Hazards
  hazards.forEach(h => {
    if (rectIntersect(player, h) && player.invincible <= 0) {
      takeDamage();
    }
  });

  // Bounce pads
  bouncePads.forEach(b => {
    if (rectIntersect(player, b) && player.vy >= 0) {
      player.vy = -850;
      player.onGround = false;
      b.active = 0.2;
      spawnParticles(b.x + b.w / 2, b.y, 8, '#0ff');
      shakeScreen(3, 0.08);
    }
    if (b.active > 0) b.active -= dt;
  });

  // Checkpoints
  checkpoints.forEach(cp => {
    if (!cp.active && rectIntersect(player, cp)) {
      cp.active = true;
      player.spawnX = cp.x;
      player.spawnY = cp.y - 60;
      spawnParticles(cp.x + cp.w / 2, cp.y + cp.h / 2, 8, '#32cd32');
      shakeScreen(2, 0.05);
    }
  });

  // Level end
  if (levelEnd && rectIntersect(player, levelEnd)) {
    levelComplete = true;
    gameOver(true);
  }
}

function takeDamage() {
  if (player.invincible > 0 || player.dead) return;
  player.health--;
  updateHealthUI();
  if (player.health <= 0) {
    player.dead = true;
    shakeScreen(8, 0.2);
    setTimeout(() => gameOver(false), 1000);
  } else {
    player.invincible = 1.2;
    player.vy = -250;
    player.vx = -200 * (player.facingRight ? 1 : -1);
    shakeScreen(6, 0.15);
  }
}

function updateCamera(dt) {
  const targetX = player.x - VIEW_WIDTH / 2 + player.w / 2;
  const targetY = player.y - VIEW_HEIGHT / 2 + player.h / 2;
  camera.x = lerp(camera.x, targetX, 5 * dt);
  camera.y = lerp(camera.y, targetY, 5 * dt);
  camera.x = Math.max(0, Math.min(camera.x, GAME_WIDTH - VIEW_WIDTH));
  camera.y = Math.max(-200, Math.min(camera.y, GAME_HEIGHT - VIEW_HEIGHT));

  if (shake.duration > 0) {
    shake.duration -= dt;
    camera.x += (Math.random() - 0.5) * shake.amount;
    camera.y += (Math.random() - 0.5) * shake.amount;
  }
}

function spawnParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 200,
      vy: (Math.random() - 0.5) * 200,
      life: 0.3 + Math.random() * 0.3,
      color,
      size: 2 + Math.random() * 3
    });
  }
}

function addFloatingText(x, y, text) {
  floatingTexts.push({ x, y, text, life: 0.8, vy: -40 });
}

function shakeScreen(amount, duration) {
  shake.amount = amount;
  shake.duration = duration;
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 500 * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }

  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const t = floatingTexts[i];
    t.y += t.vy * dt;
    t.life -= dt;
    if (t.life <= 0) floatingTexts.splice(i, 1);
  }
}

function draw() {
  // Sky
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
  grad.addColorStop(0, '#1a0a1a');
  grad.addColorStop(1, '#3a1a2a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  ctx.save();
  ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));

  // Distant mountains/parallax
  ctx.fillStyle = '#0f050f';
  for (let i = 0; i < 8; i++) {
    const mx = i * 500 - camera.x * 0.2;
    const my = 500 + Math.sin(i * 1.5) * 80;
    ctx.beginPath();
    ctx.moveTo(mx, GAME_HEIGHT);
    ctx.lineTo(mx + 250, my);
    ctx.lineTo(mx + 500, GAME_HEIGHT);
    ctx.fill();
  }

  // Platforms
  platforms.forEach(p => {
    ctx.fillStyle = p.oneWay ? '#4a2a3a' : '#2a1a2a';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#5a3a4a';
    ctx.fillRect(p.x, p.y, p.w, 4);
  });

  // Hazards
  hazards.forEach(h => {
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const sx = h.x + i * (h.w / 3);
      ctx.moveTo(sx, h.y + h.h);
      ctx.lineTo(sx + h.w / 6, h.y);
      ctx.lineTo(sx + h.w / 3, h.y + h.h);
    }
    ctx.fill();
  });

  // Bounce pads
  bouncePads.forEach(b => {
    const squash = b.active > 0 ? 1.4 : 1;
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(b.x + b.w / 2 - (b.w * squash) / 2, b.y + b.h - b.h * (b.active > 0 ? 0.6 : 1), b.w * squash, b.h * (b.active > 0 ? 0.6 : 1));
  });

  // Checkpoints
  checkpoints.forEach(cp => {
    ctx.fillStyle = cp.active ? '#32cd32' : '#555';
    ctx.fillRect(cp.x, cp.y, cp.w, cp.h);
    ctx.fillStyle = cp.active ? '#32cd32' : '#777';
    ctx.beginPath();
    ctx.moveTo(cp.x + cp.w, cp.y + 4);
    ctx.lineTo(cp.x + cp.w + 20, cp.y + 12);
    ctx.lineTo(cp.x + cp.w, cp.y + 20);
    ctx.fill();
  });

  // Level end
  if (levelEnd) {
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(levelEnd.x, levelEnd.y, levelEnd.w, levelEnd.h);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText('EXIT', levelEnd.x + 6, levelEnd.y - 8);
  }

  // Coins
  coins.forEach(c => {
    if (c.collected) return;
    const bob = Math.sin(c.time * 4) * 4;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(c.x, c.y + bob, c.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Enemies
  enemies.forEach(e => {
    if (e.dead) return;
    ctx.fillStyle = e.type === 'flying' ? '#9932cc' : '#1a1a1a';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    // Eyes
    ctx.fillStyle = '#ff0000';
    const eyeOffset = e.direction > 0 ? 4 : -4;
    ctx.fillRect(e.x + e.w / 2 + eyeOffset - 2, e.y + 8, 4, 4);
  });

  // Player
  if (!player.dead || Math.floor(performance.now() / 100) % 2 === 0) {
    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
    const runBob = player.onGround ? Math.sin(player.runTime) * 2.5 * (Math.abs(player.vx) / CONSTANTS.maxSpeed) : 0;
    ctx.translate(0, runBob);
    ctx.scale(player.facingRight ? player.visualScaleX : -player.visualScaleX, player.visualScaleY);

    // Body
    ctx.fillStyle = player.invincible > 0 && Math.floor(performance.now() / 75) % 2 === 0 ? 'rgba(255,255,255,0.5)' : '#e0e0e0';
    ctx.fillRect(-player.w / 2, -player.h / 2, player.w, player.h);

    // Eyes
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(4, -player.h / 2 + 10, 5, 5);

    // Cape/cloak detail
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(-player.w / 2 + 2, -player.h / 2 + 22, player.w - 4, 12);

    ctx.restore();
  }

  // Particles
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life / 0.6);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  });
  ctx.globalAlpha = 1;

  // Floating text
  floatingTexts.forEach(t => {
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText(t.text, t.x, t.y);
  });

  ctx.restore();
}

function moveToward(current, target, maxDelta) {
  if (Math.abs(target - current) <= maxDelta) return target;
  return current + Math.sign(target - current) * maxDelta;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function gameLoop(time) {
  if (!isPlaying) return;
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  updatePlayer(dt);
  updateEnemies(dt);
  updateCollectibles(dt);
  updateParticles(dt);
  updateCamera(dt);
  draw();

  if (!levelComplete && player.health > 0) {
    requestAnimationFrame(gameLoop);
  }
}

function updateHealthUI() {
  healthBar.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const rose = document.createElement('div');
    rose.className = 'rose' + (i >= player.health ? ' empty' : '');
    healthBar.appendChild(rose);
  }
}

function updateScoreUI() {
  scoreEl.textContent = 'COINS: ' + player.coins;
}

function onKeyDown(e) {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.down = true;
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    if (!keys.jump) keys.jumpPressed = true;
    keys.jump = true;
  }
}

function onKeyUp(e) {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.down = false;
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    keys.jump = false;
    keys.jumpReleased = true;
  }
}

window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);
startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);

updateHealthUI();
updateScoreUI();
