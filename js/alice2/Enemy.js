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
    this.maxHealth = 1;
    this.damage = 1;
    this.invincible = 0;
    this.flash = 0;
    this.facingRight = true;
    this.visualScaleX = 1;
    this.visualScaleY = 1;
    this.onGround = false;
    this.game = null;
  }

  update(dt, level, player, game) {
    if (this.dead) return;
    this.game = game;
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
    if (!this.onGround) this.vy = Math.min(this.vy + 1600 * dt, 700);
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
          this.x = p.x + rect.w;
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
    if (this.health <= 0) this.die(game);
  }

  die(game) {
    this.dead = true;
    game.particles.spawn(12, this.x + this.width / 2, this.y + this.height / 2, {
      colors: ['#f00', '#000', '#888'], minSpeed: 60, maxSpeed: 180, gravity: 350, life: 0.6
    });
    game.floatingText.add(this.x + this.width / 2, this.y, '+TOOTH', '#fff');
    game.player.hysteria = Math.min(game.player.hysteria + 10, game.player.maxHysteria);
    game.player.teeth++;
  }

  draw(ctx, camera) {
    if (this.dead) return;
    ctx.save();
    if (this.flash > 0 && Math.floor(performance.now() / 40) % 2 === 0) {
      ctx.globalCompositeOperation = 'lighter';
    }
    this.drawSpecific(ctx, camera);
    ctx.restore();
  }

  drawSpecific(ctx, camera) {}
}

export class CardSoldier extends Enemy {
  constructor(x, y) {
    super(x, y, 30, 52, 'soldier');
    this.speed = 65;
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.health = 3;
    this.maxHealth = 3;
    this.damage = 1;
    this.attackTimer = 0;
    this.spearTimer = 0;
  }

  ai(dt, level, player, game) {
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    const alert = dist < 260 && Math.abs(player.y - this.y) < 90;

    if (alert) {
      this.direction = player.x > this.x ? 1 : -1;
      this.vx = this.direction * this.speed * 1.6;
      this.facingRight = this.direction > 0;

      if (dist < 70 && this.attackTimer <= 0) {
        player.takeDamage(this.damage, this.x);
        this.attackTimer = 1.0;
        game.camera.addShake(3, 0.08);
      }
    } else {
      this.vx = this.direction * this.speed;
      this.facingRight = this.direction > 0;
    }

    this.attackTimer = Math.max(this.attackTimer - dt, 0);

    if (this.onGround) {
      const edgeAhead = !level.platforms.some(p => {
        const probeX = this.x + this.width / 2 + this.direction * 22;
        return probeX > p.x && probeX < p.x + p.w && this.y + this.height <= p.y + 6 && this.y + this.height >= p.y - 20;
      });
      let blocked = false;
      for (const p of level.platforms) {
        const probeX = this.direction > 0 ? this.x + this.width + 2 : this.x - 2;
        if (probeX > p.x && probeX < p.x + p.w && this.y + this.height > p.y && this.y < p.y + p.h && !p.oneWay) {
          blocked = true; break;
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

    // Body
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Red card pattern
    ctx.fillStyle = '#6b0a1a';
    ctx.fillRect(-this.width / 2 + 2, -this.height / 2 + 8, this.width - 4, this.height - 16);

    // Spade symbol
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, -this.height / 2 + 18, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -this.height / 2 + 10);
    ctx.lineTo(-5, -this.height / 2 + 3);
    ctx.lineTo(5, -this.height / 2 + 3);
    ctx.fill();

    // Helmet/visor
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-this.width / 2 - 2, -this.height / 2 - 6, this.width + 4, 10);

    // Glowing red eyes
    ctx.fillStyle = '#ff0000';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#ff0000';
    ctx.fillRect(-6, -this.height / 2 + 34, 4, 3);
    ctx.fillRect(2, -this.height / 2 + 34, 4, 3);
    ctx.shadowBlur = 0;

    // Spear
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.width / 2, -this.height / 2 + 24);
    ctx.lineTo(this.width / 2 + 45, -this.height / 2 + 24);
    ctx.stroke();
    ctx.fillStyle = '#aaa';
    ctx.beginPath();
    ctx.moveTo(this.width / 2 + 45, -this.height / 2 + 16);
    ctx.lineTo(this.width / 2 + 55, -this.height / 2 + 24);
    ctx.lineTo(this.width / 2 + 45, -this.height / 2 + 32);
    ctx.fill();

    ctx.restore();
  }
}

