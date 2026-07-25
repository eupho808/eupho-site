import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { ParticleSystem } from './ParticleSystem.js';
import { FloatingTextManager } from './FloatingText.js';
import { Player } from './Player.js';
import { Level } from './Level.js';
import { CardSoldier, InsaneChild, Madcap, WhiteRabbitBoss } from './Enemy.js';
import { Atmosphere } from './Atmosphere.js';

export class Game {
  constructor(renderCanvas, displayCanvas) {
    this.renderCanvas = renderCanvas;
    this.displayCanvas = displayCanvas;
    this.ctx = renderCanvas.getContext('2d');
    this.atmosphere = new Atmosphere(renderCanvas);
    this.useWebGL = this.atmosphere.supported;

    this.width = renderCanvas.width;
    this.height = renderCanvas.height;

    this.input = new Input();
    this.camera = new Camera(this.width, this.height);
    this.particles = new ParticleSystem();
    this.floatingText = new FloatingTextManager();

    this.level = new Level('vale');
    this.player = new Player(120, 760, this);
    this.enemies = [];
    this.projectiles = [];
    this.paused = false;
    this.gameOver = false;
    this.victory = false;
    this.memories = [];

    this.camera.setBounds(0, -300, this.level.width, this.level.height);
    this.spawnEnemies();

    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
  }

  spawnEnemies() {
    this.enemies = [];
    this.enemies.push(new CardSoldier(600, 840));
    this.enemies.push(new CardSoldier(1350, 840));
    this.enemies.push(new InsaneChild(1100, 520));
    this.enemies.push(new CardSoldier(2150, 840));
    this.enemies.push(new Madcap(1700, 380));
    this.enemies.push(new InsaneChild(2500, 500));
    this.enemies.push(new CardSoldier(3100, 840));
    this.enemies.push(new Madcap(3500, 280));
    this.enemies.push(new InsaneChild(3900, 840));

    const boss = new WhiteRabbitBoss(4050, 760);
    boss.game = this;
    this.enemies.push(boss);
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  loop(time) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    if (!this.paused && !this.gameOver && !this.victory) {
      this.update(dt);
    }
    this.draw();
    this.input.update();

    if (!this.gameOver && !this.victory) {
      requestAnimationFrame(this.loop);
    }
  }

