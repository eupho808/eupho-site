/**
 * Main game controller: loop, rendering, combat resolution, UI state.
 */
import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { ParticleSystem } from './ParticleSystem.js';
import { FloatingTextManager } from './FloatingText.js';
import { Player } from './Player.js';
import { Level } from './Level.js';
import { CardSoldier, DollEnemy, Madcap, RabbitBoss } from './Enemy.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

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

    this.camera.setBounds(0, -200, this.level.width, this.level.height);

    this.spawnEnemies();

    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
  }

  spawnEnemies() {
    this.enemies = [];
    this.enemies.push(new CardSoldier(600, 840));
    this.enemies.push(new CardSoldier(1300, 840));
    this.enemies.push(new DollEnemy(1100, 520));
    this.enemies.push(new CardSoldier(2100, 840));
    this.enemies.push(new Madcap(1600, 400));
    this.enemies.push(new DollEnemy(2400, 500));
    this.enemies.push(new CardSoldier(3000, 840));
    this.enemies.push(new Madcap(3400, 300));

    // Mini-boss arena
    const boss = new RabbitBoss(3850, 740);
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
      setTimeout(() => this.onGameOver(), 1200);
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
            e.takeDamage(1, 'heavy', this);
            this.projectiles.splice(i, 1);
            break;
          }
        }
      }

      // Platform collision
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
    const playerRect = { x: this.player.x, y: this.player.y, w: this.player.width, h: this.player.height };

    for (const c of this.level.collectibles) {
      if (c.collected) continue;
      const dist = Math.hypot(this.player.x + this.player.width / 2 - c.x, this.player.y + this.player.height / 2 - c.y);
      if (dist < 35) {
        c.collected = true;
        if (c.type === 'memory') {
          this.memories.push(`Memory ${this.memories.length + 1}: A fragment of Wonderland shifts...`);
          this.floatingText.add(c.x, c.y, 'MEMORY', '#aaf');
          this.player.hysteria = Math.min(this.player.hysteria + 15, this.player.maxHysteria);
        } else {
          this.player.teeth++;
          this.floatingText.add(c.x, c.y, '+TOOTH', '#fff');
        }
        this.particles.spawn(6, c.x, c.y, {
          colors: c.type === 'memory' ? ['#aaf', '#fff'] : ['#fff', '#ccc'],
          minSpeed: 40, maxSpeed: 100, gravity: 200, life: 0.4
        });
      }
    }
  }

  updateSavePoints() {
    const playerRect = { x: this.player.x, y: this.player.y, w: this.player.width, h: this.player.height };
    for (const s of this.level.savePoints) {
      const saveRect = { x: s.x, y: s.y, w: s.w, h: s.h };
      if (rectIntersect(playerRect, saveRect)) {
        if (!s.active) {
          s.active = true;
          this.player.spawnX = s.x + 25;
          this.player.spawnY = s.y - 60;
          this.particles.spawn(12, s.x + s.w / 2, s.y + s.h / 2, {
            colors: ['#ffd700', '#fff'], minSpeed: 50, maxSpeed: 120, gravity: 100, life: 0.6
          });
          this.camera.addShake(2, 0.1);
        }
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
        if (type === 'heavy') {
          this.projectiles.push({
            x: x, y: y,
            vx: (ex - x) / dist * 250,
            vy: (ey - y) / dist * 250,
            radius: 4,
            damage: 1,
            enemy: false,
            life: 0.4
          });
        }
      }
    }
  }

  draw() {
    const ctx = this.ctx;

    this.level.draw(ctx, this.camera);

    this.enemies.forEach(e => e.draw(ctx, this.camera));

    // Projectiles
    for (const p of this.projectiles) {
      const sx = p.x - this.camera.x;
      const sy = p.y - this.camera.y;
      ctx.fillStyle = p.enemy ? '#ff00ff' : '#ffaa00';
      ctx.beginPath();
      ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    this.player.draw(ctx, this.camera);
    this.particles.draw(ctx, this.camera);
    this.floatingText.draw(ctx, this.camera);

    // Post-processing vignette
    const grad = ctx.createRadialGradient(
      this.width / 2, this.height / 2, this.height * 0.4,
      this.width / 2, this.height / 2, this.height * 0.9
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
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
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < circle.radius * circle.radius;
}