export class InsaneChild extends Enemy {
  constructor(x, y) {
    super(x, y, 24, 40, 'child');
    this.speed = 110;
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.health = 1;
    this.maxHealth = 1;
    this.damage = 1;
    this.jumpTimer = Math.random() * 2;
    this.crawl = false;
  }

  ai(dt, level, player, game) {
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    const alert = dist < 320 && Math.abs(player.y - this.y) < 100;

    if (alert) {
      this.direction = player.x > this.x ? 1 : -1;
      this.vx = this.direction * this.speed;
      this.facingRight = this.direction > 0;
      this.jumpTimer -= dt;
      if (this.jumpTimer <= 0 && this.onGround) {
        this.vy = -350 - Math.random() * 150;
        this.jumpTimer = 0.8 + Math.random() * 1.5;
      }
    } else {
      this.vx = this.direction * (this.speed * 0.5);
      this.facingRight = this.direction > 0;
    }

    if (this.onGround) {
      const edgeAhead = !level.platforms.some(p => {
        const probeX = this.x + this.width / 2 + this.direction * 18;
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
    ctx.fillStyle = '#e8e0e0';
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Cracks
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-4, -this.height / 2 + 6);
    ctx.lineTo(3, -this.height / 2 + 16);
    ctx.lineTo(-2, -this.height / 2 + 26);
    ctx.stroke();

    // Dead eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-5, -this.height / 2 + 12, 2.5, 0, Math.PI * 2);
    ctx.arc(5, -this.height / 2 + 12, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#900';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -this.height / 2 + 22, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Dress
    ctx.fillStyle = '#8b0a1a';
    ctx.fillRect(-this.width / 2, -this.height / 2 + 26, this.width, this.height - 26);

    ctx.restore();
  }
}

export class Madcap extends Enemy {
  constructor(x, y) {
    super(x, y, 34, 34, 'madcap');
    this.baseY = y;
    this.baseX = x;
    this.time = Math.random() * 10;
    this.health = 2;
    this.maxHealth = 2;
    this.damage = 1;
    this.shootTimer = 1.5;
  }

  ai(dt, level, player, game) {
    this.time += dt;
    this.x = this.baseX + Math.sin(this.time * 0.7) * 50;
    this.y = this.baseY + Math.sin(this.time * 1.4) * 35;

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      const dx = player.x + player.width / 2 - (this.x + this.width / 2);
      const dy = player.y + player.height / 2 - (this.y + this.height / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < 450) {
        game.projectiles.push({
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
          vx: (dx / dist) * 170,
          vy: (dy / dist) * 170,
          radius: 5,
          damage: 1,
          enemy: true,
          life: 3,
          color: '#ff00ff'
        });
      }
      this.shootTimer = 1.8 + Math.random();
    }
  }

  drawSpecific(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    ctx.save();
    ctx.translate(sx + this.width / 2, sy + this.height / 2);
    ctx.rotate(this.time * 0.5);

    ctx.fillStyle = '#2a003a';
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#7a00aa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2 + 3 + Math.sin(this.time * 4) * 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff00ff';
    ctx.beginPath();
    ctx.arc(-6, -3, 4, 0, Math.PI * 2);
    ctx.arc(6, -3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    for (let i = -8; i <= 8; i += 5) {
      ctx.fillRect(i - 1, 6, 2, 6);
    }

    ctx.restore();
  }
}

export class WhiteRabbitBoss extends Enemy {
  constructor(x, y) {
    super(x, y, 64, 92, 'rabbit');
    this.baseX = x;
    this.health = 22;
    this.maxHealth = 22;
    this.damage = 2;
    this.phase = 1;
    this.state = 'idle';
    this.stateTimer = 2;
    this.telegraph = 0;
    this.game = null;
  }

  ai(dt, level, player, game) {
    this.stateTimer -= dt;
    if (this.telegraph > 0) {
      this.telegraph -= dt;
      if (this.telegraph <= 0) this.executeAttack(level, player, game);
      return;
    }

    if (this.stateTimer <= 0) this.chooseAttack(player);

    if (this.health <= this.maxHealth / 2 && this.phase === 1) {
      this.phase = 2;
      this.stateTimer = 0;
      game.camera.addShake(6, 0.4);
      game.particles.spawn(25, this.x + this.width / 2, this.y + this.height / 2, {
        colors: ['#f00', '#000'], minSpeed: 80, maxSpeed: 220, gravity: 200, life: 0.7
      });
    }
  }

  chooseAttack(player) {
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    if (dist < 130) {
      this.state = 'slash';
      this.telegraph = 0.6;
    } else if (this.phase === 2 && Math.random() < 0.5) {
      this.state = 'projectiles';
      this.telegraph = 0.7;
    } else {
      this.state = 'jump';
      this.telegraph = 0.5;
    }
    this.stateTimer = 999;
  }

  executeAttack(level, player, game) {
    if (this.state === 'slash') {
      const cx = this.x + this.width / 2;
      const px = player.x + player.width / 2;
      if (Math.abs(cx - px) < 110 && Math.abs(this.y - player.y) < 90) {
        player.takeDamage(this.damage, this.x);
      }
      game.particles.spawn(10, cx + (this.facingRight ? 35 : -35), this.y + this.height / 2, {
        colors: ['#fff', '#f00'], minSpeed: 60, maxSpeed: 160, gravity: 200, life: 0.3
      });
      this.stateTimer = 1.2;
    } else if (this.state === 'jump') {
      const dir = player.x > this.x ? 1 : -1;
      this.vx = dir * 320;
      this.vy = -500;
      this.facingRight = dir > 0;
      this.onGround = false;
      this.state = 'jumping';
    } else if (this.state === 'projectiles') {
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + this.stateTimer;
        game.projectiles.push({
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
          vx: Math.cos(angle) * 210,
          vy: Math.sin(angle) * 210,
          radius: 7,
          damage: 1,
          enemy: true,
          life: 4,
          color: '#ff0000'
        });
      }
      this.stateTimer = 1.5;
    }
  }

  applyPhysics(dt, level) {
    super.applyPhysics(dt, level);
    if (this.state === 'jumping' && this.onGround) {
      this.state = 'idle';
      this.stateTimer = 1;
      this.game?.camera.addShake(6, 0.15);
    }
  }

  drawSpecific(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    ctx.save();
    ctx.translate(sx + this.width / 2, sy + this.height / 2);
    ctx.scale(this.facingRight ? this.visualScaleX : -this.visualScaleX, this.visualScaleY);

    // Body
    ctx.fillStyle = this.phase === 2 ? '#1a0000' : '#151515';
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Waistcoat
    ctx.fillStyle = this.phase === 2 ? '#3a0a0a' : '#2a1a1a';
    ctx.fillRect(-this.width / 2 + 4, -this.height / 2 + 24, this.width - 8, this.height - 34);

    // Ears
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(-14, -this.height / 2 - 30, 10, 36);
    ctx.fillRect(4, -this.height / 2 - 30, 10, 36);

    // Pocket watch
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(0, -this.height / 2 + 38, 10, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = this.telegraph > 0 ? '#ff0000' : '#fff';
    ctx.shadowBlur = this.telegraph > 0 ? 12 : 0;
    ctx.shadowColor = '#ff0000';
    ctx.fillRect(-12, -this.height / 2 + 16, 7, 7);
    ctx.fillRect(5, -this.height / 2 + 16, 7, 7);
    ctx.shadowBlur = 0;

    // Mouth
    ctx.fillStyle = '#600';
    ctx.fillRect(-10, -this.height / 2 + 54, 20, 6);

    if (this.telegraph > 0) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.strokeRect(-this.width / 2 - 6, -this.height / 2 - 6, this.width + 12, this.height + 12);
    }

    ctx.restore();

    // Health bar
    const barW = this.width;
    const barH = 7;
    ctx.fillStyle = '#000';
    ctx.fillRect(sx, sy - 14, barW, barH);
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(sx, sy - 14, barW * (this.health / this.maxHealth), barH);
  }
}

function rectIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
