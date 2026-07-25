/**
 * Base enemy class and specific enemy types.
 */
export class Enemy {
  constructor(x, y, w, h, type) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
    this.type = type;
    this.vx = 0;
    this.vy = 0;
    this.dead = false;
    this.health = 1;
    this.damage = 1;
    this.invincible = 0;
    this.flash = 0;
    this.facingRight = true;
    this.visualScaleX = 1;
    this.visualScaleY = 1;
  }

  update(dt, level, player, game) {
    if (this.dead) return;
    this.invincible = Math.max(this.invincible - dt, 0);
    this.flash = Math.max(this.flash - dt, 0);
    this.ai(dt, level, player, game);
    this.applyPhysics(dt, level);
    this.visualScaleX = lerp(this.visualScaleX, 1, 10 * dt);
    this.visualScaleY = lerp(this.visualScaleY, 1, 10 * dt);
  }

  ai(dt, level, player, game) {}

  applyPhysics(dt, level) {
    this.x += this.vx * dt;
    this.handleCollision(level, 'x');
    this.y += this.vy * dt;
    this.handleCollision(level, 'y');

    // Gravity
    if (!this.onGround) {
      this.vy = Math.min(this.vy + 1700 * dt, 700);
    }
  }

  handleCollision(level, axis) {
    this.onGround = false;
    for (const p of level.platforms) {
      const rect = { x: this.x, y: this.y, w: this.width, h: this.height };
      if (!rectIntersect(rect, p)) continue;
      if (axis === 'y') {
        const overlapTop = (rect.y + rect.h) - p.y;
        const overlapBottom = (p.y + p.h) - rect.y;
        if (this.vy >= 0 && overlapTop < overlapBottom) {
          this.y = p.y - rect.h;
          this.vy = 0;
          this.onGround = true;
        } else if (this.vy < 0 && overlapBottom < overlapTop && !p.oneWay) {
          this.y = p.y + p.h;
          this.vy = 0;
        }
      } else if (axis === 'x' && !p.oneWay) {
        const overlapLeft = (rect.x + rect.w) - p.x;
        const overlapRight = (p.x + p.w) - rect.x;
        if (overlapLeft < overlapRight) {
          this.x = p.x - rect.w;
          this.vx = 0;
        } else {
          this.x = p.x + p.w;
          this.vx = 0;
        }
      }
    }
  }

  takeDamage(amount, type, game) {
    if (this.invincible > 0) return;
    this.health -= amount;
    this.flash = 0.15;
    this.invincible = 0.1;
    this.visualScaleX = 1.3;
    this.visualScaleY = 0.7;
    game.particles.spawn(6, this.x + this.width / 2, this.y + this.height / 2, {
      colors: ['#f00', '#fff', '#000'], minSpeed: 40, maxSpeed: 120, gravity: 300, life: 0.4
    });
    game.camera.addShake(3, 0.08);
    if (this.health <= 0) {
      this.die(game);
    }
  }

  die(game) {
    this.dead = true;
    game.particles.spawn(10, this.x + this.width / 2, this.y + this.height / 2, {
      colors: ['#f00', '#000', '#888'], minSpeed: 60, maxSpeed: 180, gravity: 350, life: 0.5
    });
    game.floatingText.add(this.x + this.width / 2, this.y, '+1');
    game.player.hysteria = Math.min(game.player.hysteria + 10, game.player.maxHysteria);
    game.player.teeth++;
  }

  draw(ctx, camera) {
    if (this.dead) return;
    if (this.flash > 0 && Math.floor(performance.now() / 40) % 2 === 0) {
      ctx.globalCompositeOperation = 'lighter';
    }
    this.drawSpecific(ctx, camera);
    ctx.globalCompositeOperation = 'source-over';
  }

  drawSpecific(ctx, camera) {}
}

export class CardSoldier extends Enemy {
  constructor(x, y) {
    super(x, y, 30, 46, 'soldier');
    this.speed = 70;
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.health = 2;
    this.damage = 1;
    this.attackTimer = 0;
  }

  ai(dt, level, player, game) {
    const dist = Math.hypot(player.x - this.x, player.y - this.y);

    if (dist < 220 && Math.abs(player.y - this.y) < 80) {
      // Chase
      this.direction = player.x > this.x ? 1 : -1;
      this.vx = this.direction * (this.speed * 1.5);
      this.facingRight = this.direction > 0;

      if (dist < 60 && this.attackTimer <= 0) {
        player.takeDamage(this.damage, this.x);
        this.attackTimer = 0.8;
      }
    } else {
      // Patrol
      this.vx = this.direction * this.speed;
      this.facingRight = this.direction > 0;
    }

    this.attackTimer = Math.max(this.attackTimer - dt, 0);

    // Turn at walls/edges
    if (this.onGround) {
      const edgeAhead = !level.platforms.some(p => {
        const probeX = this.x + this.width / 2 + this.direction * 20;
        return probeX > p.x && probeX < p.x + p.w && this.y + this.height <= p.y + 6 && this.y + this.height >= p.y - 20;
      });
      let blocked = false;
      for (const p of level.platforms) {
        const probeX = this.direction > 0 ? this.x + this.width + 2 : this.x - 2;
        if (probeX > p.x && probeX < p.x + p.w && this.y + this.height > p.y && this.y < p.y + p.h && !p.oneWay) {
          blocked = true;
          break;
        }
      }
      if (edgeAhead || blocked) this.direction *= -1;
    }
  }

