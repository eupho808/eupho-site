/**
 * Level data and atmospheric backgrounds for Vale of Tears.
 */
export class Level {
  constructor(zone = 'vale') {
    this.zone = zone;
    this.platforms = [];
    this.hazards = [];
    this.collectibles = [];
    this.savePoints = [];
    this.decorations = [];
    this.width = 4200;
    this.height = 1400;
    this.exit = null;
    this.generateValeOfTears();
  }

  generateValeOfTears() {
    const groundY = 900;

    // Main ground path
    this.platforms.push({ x: 0, y: groundY, w: 800, h: 80 });
    this.platforms.push({ x: 900, y: groundY, w: 700, h: 80 });
    this.platforms.push({ x: 1700, y: groundY, w: 900, h: 80 });
    this.platforms.push({ x: 2800, y: groundY, w: 700, h: 80 });
    this.platforms.push({ x: 3700, y: groundY, w: 500, h: 80 });

    // Elevated platforms
    this.platforms.push({ x: 250, y: 760, w: 160, h: 24 });
    this.platforms.push({ x: 480, y: 640, w: 140, h: 24 });
    this.platforms.push({ x: 720, y: 520, w: 120, h: 24 });
    this.platforms.push({ x: 1050, y: 700, w: 140, h: 24 });
    this.platforms.push({ x: 1300, y: 580, w: 120, h: 24 });
    this.platforms.push({ x: 1550, y: 460, w: 160, h: 24 });
    this.platforms.push({ x: 1900, y: 700, w: 140, h: 24 });
    this.platforms.push({ x: 2200, y: 580, w: 120, h: 24 });
    this.platforms.push({ x: 2450, y: 460, w: 140, h: 24 });
    this.platforms.push({ x: 2750, y: 360, w: 180, h: 24 });
    this.platforms.push({ x: 3050, y: 520, w: 120, h: 24 });
    this.platforms.push({ x: 3300, y: 640, w: 140, h: 24 });
    this.platforms.push({ x: 3580, y: 760, w: 160, h: 24 });

    // One-way platforms
    this.platforms.push({ x: 860, y: 640, w: 100, h: 14, oneWay: true });
    this.platforms.push({ x: 1180, y: 480, w: 100, h: 14, oneWay: true });
    this.platforms.push({ x: 2020, y: 540, w: 100, h: 14, oneWay: true });

    // Hidden path platforms (upper area)
    this.platforms.push({ x: 380, y: 320, w: 100, h: 20 });
    this.platforms.push({ x: 600, y: 240, w: 120, h: 20 });
    this.platforms.push({ x: 850, y: 180, w: 100, h: 20 });

    // Hazards (ink spikes)
    this.hazards.push({ x: 820, y: groundY - 24, w: 40, h: 24 });
    this.hazards.push({ x: 1650, y: groundY - 24, w: 40, h: 24 });
    this.hazards.push({ x: 2750, y: groundY - 24, w: 40, h: 24 });
    this.hazards.push({ x: 3680, y: groundY - 24, w: 60, h: 24 });

    // Collectibles
    const memoryPositions = [
      [500, 700], [1200, 500], [2300, 520], [3400, 580], [900, 120]
    ];
    memoryPositions.forEach(([x, y]) => {
      this.collectibles.push({ x, y, type: 'memory', collected: false, time: Math.random() * 10 });
    });

    const teethPositions = [
      [330, 700], [560, 580], [750, 460], [1100, 640], [1580, 400],
      [2000, 640], [2480, 400], [2850, 300], [3120, 460], [3650, 700]
    ];
    teethPositions.forEach(([x, y]) => {
      this.collectibles.push({ x, y, type: 'tooth', collected: false, time: Math.random() * 10 });
    });

    // Save points (tea tables)
    this.savePoints.push({ x: 100, y: groundY - 50, w: 50, h: 50, active: true });
    this.savePoints.push({ x: 1800, y: groundY - 50, w: 50, h: 50, active: false });
    this.savePoints.push({ x: 3600, y: groundY - 50, w: 50, h: 50, active: false });

    // Exit
    this.exit = { x: 4000, y: groundY - 120, w: 60, h: 120 };

    // Decorations
    for (let i = 0; i < 40; i++) {
      this.decorations.push({
        x: Math.random() * this.width,
        y: groundY - 20 - Math.random() * 60,
        type: Math.random() > 0.6 ? 'flower_dead' : 'grass_ink',
        scale: 0.5 + Math.random() * 1,
        color: Math.random() > 0.5 ? '#2a1a2a' : '#1a151a'
      });
    }

    // Giant background flowers
    for (let i = 0; i < 8; i++) {
      this.decorations.push({
        x: 300 + i * 500 + Math.random() * 200,
        y: groundY - 40,
        type: 'giant_flower',
        scale: 2 + Math.random() * 2,
        color: Math.random() > 0.5 ? '#4a1a2a' : '#1a2a1a'
      });
    }
  }

