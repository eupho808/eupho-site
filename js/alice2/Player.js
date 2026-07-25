export class Player {
  constructor(x, y, game) {
    this.x = x;
    this.y = y;
    this.width = 28;
    this.height = 58;
    this.vx = 0;
    this.vy = 0;
    this.game = game;

    this.onGround = false;
    this.wasOnGround = false;
    this.facingRight = true;
    this.crouching = false;
    this.dead = false;
    this.invincible = 0;
    this.hysteriaTimer = 0;

    this.coyoteTimer = 0;
    this.jumpBuffer = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.wallJumpLock = 0;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.attackCombo = 0;
    this.heavyCooldown = 0;
    this.hoverTimer = 0;
    this.hoverUsed = false;

    this.visualScaleX = 1;
    this.visualScaleY = 1;
    this.runTime = 0;
    this.flash = 0;
    this.dressSway = 0;

    this.maxHealth = 5;
    this.health = 5;
    this.maxHysteria = 100;
    this.hysteria = 0;
    this.pepper = 6;
    this.maxPepper = 6;
    this.pepperRegen = 0;
    this.teeth = 0;

    this.spawnX = x;
    this.spawnY = y;
  }

  get c() {
    return {
      maxSpeed: 250,
      accel: 1500,
      friction: 2200,
      airAccel: 900,
      airFriction: 180,
      turnBoost: 1.6,
      jumpVel: -500,
      doubleJumpVel: -420,
      gravityUp: 1100,
      gravityDown: 1600,
      maxFall: 720,
      coyoteTime: 0.08,
      jumpBufferTime: 0.1,
      jumpCut: 0.45,
      dashSpeed: 520,
      dashDuration: 0.13,
      dashCooldown: 0.45,
      wallSlideSpeed: 90,
      wallJumpVelX: 300,
      wallJumpVelY: -450,
      wallJumpLockTime: 0.12,
      hoverDuration: 0.22,
      hoverGravity: 220,
      attackRange: 60,
      attackDamage: 1,
      heavyDamage: 2,
      hysteriaDuration: 8
    };
  }

  update(dt, input, level) {
    if (this.dead) return;
    const c = this.c;

    this.coyoteTimer = Math.max(this.coyoteTimer - dt, 0);
    this.jumpBuffer = Math.max(this.jumpBuffer - dt, 0);
    this.dashCooldown = Math.max(this.dashCooldown - dt, 0);
    this.wallJumpLock = Math.max(this.wallJumpLock - dt, 0);
    this.attackTimer = Math.max(this.attackTimer - dt, 0);
    this.attackCooldown = Math.max(this.attackCooldown - dt, 0);
    this.heavyCooldown = Math.max(this.heavyCooldown - dt, 0);
    this.hoverTimer = Math.max(this.hoverTimer - dt, 0);
    this.invincible = Math.max(this.invincible - dt, 0);
    this.flash = Math.max(this.flash - dt, 0);

    if (this.hysteriaTimer > 0) {
      this.hysteriaTimer -= dt;
      if (this.hysteriaTimer <= 0) this.hysteria = 0;
    }

    this.pepperRegen += dt;
    if (this.pepperRegen > 1.8 && this.pepper < this.maxPepper) {
      this.pepper++;
      this.pepperRegen = 0;
    }

    const inputX = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
    this.crouching = input.isDown('down') && this.onGround;
    if (this.crouching) {
      this.height = 36;
    } else if (this.height < 58 && !this.crouching) {
      // Try to stand up
      const oldH = this.height;
      this.height = 58;
      if (this.checkCeiling(level)) this.height = oldH;
    }

    // Dash
    if (input.isPressed('dash') && this.dashCooldown <= 0) {
      this.startDash(inputX, input.isDown('up'), input.isDown('down'));
    }

    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.vx = this.dashDirX * c.dashSpeed;
      this.vy = this.dashDirY * c.dashSpeed;
      this.spawnDashTrail();
      if (this.dashTimer <= 0) {
        this.vx *= 0.25;
        this.vy *= 0.25;
      }
      this.applyPhysics(dt, input, level, c);
      return;
    }

    // Horizontal
    if (this.wallJumpLock <= 0) {
      if (inputX !== 0) {
        let accel = this.onGround ? c.accel : c.airAccel;
        if (Math.sign(inputX) !== Math.sign(this.vx) && Math.abs(this.vx) > 20) accel *= c.turnBoost;
        this.vx = moveToward(this.vx, inputX * c.maxSpeed, accel * dt);
      } else {
        const fric = this.onGround ? c.friction : c.airFriction;
        this.vx = moveToward(this.vx, 0, fric * dt);
      }
    }

    if (inputX > 0.1) this.facingRight = true;
    if (inputX < -0.1) this.facingRight = false;

    if (input.isPressed('jump')) this.jumpBuffer = c.jumpBufferTime;

    const wallInfo = this.checkWall(level);
    const wallSliding = wallInfo.isSliding;

    if (this.jumpBuffer > 0) {
      if (wallSliding) {
        this.vx = wallInfo.normalX * c.wallJumpVelX;
        this.vy = c.wallJumpVelY;
        this.wallJumpLock = c.wallJumpLockTime;
        this.facingRight = wallInfo.normalX > 0;
        this.jumpBuffer = 0;
        this.visualScaleX = 0.7;
        this.visualScaleY = 1.3;
        this.game.particles.spawn(8, this.x + this.width / 2, this.y + this.height / 2, {
          colors: ['#fff', '#aaf'], minSpeed: 60, maxSpeed: 140, gravity: 600, life: 0.4
        });
        this.game.camera.addShake(2, 0.05);
      } else if (this.coyoteTimer > 0) {
        this.vy = c.jumpVel;
        this.coyoteTimer = 0;
        this.jumpBuffer = 0;
        this.onGround = false;
        this.hoverUsed = false;
        this.visualScaleX = 0.8;
        this.visualScaleY = 1.2;
        this.game.particles.spawn(6, this.x + this.width / 2, this.y + this.height, {
          colors: ['#fff', '#ccc'], minSpeed: 40, maxSpeed: 100, gravity: 400, life: 0.4
        });
      } else if (this.airJumpsLeft > 0 && !wallSliding) {
        this.vy = c.doubleJumpVel;
        this.airJumpsLeft--;
        this.jumpBuffer = 0;
        this.hoverUsed = false;
        this.visualScaleX = 0.8;
        this.visualScaleY = 1.2;
        this.game.particles.spawn(8, this.x + this.width / 2, this.y + this.height / 2, {
          colors: ['#fff', '#aaf'], minSpeed: 60, maxSpeed: 160, gravity: 300, life: 0.5
        });
      }
    }

    if (input.isDown('jump') && this.vy > 0 && !this.hoverUsed && !this.onGround) {
      this.hoverTimer = c.hoverDuration;
      this.hoverUsed = true;
    }

    if (this.hoverTimer > 0 && input.isDown('jump')) {
      this.vy += c.hoverGravity * dt;
      this.vy = Math.min(this.vy, 120);
      this.hoverTimer -= dt;
      this.spawnHoverParticles();
    } else if (wallSliding) {
      this.vy = Math.min(this.vy + c.gravityDown * 0.12 * dt, c.wallSlideSpeed);
    } else {
      const grav = this.vy < 0 && !input.isDown('jump') ? c.gravityUp * 1.2 : c.gravityDown;
      this.vy = Math.min(this.vy + grav * dt, c.maxFall);
    }

    if (input.prevKeys.jump && !input.isDown('jump') && this.vy < 0) {
      this.vy *= c.jumpCut;
    }

    if (input.isPressed('attack') && this.attackCooldown <= 0) this.performAttack(false);
    if (input.isPressed('heavy') && this.heavyCooldown <= 0 && this.pepper > 0) this.performAttack(true);
    if (input.isPressed('hysteria') && this.hysteria >= this.maxHysteria) this.activateHysteria();

    this.applyPhysics(dt, input, level, c);

    this.visualScaleX = lerp(this.visualScaleX, 1, 12 * dt);
    this.visualScaleY = lerp(this.visualScaleY, 1, 12 * dt);

    const speedRatio = Math.abs(this.vx) / c.maxSpeed;
    if (this.onGround && speedRatio > 0.15) this.runTime += dt * 14 * speedRatio;
    else this.runTime = 0;

    this.dressSway += dt * 3 + Math.abs(this.vx) * 0.01;
  }

  checkCeiling(level) {
    const rect = { x: this.x, y: this.y - 22, w: this.width, h: 22 };
    return level.platforms.some(p => !p.oneWay && rectIntersect(rect, p));
  }

  startDash(inputX, up, down) {
    const c = this.c;
    this.dashTimer = c.dashDuration;
    this.dashCooldown = c.dashCooldown;
    this.dashDirX = inputX !== 0 ? Math.sign(inputX) : (this.facingRight ? 1 : -1);
    this.dashDirY = 0;
    if (up) this.dashDirY = -1;
    if (down && !this.onGround) this.dashDirY = 1;
    const len = Math.sqrt(this.dashDirX ** 2 + this.dashDirY ** 2) || 1;
    this.dashDirX /= len;
    this.dashDirY /= len;
    this.hoverTimer = 0;
    this.game.particles.spawn(10, this.x + this.width / 2, this.y + this.height / 2, {
      colors: ['#fff', '#aaf'], minSpeed: 80, maxSpeed: 200, gravity: 0, life: 0.25
    });
    this.game.camera.addShake(3, 0.08);
  }

  applyPhysics(dt, input, level, c) {
    this.x += this.vx * dt;
    this.handleCollisions(level, 'x');
    this.y += this.vy * dt;
    this.handleCollisions(level, 'y');

    this.wasOnGround = this.onGround;
    if (this.onGround) {
      this.coyoteTimer = c.coyoteTime;
      this.airJumpsLeft = 1;
      this.hoverUsed = false;
      if (!this.wasOnGround && this.vy >= 0) {
        this.visualScaleX = 1.3;
        this.visualScaleY = 0.7;
        this.game.particles.spawn(6, this.x + this.width / 2, this.y + this.height, {
          colors: ['#aaa', '#fff'], minSpeed: 30, maxSpeed: 80, gravity: 400, life: 0.4
        });
      }
    }

    if (this.y > this.game.level.height + 300) this.takeDamage(1, this.x);
  }

  handleCollisions(level, axis) {
    const h = this.crouching ? 36 : this.height;
    const playerRect = { x: this.x, y: this.y, w: this.width, h };
    this.onGround = false;

    for (const p of level.platforms) {
      if (!rectIntersect(playerRect, p)) continue;

      if (axis === 'y') {
        const overlapTop = (playerRect.y + playerRect.h) - p.y;
        const overlapBottom = (p.y + p.h) - playerRect.y;

        if (this.vy >= 0 && overlapTop < overlapBottom && (!p.oneWay || playerRect.y + playerRect.h - this.vy * 0.016 <= p.y + 4)) {
          this.y = p.y - playerRect.h;
          this.vy = 0;
          this.onGround = true;
        } else if (this.vy < 0 && overlapBottom < overlapTop && !p.oneWay) {
          this.y = p.y + p.h;
          this.vy = 0;
        }
      } else if (axis === 'x' && !p.oneWay) {
        const overlapLeft = (playerRect.x + playerRect.w) - p.x;
        const overlapRight = (p.x + p.w) - playerRect.x;
        if (overlapLeft < overlapRight) {
          this.x = p.x - playerRect.w;
          this.vx = 0;
        } else {
          this.x = p.x + p.w;
          this.vx = 0;
        }
      }
    }
  }

  checkWall(level) {
    if (this.onGround || this.vy < 0) return { isSliding: false };

    const probeW = 4;
    const probe = {
      x: this.facingRight ? this.x + this.width : this.x - probeW,
      y: this.y + 8,
      w: probeW,
      h: (this.crouching ? 36 : this.height) - 16
    };

    for (const p of level.platforms) {
      if (p.oneWay) continue;
      if (rectIntersect(probe, p)) {
        const inputX = (this.game.input.isDown('right') ? 1 : 0) - (this.game.input.isDown('left') ? 1 : 0);
        const normalX = this.facingRight ? -1 : 1;
        if (inputX !== 0 && Math.sign(inputX) !== Math.sign(normalX)) {
          return { isSliding: true, normalX };
        }
      }
    }
    return { isSliding: false };
  }

  performAttack(isHeavy) {
    const c = this.c;
    if (isHeavy) {
      this.heavyCooldown = 0.7;
      this.pepper--;
      this.pepperRegen = 0;
      this.attackTimer = 0.28;
      this.attackCombo = 0;

      const dirX = this.facingRight ? 1 : -1;
      const px = this.x + this.width / 2 + dirX * 40;
      const py = this.y + this.height / 2;
      this.game.projectiles.push({
        x: px, y: py,
        vx: dirX * 380,
        vy: (this.game.input.isDown('up') ? -1 : 0) * 100,
        radius: 7,
        damage: c.heavyDamage * (this.hysteriaTimer > 0 ? 2.5 : 1),
        enemy: false,
        life: 1.2,
        color: '#ff4400'
      });
      this.game.particles.spawn(5, px, py, {
        colors: ['#f90', '#f00', '#fff'], minSpeed: 50, maxSpeed: 120, gravity: 100, life: 0.3
      });
      this.game.camera.addShake(4, 0.1);
    } else {
      this.attackCombo = (this.attackCombo % 3) + 1;
      this.attackTimer = 0.16 + this.attackCombo * 0.02;
      this.attackCooldown = 0.22;

      const dirX = this.facingRight ? 1 : -1;
      const px = this.x + this.width / 2 + dirX * 35;
      const py = this.y + this.height / 2;
      this.game.particles.spawn(4, px, py, {
        colors: ['#fff', '#ccc', '#aaf'], minSpeed: 40, maxSpeed: 100, gravity: 200, life: 0.2
      });
      this.game.hitEnemies(px, py, c.attackRange, c.attackDamage * (this.hysteriaTimer > 0 ? 2.5 : 1), 'light');
      this.visualScaleX = 1.2;
      this.visualScaleY = 0.85;
    }
  }

  activateHysteria() {
    this.hysteriaTimer = this.c.hysteriaDuration;
    this.hysteria = 0;
    this.health = this.maxHealth;
    this.game.particles.spawn(35, this.x + this.width / 2, this.y + this.height / 2, {
      colors: ['#f00', '#900', '#000', '#fff'], minSpeed: 80, maxSpeed: 280, gravity: 0, life: 1
    });
    this.game.camera.addShake(8, 0.4);
  }

  spawnDashTrail() {
    this.game.particles.spawn(2, this.x + this.width / 2, this.y + this.height / 2, {
      colors: ['#fff', '#aaf'], minSize: 3, maxSize: 6, minSpeed: 0, maxSpeed: 10, gravity: 0, life: 0.15
    });
  }

  spawnHoverParticles() {
    if (Math.random() < 0.25) {
      this.game.particles.spawn(1, this.x + this.width / 2 + (Math.random() - 0.5) * 20, this.y + this.height, {
        colors: ['#aaf', '#fff', '#ccf'], minSize: 1, maxSize: 3, minSpeed: 10, maxSpeed: 30,
        gravity: -50, life: 0.5, glow: true
      });
    }
  }

  takeDamage(amount, sourceX) {
    if (this.invincible > 0 || this.dead || this.dashTimer > 0) return;
    this.health -= amount;
    this.invincible = 1.2;
    this.flash = 0.2;
    const dir = sourceX < this.x + this.width / 2 ? 1 : -1;
    this.vx = dir * 220;
    this.vy = -280;
    this.visualScaleX = 1.3;
    this.visualScaleY = 0.7;
    this.game.particles.spawn(12, this.x + this.width / 2, this.y + this.height / 2, {
      colors: ['#f00', '#900', '#500'], minSpeed: 60, maxSpeed: 200, gravity: 400, life: 0.5
    });
    this.game.camera.addShake(7, 0.15);
    if (this.hysteriaTimer > 0) this.hysteriaTimer = 0;
    if (this.health <= 0) this.die();
  }

  die() {
    this.dead = true;
    this.game.particles.spawn(30, this.x + this.width / 2, this.y + this.height / 2, {
      colors: ['#f00', '#fff', '#000', '#aaf'], minSpeed: 80, maxSpeed: 300, gravity: 300, life: 1
    });
    this.game.camera.addShake(10, 0.4);
  }

  draw(ctx, camera) {
    if (this.dead) return;
    if (this.invincible > 0 && Math.floor(performance.now() / 60) % 2 === 0 && this.hysteriaTimer <= 0) return;

    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    const h = this.crouching ? 36 : this.height;
    const speedRatio = Math.abs(this.vx) / this.c.maxSpeed;
    const bob = this.onGround ? Math.sin(this.runTime) * 2.5 * Math.min(speedRatio, 1) : 0;
    const sway = Math.sin(this.dressSway) * 0.08;

    ctx.save();
    ctx.translate(sx + this.width / 2, sy + h / 2 + bob);
    ctx.scale(this.facingRight ? this.visualScaleX : -this.visualScaleX, this.visualScaleY);

    if (this.hysteriaTimer > 0) {
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#ff0000';
    }

    // Dress - long black with red accents
    ctx.fillStyle = this.hysteriaTimer > 0 ? '#2a0000' : '#0f0a0f';
    ctx.beginPath();
    ctx.moveTo(-this.width / 2 - 6, -h / 2 + 10);
    ctx.lineTo(this.width / 2 + 6, -h / 2 + 10);
    ctx.lineTo(this.width / 2 + 12 + sway * 20, h / 2);
    ctx.lineTo(-this.width / 2 - 12 + sway * 20, h / 2);
    ctx.closePath();
    ctx.fill();

    // Dress red trim
    ctx.strokeStyle = this.hysteriaTimer > 0 ? '#ff0000' : '#6b0a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-this.width / 2 - 6, -h / 2 + 10);
    ctx.lineTo(this.width / 2 + 6, -h / 2 + 10);
    ctx.stroke();

    // Apron
    ctx.fillStyle = this.hysteriaTimer > 0 ? '#3a0a0a' : '#d8d0c8';
    ctx.fillRect(-this.width / 2 + 3, -h / 2 + 12, this.width - 6, h - 18);

    // Blood stains on apron
    ctx.fillStyle = '#6b0a1a';
    ctx.beginPath();
    ctx.arc(-2, -h / 2 + 26, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(5, h / 2 - 8, 5, 0, Math.PI * 2);
    ctx.fill();

    // Arms
    ctx.strokeStyle = '#f0d5d5';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-this.width / 2 + 2, -h / 2 + 14);
    ctx.lineTo(-this.width / 2 - 10, -h / 2 + 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(this.width / 2 - 2, -h / 2 + 14);
    ctx.lineTo(this.width / 2 + 10, -h / 2 + 30);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#f0d5d5';
    ctx.fillRect(-8, -h / 2 - 14, 16, 14);

    // Hair - long black flowing
    ctx.fillStyle = '#080808';
    ctx.beginPath();
    ctx.moveTo(-10, -h / 2 - 16);
    ctx.lineTo(10, -h / 2 - 16);
    ctx.lineTo(12 + sway * 15, -h / 2 + 8);
    ctx.lineTo(-12 + sway * 15, -h / 2 + 8);
    ctx.closePath();
    ctx.fill();

    // Hair strands
    ctx.strokeStyle = '#080808';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, -h / 2 - 10);
    ctx.lineTo(-14 + sway * 20, -h / 2 + 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, -h / 2 - 10);
    ctx.lineTo(14 + sway * 20, -h / 2 + 18);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = this.hysteriaTimer > 0 ? '#ff0000' : '#600';
    ctx.shadowBlur = this.hysteriaTimer > 0 ? 8 : 0;
    ctx.shadowColor = '#ff0000';
    ctx.fillRect(2, -h / 2 - 10, 4, 3);

    // Vorpal blade
    if (this.attackTimer > 0) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fff';
      ctx.fillStyle = '#e0e0e0';
      ctx.save();
      ctx.rotate(this.facingRight ? 0.5 : -0.5);
      ctx.beginPath();
      ctx.moveTo(10, -4);
      ctx.lineTo(10 + this.c.attackRange - 10, -2);
      ctx.lineTo(10 + this.c.attackRange - 10, 2);
      ctx.lineTo(10, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
}

function rectIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function moveToward(current, target, maxDelta) {
  if (Math.abs(target - current) <= maxDelta) return target;
  return current + Math.sign(target - current) * maxDelta;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
