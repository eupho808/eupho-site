/**
 * Alice player controller.
 * Implements tight, weighty platforming with dash, wall slide/jump, hover,
 * Vorpal Blade combos, Pepper Grinder, and Hysteria mode.
 */
export class Player {
  constructor(x, y, game) {
    this.x = x;
    this.y = y;
    this.width = 28;
    this.height = 52;
    this.vx = 0;
    this.vy = 0;
    this.game = game;

    // State
    this.onGround = false;
    this.wasOnGround = false;
    this.facingRight = true;
    this.crouching = false;
    this.dead = false;
    this.invincible = 0;

    // Timers
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
    this.hysteriaTimer = 0;

    // Visual
    this.visualScaleX = 1;
    this.visualScaleY = 1;
    this.runTime = 0;
    this.flash = 0;

    // Stats
    this.maxHealth = 5;
    this.health = 5;
    this.maxHysteria = 100;
    this.hysteria = 0;
    this.pepper = 6;
    this.maxPepper = 6;
    this.pepperRegen = 0;
    this.teeth = 0;

    // Upgrades
    this.hasWallJump = true;
    this.hasDoubleJump = true;
    this.hasDash = true;
    this.hasHover = true;
  }

  get constants() {
    return {
      maxSpeed: 240,
      accel: 1600,
      friction: 2200,
      airAccel: 1000,
      airFriction: 200,
      turnBoost: 1.7,
      jumpVel: -480,
      doubleJumpVel: -400,
      gravityUp: 1100,
      gravityDown: 1700,
      maxFall: 720,
      coyoteTime: 0.08,
      jumpBufferTime: 0.1,
      jumpCut: 0.4,
      dashSpeed: 520,
      dashDuration: 0.14,
      dashCooldown: 0.5,
      wallSlideSpeed: 100,
      wallJumpVelX: 320,
      wallJumpVelY: -420,
      wallJumpLock: 0.12,
      hoverDuration: 0.25,
      hoverGravity: 300,
      attackRange: 55,
      attackDamage: 1,
      heavyDamage: 2,
      hysteriaDuration: 8
    };
  }

  update(dt, input, level) {
    if (this.dead) return;
    const c = this.constants;

    // Timers
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
      if (this.hysteriaTimer <= 0) {
        this.hysteria = 0;
      }
    }

    // Pepper regen
    this.pepperRegen += dt;
    if (this.pepperRegen > 1.5 && this.pepper < this.maxPepper) {
      this.pepper++;
      this.pepperRegen = 0;
    }

    // Input
    const inputX = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
    this.crouching = input.isDown('down') && this.onGround;

