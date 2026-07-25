export class Level {
  constructor(zone = 'vale') {
    this.zone = zone;
    this.platforms = [];
    this.hazards = [];
    this.collectibles = [];
    this.savePoints = [];
    this.decorations = [];
    this.width = 4600;
    this.height = 1400;
    this.exit = null;
    this.generateValeOfTears();
  }

  generateValeOfTears() {
    const groundY = 920;

    // Main ground
    this.platforms.push({ x: 0, y: groundY, w: 750, h: 90 });
    this.platforms.push({ x: 850, y: groundY, w: 650, h: 90 });
    this.platforms.push({ x: 1600, y: groundY, w: 850, h: 90 });
    this.platforms.push({ x: 2550, y: groundY, w: 700, h: 90 });
    this.platforms.push({ x: 3400, y: groundY, w: 1200, h: 90 });

    // Platforms
    this.platforms.push({ x: 260, y: 760, w: 150, h: 26 });
    this.platforms.push({ x: 490, y: 640, w: 130, h: 24 });
    this.platforms.push({ x: 720, y: 520, w: 110, h: 22 });
    this.platforms.push({ x: 980, y: 700, w: 130, h: 24 });
    this.platforms.push({ x: 1240, y: 580, w: 120, h: 22 });
    this.platforms.push({ x: 1520, y: 460, w: 160, h: 24 });
    this.platforms.push({ x: 1850, y: 700, w: 120, h: 22 });
    this.platforms.push({ x: 2150, y: 560, w: 110, h: 22 });
    this.platforms.push({ x: 2420, y: 440, w: 130, h: 22 });
    this.platforms.push({ x: 2750, y: 340, w: 170, h: 24 });
    this.platforms.push({ x: 3050, y: 520, w: 110, h: 22 });
    this.platforms.push({ x: 3320, y: 640, w: 130, h: 22 });
    this.platforms.push({ x: 3620, y: 760, w: 150, h: 24 });

    // One-way platforms
    this.platforms.push({ x: 690, y: 640, w: 90, h: 12, oneWay: true });
    this.platforms.push({ x: 1160, y: 480, w: 90, h: 12, oneWay: true });
    this.platforms.push({ x: 2080, y: 540, w: 90, h: 12, oneWay: true });

    // Hidden upper path
    this.platforms.push({ x: 420, y: 300, w: 90, h: 18 });
    this.platforms.push({ x: 620, y: 220, w: 110, h: 18 });
    this.platforms.push({ x: 860, y: 160, w: 90, h: 18 });

    // Hazards
    this.hazards.push({ x: 790, y: groundY - 28, w: 50, h: 28 });
    this.hazards.push({ x: 1780, y: groundY - 28, w: 50, h: 28 });
    this.hazards.push({ x: 2880, y: groundY - 28, w: 50, h: 28 });
    this.hazards.push({ x: 3880, y: groundY - 28, w: 80, h: 28 });

    // Memories
    const memories = [
      [320, 680], [1280, 520], [2480, 380], [3500, 560], [700, 100]
    ];
    memories.forEach(([x, y], i) => {
      this.collectibles.push({
        x, y, type: 'memory', collected: false, time: i * 1.2,
        text: this.getMemoryText(i)
      });
    });

    // Teeth
    const teeth = [
      [350, 700], [560, 580], [780, 460], [1050, 640], [1600, 400],
      [1920, 640], [2520, 380], [2820, 280], [3120, 460], [3720, 700],
      [420, 240], [900, 110]
    ];
    teeth.forEach(([x, y]) => {
      this.collectibles.push({ x, y, type: 'tooth', collected: false, time: Math.random() * 10 });
    });

    // Save points (tea tables with mirror)
    this.savePoints.push({ x: 120, y: groundY - 55, w: 55, h: 55, active: true });
    this.savePoints.push({ x: 1950, y: groundY - 55, w: 55, h: 55, active: false });
    this.savePoints.push({ x: 3750, y: groundY - 55, w: 55, h: 55, active: false });

    this.exit = { x: 4300, y: groundY - 130, w: 55, h: 130 };

    // Decorations
    this.generateDecorations(groundY);
  }

  getMemoryText(index) {
    const texts = [
      "Memory: The fire didn't take them. I did.",
      "Memory: Every mirror shows a different fracture.",
      "Memory: The doctor said I was cured. They were lying.",
      "Memory: Wonderland bleeds when I remember.",
      "Memory: I am both the poison and the cure."
    ];
    return texts[index] || "Memory: ...";
  }

  generateDecorations(groundY) {
    for (let i = 0; i < 50; i++) {
      this.decorations.push({
        x: Math.random() * this.width,
        y: groundY - 20 - Math.random() * 70,
        type: Math.random() > 0.5 ? 'flower_dead' : 'grass_ink',
        scale: 0.6 + Math.random() * 1.2,
        color: Math.random() > 0.5 ? '#2a1520' : '#151a15',
        rotation: Math.random() * 0.4 - 0.2
      });
    }

    for (let i = 0; i < 10; i++) {
      this.decorations.push({
        x: 200 + i * 450 + Math.random() * 150,
        y: groundY - 30,
        type: 'giant_flower',
        scale: 2.5 + Math.random() * 2,
        color: Math.random() > 0.5 ? '#3a0a1a' : '#0a1a10',
        rotation: 0
      });
    }

    for (let i = 0; i < 6; i++) {
      this.decorations.push({
        x: 300 + i * 700,
        y: groundY - 25,
        type: 'broken_toy',
        scale: 1 + Math.random(),
        color: '#1a1a1a',
        rotation: Math.random() * Math.PI
      });
    }

    for (let i = 0; i < 8; i++) {
      this.decorations.push({
        x: 400 + i * 520,
        y: groundY + 50 + Math.random() * 40,
        type: 'ink_pool',
        scale: 1 + Math.random() * 2,
        color: 'rgba(20, 5, 15, 0.6)',
        rotation: 0
      });
    }
  }

  drawBackground(ctx, camera) {
    // Base dark gradient
    const grad = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    grad.addColorStop(0, '#070307');
    grad.addColorStop(0.4, '#12080c');
    grad.addColorStop(1, '#070307');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Distant ink mountains
    ctx.fillStyle = '#0c0508';
    for (let i = 0; i < 14; i++) {
      const mx = i * 450 - camera.x * 0.12;
      const my = 480 + Math.sin(i * 1.2) * 120;
      ctx.beginPath();
      ctx.moveTo(mx, ctx.canvas.height);
      ctx.lineTo(mx + 225, my);
      ctx.lineTo(mx + 450, ctx.canvas.height);
      ctx.fill();
    }

    // Broken Victorian arches
    ctx.fillStyle = '#140a0e';
    for (let i = 0; i < 10; i++) {
      const ax = i * 600 - camera.x * 0.3;
      const ay = 600;
      ctx.fillRect(ax, ay, 100, 350);
      ctx.fillRect(ax + 20, ay - 60, 60, 60);
      ctx.fillRect(ax - 50, ay + 100, 50, 25);
    }

    // Rain/ink streaks
    ctx.strokeStyle = 'rgba(60, 30, 50, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 80; i++) {
      const t = performance.now() * 0.0005;
      const rx = (i * 53 + camera.x * 0.4 + t * 30) % (ctx.canvas.width + 50) - 25;
      const ry = (i * 79 + t * 200) % (ctx.canvas.height + 50) - 25;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 4, ry + 22);
      ctx.stroke();
    }
  }

  drawMidground(ctx, camera) {
    for (const d of this.decorations) {
      if (d.type !== 'giant_flower') continue;
      const parallax = 0.55;
      const sx = d.x - camera.x * parallax;
      const sy = d.y - camera.y * parallax + 180;
      if (sx < -300 || sx > ctx.canvas.width + 300) continue;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(d.scale, d.scale);

      // Stem
      ctx.strokeStyle = '#0a0a0a';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(Math.sin(d.x * 0.01) * 20, -60, 0, -120);
      ctx.stroke();

      // Petals
      ctx.fillStyle = d.color;
      for (let i = 0; i < 7; i++) {
        ctx.save();
        ctx.rotate((i / 7) * Math.PI * 2 + Math.sin(performance.now() * 0.001 + d.x) * 0.1);
        ctx.beginPath();
        ctx.ellipse(0, -28, 14, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Center
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(0, -120, 10, 0, Math.PI * 2);
      ctx.fill();

      // Dripping
      if (Math.random() < 0.02) {
        ctx.fillStyle = '#3a0a0a';
        ctx.beginPath();
        ctx.arc(0, -110, 3, 0, Math.PI * 2);
        ctx.fill();
      }

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
        ctx.fillStyle = '#1f1018';
        ctx.fillRect(sx, sy, p.w, p.h);
        ctx.fillStyle = '#3a1a2a';
        ctx.fillRect(sx, sy, p.w, 3);
      } else {
        // Stone/organic platform
        ctx.fillStyle = '#0f080c';
        ctx.fillRect(sx, sy, p.w, p.h);
        ctx.fillStyle = '#1a0f14';
        ctx.fillRect(sx, sy, p.w, 6);

        // Blood/ink veins
        ctx.strokeStyle = '#2a0a10';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx + 10, sy + 10);
        ctx.lineTo(sx + 35, sy + 28);
        ctx.lineTo(sx + 25, sy + 50);
        ctx.stroke();

        ctx.strokeStyle = '#0a1a0a';
        ctx.beginPath();
        ctx.moveTo(sx + p.w - 20, sy + 15);
        ctx.lineTo(sx + p.w - 40, sy + 35);
        ctx.stroke();
      }
    }

    // Hazards
    for (const h of this.hazards) {
      const sx = h.x - camera.x;
      const sy = h.y - camera.y;
      ctx.fillStyle = '#2a0000';
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const px = sx + i * (h.w / 3);
        ctx.moveTo(px, sy + h.h);
        ctx.lineTo(px + h.w / 6, sy);
        ctx.lineTo(px + h.w / 3, sy + h.h);
      }
      ctx.fill();
      ctx.fillStyle = '#800000';
      ctx.fillRect(sx, sy + h.h - 3, h.w, 3);
    }

    // Decorations foreground
    for (const d of this.decorations) {
      if (d.type === 'giant_flower') continue;
      const sx = d.x - camera.x;
      const sy = d.y - camera.y;
      if (sx < -100 || sx > ctx.canvas.width + 100) continue;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(d.rotation);
      ctx.scale(d.scale, d.scale);
      ctx.fillStyle = d.color;

      if (d.type === 'flower_dead') {
        ctx.beginPath();
        ctx.ellipse(-6, -10, 5, 12, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -10, 5, 12, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a0505';
        ctx.beginPath();
        ctx.arc(0, -10, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.type === 'broken_toy') {
        ctx.fillStyle = '#111';
        ctx.fillRect(-10, -10, 20, 20);
        ctx.fillStyle = '#300';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.type === 'ink_pool') {
        ctx.beginPath();
        ctx.ellipse(0, 0, 25, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(i * 3 - 5, -10 + i * 2, 2, 12);
        }
      }
      ctx.restore();
    }

    // Collectibles
    for (const c of this.collectibles) {
      if (c.collected) continue;
      c.time += 0.05;
      const bob = Math.sin(c.time * 3) * 5;
      const sx = c.x - camera.x;
      const sy = c.y - camera.y + bob;

      if (c.type === 'memory') {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#88ccff';
        ctx.fillStyle = '#aaddff';
        ctx.beginPath();
        ctx.moveTo(sx, sy - 12);
        ctx.lineTo(sx + 9, sy);
        ctx.lineTo(sx, sy + 12);
        ctx.lineTo(sx - 9, sy);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = '#f0e8e0';
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

      // Table
      ctx.fillStyle = '#1a1510';
      ctx.fillRect(sx + 5, sy + 35, 45, 8);
      ctx.fillRect(sx + 12, sy + 43, 6, 12);
      ctx.fillRect(sx + 37, sy + 43, 6, 12);

      // Mirror
      ctx.fillStyle = s.active ? '#ffd700' : '#444';
      ctx.shadowBlur = s.active ? 15 : 0;
      ctx.shadowColor = '#ffd700';
      ctx.beginPath();
      ctx.ellipse(sx + s.w / 2, sy + 20, 14, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(sx + s.w / 2, sy + 20, 9, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Exit
    if (this.exit) {
      const ex = this.exit.x - camera.x;
      const ey = this.exit.y - camera.y;
      ctx.save();
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#ffd700';
      ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
      ctx.fillRect(ex, ey, this.exit.w, this.exit.h);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.strokeRect(ex, ey, this.exit.w, this.exit.h);
      ctx.fillStyle = '#ffd700';
      ctx.font = '11px monospace';
      ctx.fillText('MIRROR', ex + 8, ey - 10);
      ctx.restore();
    }
  }
}
