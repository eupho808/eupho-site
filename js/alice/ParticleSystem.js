/**
 * Particle system for blood, ink, petals, sparks, etc.
 */
export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawn(count, x, y, options = {}) {
    const {
      color = '#fff',
      colors = null,
      minSize = 2,
      maxSize = 5,
      minSpeed = 20,
      maxSpeed = 120,
      gravity = 400,
      drag = 0.98,
      life = 0.6,
      lifeVar = 0.3,
      angleMin = 0,
      angleMax = Math.PI * 2,
      shape = 'circle'
    } = options;

    for (let i = 0; i < count; i++) {
      const angle = angleMin + Math.random() * (angleMax - angleMin);
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: minSize + Math.random() * (maxSize - minSize),
        color: colors ? colors[Math.floor(Math.random() * colors.length)] : color,
        gravity,
        drag,
        life: life + (Math.random() - 0.5) * lifeVar,
        maxLife: life + (Math.random() - 0.5) * lifeVar,
        shape
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw(ctx, camera) {
    ctx.save();
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;
      if (p.shape === 'square') {
        ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