    // Dash
    if (this.hasDash && input.isPressed('dash') && this.dashCooldown <= 0) {
      this.startDash(inputX, input.isDown('up'), input.isDown('down'));
    }

    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.vx = this.dashDirX * c.dashSpeed;
      this.vy = this.dashDirY * c.dashSpeed;
      this.spawnDashTrail();
      if (this.dashTimer <= 0) {
        this.vx *= 0.3;
        this.vy *= 0.3;
      }
      this.applyPhysics(dt, input, level, c);
      return;
    }

    // Horizontal movement
    if (this.wallJumpLock <= 0) {
      if (inputX !== 0) {
        let accel = this.onGround ? c.accel : c.airAccel;
        if (Math.sign(inputX) !== Math.sign(this.vx) && Math.abs(this.vx) > 20) {
          accel *= c.turnBoost;
        }
        const target = inputX * c.maxSpeed;
        this.vx = moveToward(this.vx, target, accel * dt);
      } else {
        const fric = this.onGround ? c.friction : c.airFriction;
        this.vx = moveToward(this.vx, 0, fric * dt);
      }
    }

    // Facing
    if (inputX > 0.1) this.facingRight = true;
    if (inputX < -0.1) this.facingRight = false;

    // Jump buffer
    if (input.isPressed('jump')) {
      this.jumpBuffer = c.jumpBufferTime;
    }

    // Wall slide detection
    const wallInfo = this.checkWall(level);
    const wallSliding = wallInfo.isSliding;

    // Jump
    if (this.jumpBuffer > 0) {
      if (wallSliding && this.hasWallJump) {
        this.vx = wallInfo.normalX * c.wallJumpVelX;
        this.vy = c.wallJumpVelY;
        this.wallJumpLock = c.wallJumpLock;
        this.facingRight = wallInfo.normalX > 0;
        this.jumpBuffer = 0;
        this.visualScaleX = 0.7;
        this.visualScaleY = 1.3;
        this.game.particles.spawn(8, this.x + this.width / 2, this.y + this.height / 2, {
          colors: ['#fff', '#ccc'], minSpeed: 60, maxSpeed: 140, gravity: 600, life: 0.4
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
          colors: ['#aaa', '#fff'], minSpeed: 40, maxSpeed: 100, gravity: 400, life: 0.4
        });
      } else if (this.hasDoubleJump && this.airJumpsLeft > 0 && !wallSliding) {
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

    // Hover
    if (this.hasHover && input.isDown('jump') && this.vy > 0 && !this.hoverUsed && !this.onGround) {
      this.hoverTimer = c.hoverDuration;
      this.hoverUsed = true;
    }

    // Jump cut
    if (input.isPressed('jump') === false && this.vy < 0 && !input.isDown('jump')) {
      // Handled by key up event
    }

    // Apply gravity / hover
    if (this.hoverTimer > 0 && input.isDown('jump')) {
      this.vy += c.hoverGravity * dt;
      this.hoverTimer -= dt;
      this.spawnHoverParticles();
    } else if (wallSliding) {
      this.vy = Math.min(this.vy + c.gravityDown * 0.15 * dt, c.wallSlideSpeed);
    } else {
      const grav = this.vy < 0 && !input.isDown('jump') ? c.gravityUp * 1.3 : c.gravityDown;
      this.vy = Math.min(this.vy + grav * dt, c.maxFall);
    }

    // Jump release cut
    if (input.prevKeys.jump && !input.isDown('jump') && this.vy < 0) {
      this.vy *= c.jumpCut;
    }

    // Attacks
    if (input.isPressed('attack') && this.attackCooldown <= 0) {
      this.performAttack(false);
    }
    if (input.isPressed('heavy') && this.heavyCooldown <= 0 && this.pepper > 0) {
      this.performAttack(true);
    }

    // Hysteria activation
    if (input.isPressed('hysteria') && this.hysteria >= this.maxHysteria) {
      this.activateHysteria();
    }

    this.applyPhysics(dt, input, level, c);

    // Visual recovery
    this.visualScaleX = lerp(this.visualScaleX, 1, 12 * dt);
    this.visualScaleY = lerp(this.visualScaleY, 1, 12 * dt);

    // Run animation
    const speedRatio = Math.abs(this.vx) / c.maxSpeed;
    if (this.onGround && speedRatio > 0.15) {
      this.runTime += dt * 14 * speedRatio;
    } else {
      this.runTime = 0;
    }
  }

  startDash(inputX, up, down) {
    const c = this.constants;
    this.dashTimer = c.dashDuration;
    this.dashCooldown = c.dashCooldown;
    this.dashDirX = inputX !== 0 ? Math.sign(inputX) : (this.facingRight ? 1 : -1);
    this.dashDirY = 0;
    if (up) this.dashDirY = -1;
    if (down && !this.onGround) this.dashDirY = 1;
    // Normalize diagonal
    const len = Math.sqrt(this.dashDirX * this.dashDirX + this.dashDirY * this.dashDirY);
    this.dashDirX /= len;
    this.dashDirY /= len;
    this.hoverTimer = 0;
    this.game.particles.spawn(10, this.x + this.width / 2, this.y + this.height / 2, {
      colors: ['#fff', '#aaf'], minSpeed: 80, maxSpeed: 200, gravity: 0, life: 0.25
    });
    this.game.camera.addShake(3, 0.08);
  }

  applyPhysics(dt, input, level, c) {
    // Apply velocity
    this.x += this.vx * dt;
    this.handleCollisions(level, 'x');
    this.y += this.vy * dt;
    this.handleCollisions(level, 'y');

    // Coyote / ground state
    this.wasOnGround = this.onGround;
    if (this.onGround) {
      this.coyoteTimer = c.coyoteTime;
      this.airJumpsLeft = 1;
      this.hoverUsed = false;
    }
  }

  handleCollisions(level, axis) {
    const playerRect = { x: this.x, y: this.y, w: this.width, h: this.crouching ? this.height * 0.6 : this.height };
    this.onGround = false;

    for (const p of level.platforms) {
      const plat = { x: p.x, y: p.y, w: p.w, h: p.h };
      if (!rectIntersect(playerRect, plat)) continue;

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
    if (!this.hasWallJump || this.onGround || this.vy < 0) return { isSliding: false };

    const probeW = 4;
    const probe = {
      x: this.facingRight ? this.x + this.width : this.x - probeW,
      y: this.y + 8,
      w: probeW,
      h: this.height - 16
    };

    for (const p of level.platforms) {
      if (p.oneWay) continue;
      if (rectIntersect(probe, p)) {
        const inputX = (this.game.input.isDown('right') ? 1 : 0) - (this.game.input.isDown('left') ? 1 : 0);
        const normalX = this.facingRight ? -1 : 1;
        // Only slide if pushing toward wall
        if (inputX !== 0 && Math.sign(inputX) !== Math.sign(normalX)) {
          return { isSliding: true, normalX };
        }
      }
    }
    return { isSliding: false };
  }

  performAttack(isHeavy) {
    const c = this.constants;
    if (isHeavy) {
      this.heavyCooldown = 0.6;
      this.pepper--;
      this.pepperRegen = 0;
      this.attackTimer = 0.25;
      this.attackCombo = 0;

      const dirX = this.facingRight ? 1 : -1;
      const px = this.x + this.width / 2 + dirX * 40;
      const py = this.y + this.height / 2;
      this.game.particles.spawn(5, px, py, {
        colors: ['#f90', '#f00'], minSpeed: 50, maxSpeed: 120, gravity: 100, life: 0.3
      });
      this.game.hitEnemies(px, py, 60, c.heavyDamage * (this.hysteriaTimer > 0 ? 2 : 1), 'heavy');
      this.game.camera.addShake(4, 0.1);
    } else {
      this.attackCombo = (this.attackCombo % 3) + 1;
      this.attackTimer = 0.18;
      this.attackCooldown = 0.22;

      const dirX = this.facingRight ? 1 : -1;
      const px = this.x + this.width / 2 + dirX * 35;
      const py = this.y + this.height / 2;
      this.game.particles.spawn(4, px, py, {
        colors: ['#fff', '#ccc'], minSpeed: 40, maxSpeed: 100, gravity: 200, life: 0.2
      });
      this.game.hitEnemies(px, py, c.attackRange, c.attackDamage * (this.hysteriaTimer > 0 ? 2 : 1), 'light');
      this.visualScaleX = 1.2;
      this.visualScaleY = 0.85;
    }
  }

  activateHysteria() {
    this.hysteriaTimer = this.constants.hysteriaDuration;
    this.hysteria = 0;
    this.game.particles.spawn(30, this.x + this.width / 2, this.y + this.height / 2, {
      colors: ['#f00', '#900', '#000'], minSpeed: 80, maxSpeed: 250, gravity: 0, life: 0.8
    });
    this.game.camera.addShake(6, 0.3);
  }

  spawnDashTrail() {
    this.game.particles.spawn(2, this.x + this.width / 2, this.y + this.height / 2, {
      colors: ['#fff', '#aaf'], minSize: 3, maxSize: 6, minSpeed: 0, maxSpeed: 10, gravity: 0, life: 0.15
    });
  }

  spawnHoverParticles() {
    if (Math.random() < 0.3) {
      this.game.particles.spawn(1, this.x + this.width / 2 + (Math.random() - 0.5) * 20, this.y + this.height, {
        colors: ['#aaf', '#fff'], minSize: 1, maxSize: 3, minSpeed: 10, maxSpeed: 30, gravity: -50, life: 0.4
      });
    }
  }

  takeDamage(amount, sourceX) {
    if (this.invincible > 0 || this.dead || this.dashTimer > 0 || this.hysteriaTimer > 0) return;
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
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.dead = true;
    this.game.particles.spawn(25, this.x + this.width / 2, this.y + this.height / 2, {
      colors: ['#f00', '#fff', '#000'], minSpeed: 80, maxSpeed: 280, gravity: 300, life: 0.8
    });
    this.game.camera.addShake(10, 0.4);
  }

  draw(ctx, camera) {
    if (this.dead) return;
    if (this.invincible > 0 && Math.floor(performance.now() / 60) % 2 === 0 && this.hysteriaTimer <= 0) return;

    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    const h = this.crouching ? this.height * 0.6 : this.height;
    const bob = this.onGround ? Math.sin(this.runTime) * 2 * (Math.abs(this.vx) / this.constants.maxSpeed) : 0;

    ctx.save();
    ctx.translate(sx + this.width / 2, sy + h / 2 + bob);
    ctx.scale(this.facingRight ? this.visualScaleX : -this.visualScaleX, this.visualScaleY);

    // Hysteria glow
    if (this.hysteriaTimer > 0) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ff0000';
    }

    // Dress/body
    ctx.fillStyle = this.hysteriaTimer > 0 ? '#4a0000' : '#1a0a1a';
    ctx.fillRect(-this.width / 2, -h / 2, this.width, h);

    // Apron
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(-this.width / 2 + 4, -h / 2 + 16, this.width - 8, h - 20);

    // Blood stains
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.arc(-2, -h / 2 + 28, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, h / 2 - 10, 4, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#f0d5d5';
    ctx.fillRect(-8, -h / 2 - 12, 16, 14);

    // Hair
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(-10, -h / 2 - 14, 20, 6);
    ctx.fillRect(-10, -h / 2 - 10, 4, 16);
    ctx.fillRect(6, -h / 2 - 10, 4, 16);

    // Eyes
    ctx.fillStyle = this.hysteriaTimer > 0 ? '#ff0000' : '#600';
    ctx.fillRect(2, -h / 2 - 8, 4, 3);

    // Vorpal blade if attacking
    if (this.attackTimer > 0) {
      ctx.save();
      ctx.rotate(this.facingRight ? 0.4 : -0.4);
      ctx.fillStyle = '#ddd';
      ctx.fillRect(8, -6, this.constants.attackRange - 10, 4);
      ctx.fillStyle = '#888';
      ctx.fillRect(8 + this.constants.attackRange - 14, -6, 4, 4);
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