  drawSpecific(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    ctx.save();
    ctx.translate(sx + this.width / 2, sy + this.height / 2);
    ctx.scale(this.facingRight ? this.visualScaleX : -this.visualScaleX, this.visualScaleY);

    // Card body
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Spade symbol
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, -this.height / 2 + 14, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -this.height / 2 + 8);
    ctx.lineTo(-4, -this.height / 2 + 2);
    ctx.lineTo(4, -this.height / 2 + 2);
    ctx.fill();

    // Red accents
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(-this.width / 2 + 2, -this.height / 2 + 24, this.width - 4, 4);

    // Eyes
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(3, -this.height / 2 + 30, 4, 3);

    ctx.restore();
  }
}

export class DollEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, 26, 38, 'doll');
    this.speed = 110;
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.health = 1;
    this.damage = 1;
    this.jumpTimer = Math.random() * 2;
  }

  ai(dt, level, player, game) {
    const dist = Math.hypot(player.x - this.x, player.y - this.y);

    if (dist < 300 && Math.abs(player.y - this.y) < 100) {
      this.direction = player.x > this.x ? 1 : -1;
      this.vx = this.direction * this.speed;
      this.facingRight = this.direction > 0;

      // Random erratic jumps
      this.jumpTimer -= dt;
      if (this.jumpTimer <= 0 && this.onGround) {
        this.vy = -350 - Math.random() * 150;
        this.jumpTimer = 1 + Math.random() * 2;
      }
    } else {
      this.vx = this.direction * (this.speed * 0.5);
      this.facingRight = this.direction > 0;
    }

    if (this.onGround) {
      const edgeAhead = !level.platforms.some(p => {
        const probeX = this.x + this.width / 2 + this.direction * 20;
        return probeX > p.x && probeX < p.x + p.w && this.y + this.height <= p.y + 6 && this.y + this.height >= p.y - 20;
      });
      if (edgeAhead) this.direction *= -1;
    }
  }

  drawSpecific(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    ctx.save();
    ctx.translate(sx + this.width / 2, sy + this.height / 2);
    ctx.scale(this.facingRight ? this.visualScaleX : -this.visualScaleX, this.visualScaleY);

    // Porcelain body
    ctx.fillStyle = '#f0e6e6';
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Cracks
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-5, -this.height / 2 + 8);
    ctx.lineTo(2, -this.height / 2 + 16);
    ctx.lineTo(-2, -this.height / 2 + 24);
    ctx.stroke();

    // Dead eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-5, -this.height / 2 + 12, 2, 0, Math.PI * 2);
    ctx.arc(5, -this.height / 2 + 12, 2, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(-4, -this.height / 2 + 22, 8, 3);

    ctx.restore();
  }
}

export class Madcap extends Enemy {
  constructor(x, y) {
    super(x, y, 32, 32, 'madcap');
    this.baseY = y;
    this.time = Math.random() * 10;
    this.health = 2;
    this.damage = 1;
    this.shootTimer = 2;
  }