  drawBackground(ctx, camera) {
    // Deep vignette gradient
    const grad = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    grad.addColorStop(0, '#0a0508');
    grad.addColorStop(0.5, '#1a0a10');
    grad.addColorStop(1, '#0a0508');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Distant ink mountains (parallax)
    ctx.fillStyle = '#12080c';
    for (let i = 0; i < 12; i++) {
      const mx = i * 500 - camera.x * 0.15;
      const my = 500 + Math.sin(i * 1.3) * 100;
      ctx.beginPath();
      ctx.moveTo(mx, ctx.canvas.height);
      ctx.lineTo(mx + 250, my);
      ctx.lineTo(mx + 500, ctx.canvas.height);
      ctx.fill();
    }

    // Midground broken arches/ruins
    ctx.fillStyle = '#1a0f14';
    for (let i = 0; i < 8; i++) {
      const ax = i * 700 - camera.x * 0.35;
      const ay = 620;
      ctx.fillRect(ax, ay, 80, 300);
      ctx.fillRect(ax + 80, ay, 60, 30);
      ctx.fillRect(ax - 40, ay + 100, 40, 20);
    }

    // Rain/ink particles
    ctx.strokeStyle = 'rgba(60, 40, 60, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 60; i++) {
      const rx = (i * 47 + camera.x * 0.5) % ctx.canvas.width;
      const ry = (i * 73 + performance.now() * 0.2) % ctx.canvas.height;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 3, ry + 15);
      ctx.stroke();
    }
  }

  drawMidground(ctx, camera) {
    // Parallax giant flowers
    for (const d of this.decorations) {
      if (d.type !== 'giant_flower') continue;
      const parallax = 0.6;
      const sx = d.x - camera.x * parallax;
      const sy = d.y - camera.y * parallax + 200;
      if (sx < -200 || sx > ctx.canvas.width + 200) continue;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(d.scale, d.scale);
      ctx.fillStyle = d.color;
      // Stem
      ctx.fillRect(-2, -100, 4, 100);
      // Petals
      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((i / 6) * Math.PI * 2);
        ctx.beginPath();
        ctx.ellipse(0, -25, 12, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  draw(ctx, camera) {
    this.drawBackground(ctx, camera);
    this.drawMidground(ctx, camera);

    // Platforms
    for (const p of this.platforms) {
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;
      if (sx + p.w < 0 || sx > ctx.canvas.width) continue;

      if (p.oneWay) {
        ctx.fillStyle = '#2a1a22';
        ctx.fillRect(sx, sy, p.w, p.h);
        ctx.fillStyle = '#4a2a3a';
        ctx.fillRect(sx, sy, p.w, 3);
      } else {
        ctx.fillStyle = '#1a0f12';
        ctx.fillRect(sx, sy, p.w, p.h);
        ctx.fillStyle = '#2a1a22';
        ctx.fillRect(sx, sy, p.w, 5);
        // Cracked texture
        ctx.strokeStyle = '#0a0508';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx + 10, sy + 10);
        ctx.lineTo(sx + 30, sy + 25);
        ctx.lineTo(sx + 20, sy + 40);
        ctx.stroke();
      }
    }

    // Hazards
    for (const h of this.hazards) {
      const sx = h.x - camera.x;
      const sy = h.y - camera.y;
      ctx.fillStyle = '#330000';
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const px = sx + i * (h.w / 3);
        ctx.moveTo(px, sy + h.h);
        ctx.lineTo(px + h.w / 6, sy);
        ctx.lineTo(px + h.w / 3, sy + h.h);
      }
      ctx.fill();
      ctx.fillStyle = '#cc0000';
      ctx.fillRect(sx, sy + h.h - 4, h.w, 4);
    }

    // Decorations foreground
    for (const d of this.decorations) {
      if (d.type === 'giant_flower') continue;
      const sx = d.x - camera.x;
      const sy = d.y - camera.y;
      if (sx < -50 || sx > ctx.canvas.width + 50) continue;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(d.scale, d.scale);
      ctx.fillStyle = d.color;
      if (d.type === 'flower_dead') {
        ctx.beginPath();
        ctx.ellipse(0, -10, 6, 12, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, -10, 6, 12, -0.3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(i * 3 - 4, -8 + i * 2, 2, 10);
        }
      }
      ctx.restore();
    }

    // Collectibles
    for (const c of this.collectibles) {
      if (c.collected) continue;
      c.time += 0.05;
      const bob = Math.sin(c.time) * 4;
      const sx = c.x - camera.x;
      const sy = c.y - camera.y + bob;

      if (c.type === 'memory') {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#aaf';
        ctx.fillStyle = '#aaaaff';
        ctx.beginPath();
        ctx.moveTo(sx, sy - 10);
        ctx.lineTo(sx + 8, sy);
        ctx.lineTo(sx, sy + 10);
        ctx.lineTo(sx - 8, sy);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = '#e8e8e8';
        ctx.beginPath();
        ctx.ellipse(sx, sy, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Save points
    for (const s of this.savePoints) {
      const sx = s.x - camera.x;
      const sy = s.y - camera.y;
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(sx + 15, sy + 30, 20, 20);
      ctx.fillStyle = s.active ? '#ffd700' : '#555';
      ctx.beginPath();
      ctx.moveTo(sx + 25, sy);
      ctx.lineTo(sx + 40, sy + 20);
      ctx.lineTo(sx + 25, sy + 40);
      ctx.lineTo(sx + 10, sy + 20);
      ctx.closePath();
      ctx.fill();
    }

    // Exit
    if (this.exit) {
      const ex = this.exit.x - camera.x;
      const ey = this.exit.y - camera.y;
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ffd700';
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.fillRect(ex, ey, this.exit.w, this.exit.h);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.strokeRect(ex, ey, this.exit.w, this.exit.h);
      ctx.fillStyle = '#ffd700';
      ctx.font = '12px monospace';
      ctx.fillText('EXIT', ex + 16, ey - 8);
      ctx.restore();
    }
  }
}
