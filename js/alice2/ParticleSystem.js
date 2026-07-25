export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawn(count, x, y, options = {}) {
    const {
      colors = ['#fff'],
      minSize = 1,
      maxSize = 4,
      minSpeed = 20,
      maxSpeed = 120,
      gravity = 300,
      drag = 0.97,
      life = 0.8,
      lifeVar = 0.3,
      angleMin = 0,
      angleMax = Math.PI * 2,
      shape = 'circle',
      glow = false,
      fadeColor = null
    } = options;

    for (let i = 0; i < count; i++) {
      const angle = angleMin + Math.random() * (angleMax - angleMin);
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: minSize + Math.random() * (maxSize - minSize),
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity,
        drag,
        life: Math.max(0.1, life + (Math.random() - 0.5) * lifeVar),
        maxLife: life,
        shape,
        glow,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 4
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
      p.rotation += p.rotSpeed * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw(ctx, camera) {
    ctx.save();
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.glow) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(p.rotation);
      if (p.shape === 'square') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.shape === 'paper') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else if (p.shape === 'ink') {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // Ambient persistent particles (ash, ink, spores)
  spawnAmbient(bounds, type, dt) {
    const density = type === 'ash' ? 0.3 : type === 'ink' ? 0.2 : 0.15;
    if (Math.random() > density) return;

    const x = bounds.x + Math.random() * bounds.w;
    const y = bounds.y + Math.random() * bounds.h;
    const opts = type === 'ash' ? {
      colors: ['#555', '#444', '#333'], minSize: 1, maxSize: 3,
      minSpeed: 5, maxSpeed: 25, gravity: -20, drag: 1, life: 4,
      angleMin: -0.5, angleMax: 0.5, shape: 'circle'
    } : type === 'ink' ? {
      colors: ['#220011', '#110022', '#001122'], minSize: 2, maxSize: 6,
      minSpeed: 10, maxSpeed: 40, gravity: 80, drag: 0.98, life: 2.5,
      angleMin: Math.PI - 0.3, angleMax: Math.PI * 2 + 0.3, shape: 'ink'
    } : {
      colors: ['#2a4a2a', '#4a2a4a'], minSize: 1, maxSize: 3,
      minSpeed: 5, maxSpeed: 20, gravity: -30, drag: 1, life: 5,
      angleMin: 0, angleMax: Math.PI * 2, shape: 'circle', glow: true
    };

    this.spawn(1, x, y, opts);
  }
}