  update(dt) {
    this.particles.spawnAmbient({ x: this.camera.x, y: this.camera.y, w: this.width, h: this.height }, 'ash', dt);
    this.particles.spawnAmbient({ x: this.camera.x, y: this.camera.y, w: this.width, h: this.height }, 'ink', dt);
    this.particles.spawnAmbient({ x: this.camera.x, y: this.camera.y, w: this.width, h: this.height }, 'spore', dt);

    this.player.update(dt, this.input, this.level);
    this.enemies.forEach(e => {
      e.game = this;
      e.update(dt, this.level, this.player, this);
    });

    this.updateProjectiles(dt);
    this.updateCollectibles();
    this.updateSavePoints();
    this.checkExit();

    this.particles.update(dt);
    this.floatingText.update(dt);

    if (!this.player.dead) {
      this.camera.follow(this.player, dt);
    }

    if (this.player.dead && !this.gameOver) {
      this.gameOver = true;
      setTimeout(() => this.onGameOver(), 1400);
    }
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      if (p.enemy) {
        const playerRect = { x: this.player.x, y: this.player.y, w: this.player.width, h: this.player.height };
        if (rectCircleIntersect(playerRect, p) && this.player.invincible <= 0) {
          this.player.takeDamage(p.damage, p.x);
          this.projectiles.splice(i, 1);
          continue;
        }
      } else {
        for (const e of this.enemies) {
          if (!e.dead && rectCircleIntersect({ x: e.x, y: e.y, w: e.width, h: e.height }, p)) {
            e.takeDamage(p.damage, 'heavy', this);
            this.projectiles.splice(i, 1);
            break;
          }
        }
      }

      for (const plat of this.level.platforms) {
        if (rectCircleIntersect(plat, p)) {
          this.projectiles.splice(i, 1);
          break;
        }
      }

      if (p.life <= 0) this.projectiles.splice(i, 1);
    }
  }

  updateCollectibles() {
    const pcx = this.player.x + this.player.width / 2;
    const pcy = this.player.y + this.player.height / 2;

    for (const c of this.level.collectibles) {
      if (c.collected) continue;
      const dist = Math.hypot(pcx - c.x, pcy - c.y);
      if (dist < 38) {
        c.collected = true;
        if (c.type === 'memory') {
          this.memories.push(c.text);
          this.floatingText.add(c.x, c.y, 'MEMORY', '#8cf');
          this.player.hysteria = Math.min(this.player.hysteria + 15, this.player.maxHysteria);
        } else {
          this.player.teeth++;
          this.floatingText.add(c.x, c.y, '+TOOTH', '#fff');
        }
        this.particles.spawn(6, c.x, c.y, {
          colors: c.type === 'memory' ? ['#8cf', '#fff'] : ['#fff', '#ccc'],
          minSpeed: 40, maxSpeed: 100, gravity: 200, life: 0.4, glow: c.type === 'memory'
        });
      }
    }
  }

  updateSavePoints() {
    const playerRect = { x: this.player.x, y: this.player.y, w: this.player.width, h: this.player.height };
    for (const s of this.level.savePoints) {
      const saveRect = { x: s.x, y: s.y, w: s.w, h: s.h };
      if (rectIntersect(playerRect, saveRect) && !s.active) {
        s.active = true;
        this.player.spawnX = s.x + s.w / 2 - this.player.width / 2;
        this.player.spawnY = s.y - 70;
        this.player.health = Math.min(this.player.health + 1, this.player.maxHealth);
        this.particles.spawn(12, s.x + s.w / 2, s.y + s.h / 2, {
          colors: ['#ffd700', '#fff'], minSpeed: 50, maxSpeed: 120, gravity: 100, life: 0.6, glow: true
        });
        this.camera.addShake(2, 0.1);
      }
    }
  }

  checkExit() {
    if (!this.level.exit) return;
    const playerRect = { x: this.player.x, y: this.player.y, w: this.player.width, h: this.player.height };
    if (rectIntersect(playerRect, this.level.exit)) {
      this.victory = true;
      this.onVictory();
    }
  }

  hitEnemies(x, y, radius, damage, type) {
    for (const e of this.enemies) {
      if (e.dead) continue;
      const ex = e.x + e.width / 2;
      const ey = e.y + e.height / 2;
      const dist = Math.hypot(x - ex, y - ey);
      if (dist < radius + Math.max(e.width, e.height) / 2) {
        e.takeDamage(damage, type, this);
        if (type === 'light') {
          this.particles.spawn(4, ex, ey, {
            colors: ['#fff', '#aaf'], minSpeed: 40, maxSpeed: 100, gravity: 200, life: 0.2
          });
        }
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this.level.draw(ctx, this.camera);

    // Projectiles behind entities
    for (const p of this.projectiles) {
      const sx = p.x - this.camera.x;
      const sy = p.y - this.camera.y;
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    this.enemies.forEach(e => e.draw(ctx, this.camera));
    this.player.draw(ctx, this.camera);
    this.particles.draw(ctx, this.camera);
    this.floatingText.draw(ctx, this.camera);

    // Apply WebGL post-processing to the off-screen render canvas,
    // then copy the final result to the visible display canvas.
    const hysteria = this.player.hysteriaTimer > 0 ? 1 : 0;
    const distortion = this.player.hysteria / this.player.maxHysteria;

    if (this.useWebGL) {
      this.atmosphere.render(this.renderCanvas, 0.016, hysteria, distortion);
    }

    const displayCtx = this.displayCanvas.getContext('2d');
    displayCtx.setTransform(1, 0, 0, 1, 0, 0);
    displayCtx.clearRect(0, 0, this.width, this.height);
    displayCtx.drawImage(this.renderCanvas, 0, 0);
  }

  onGameOver() {
    if (window.onGameOver) window.onGameOver(this.player.teeth, this.memories.length);
  }

  onVictory() {
    if (window.onVictory) window.onVictory(this.player.teeth, this.memories.length);
  }

  togglePause() {
    this.paused = !this.paused;
  }
}

function rectIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function rectCircleIntersect(rect, circle) {
  const cx = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - cx;
  const dy = circle.y - cy;
  return dx * dx + dy * dy < circle.radius * circle.radius;
}