  ai(dt, level, player, game) {
    this.time += dt;
    this.x += Math.sin(this.time * 0.8) * 30 * dt;
    this.y = this.baseY + Math.sin(this.time * 1.5) * 40;

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      const dx = player.x + player.width / 2 - (this.x + this.width / 2);
      const dy = player.y + player.height / 2 - (this.y + this.height / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < 400) {
        game.projectiles.push({
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
          vx: (dx / dist) * 180,
          vy: (dy / dist) * 180,
          radius: 5,
          damage: 1,
          enemy: true,
          life: 3
        });
      }
      this.shootTimer = 2 + Math.random();
    }
  }

  drawSpecific(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    ctx.fillStyle = '#4a0080';
    ctx.beginPath();
    ctx.arc(sx + this.width / 2, sy + this.height / 2, this.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.arc(sx + this.width / 2 - 5, sy + this.height / 2 - 2, 3, 0, Math.PI * 2);
    ctx.arc(sx + this.width / 2 + 5, sy + this.height / 2 - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Teeth
    ctx.fillStyle = '#fff';
    for (let i = -6; i <= 6; i += 4) {
      ctx.fillRect(sx + this.width / 2 + i - 1, sy + this.height / 2 + 6, 2, 5);
    }
  }
}

export class RabbitBoss extends Enemy {
  constructor(x, y) {
    super(x, y, 56, 80, 'rabbit');
    this.baseX = x;
    this.health = 15;
    this.maxHealth = 15;
    this.damage = 2;
    this.phase = 1;
    this.state = 'idle';
    this.stateTimer = 1.5;
    this.jumpCount = 0;
    this.telegraph = 0;
  }

  ai(dt, level, player, game) {
    this.stateTimer -= dt;
    if (this.telegraph > 0) {
      this.telegraph -= dt;
      if (this.telegraph <= 0) {
        this.executeAttack(level, player, game);
      }
      return;
    }

    if (this.stateTimer <= 0) {
      this.chooseAttack(player);
    }

    // Phase 2 at half health
    if (this.health <= this.maxHealth / 2 && this.phase === 1) {
      this.phase = 2;
      this.stateTimer = 0;
      game.camera.addShake(5, 0.3);
      game.particles.spawn(20, this.x + this.width / 2, this.y + this.height / 2, {
        colors: ['#f00', '#000'], minSpeed: 80, maxSpeed: 200, gravity: 200, life: 0.6
      });
    }
  }

  chooseAttack(player) {
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    if (dist < 120) {
      this.state = 'slash';
      this.telegraph = 0.5;
    } else if (this.phase === 2 && Math.random() < 0.4) {
      this.state = 'projectiles';
      this.telegraph = 0.6;
    } else {
      this.state = 'jump';
      this.telegraph = 0.4;
    }
    this.stateTimer = 999;
  }

  executeAttack(level, player, game) {
    if (this.state === 'slash') {
      const reach = 90;
      const cx = this.x + this.width / 2;
      const px = player.x + player.width / 2;
      if (Math.abs(cx - px) < reach && Math.abs(this.y - player.y) < 80) {
        player.takeDamage(this.damage, this.x);
      }
      game.particles.spawn(8, this.x + this.width / 2 + (this.facingRight ? 30 : -30), this.y + this.height / 2, {
        colors: ['#fff', '#f00'], minSpeed: 60, maxSpeed: 160, gravity: 200, life: 0.3
      });
      this.stateTimer = 1;
    } else if (this.state === 'jump') {
      const dir = player.x > this.x ? 1 : -1;
      this.vx = dir * 300;
      this.vy = -450;
      this.facingRight = dir > 0;
      this.onGround = false;
      this.state = 'jumping';
    } else if (this.state === 'projectiles') {
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        game.projectiles.push({
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
          vx: Math.cos(angle) * 200,
          vy: Math.sin(angle) * 200,
          radius: 7,
          damage: 1,
          enemy: true,
          life: 4
        });
      }
      this.stateTimer = 1.2;
    }
  }

  applyPhysics(dt, level) {
    super.applyPhysics(dt, level);
    if (this.state === 'jumping' && this.onGround) {
      this.state = 'idle';
      this.stateTimer = 0.8;
      this.game?.camera.addShake(5, 0.15);
    }
  }

  drawSpecific(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    ctx.save();
    ctx.translate(sx + this.width / 2, sy + this.height / 2);
    ctx.scale(this.facingRight ? this.visualScaleX : -this.visualScaleX, this.visualScaleY);

    // Rabbit body
    ctx.fillStyle = this.phase === 2 ? '#3a0000' : '#2a2a2a';
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Ears
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-12, -this.height / 2 - 24, 8, 28);
    ctx.fillRect(4, -this.height / 2 - 24, 8, 28);

    // Waistcoat
    ctx.fillStyle = '#5a1a1a';
    ctx.fillRect(-this.width / 2 + 4, -this.height / 2 + 20, this.width - 8, this.height - 30);

    // Pocket watch
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-6, -this.height / 2 + 30, 12, 12);

    // Eyes
    ctx.fillStyle = this.telegraph > 0 ? '#ff0000' : '#fff';
    ctx.fillRect(-10, -this.height / 2 + 16, 6, 6);
    ctx.fillRect(4, -this.height / 2 + 16, 6, 6);

    // Telegraph indicator
    if (this.telegraph > 0) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(-this.width / 2 - 4, -this.height / 2 - 4, this.width + 8, this.height + 8);
    }

    ctx.restore();

    // Health bar
    const barW = this.width;
    const barH = 6;
    ctx.fillStyle = '#000';
    ctx.fillRect(sx, sy - 12, barW, barH);
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(sx, sy - 12, barW * (this.health / this.maxHealth), barH);
  }
}

function rectIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
