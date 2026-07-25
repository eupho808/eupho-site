export class FloatingTextManager {
  constructor() {
    this.texts = [];
  }

  add(x, y, text, color = '#fff', size = 14) {
    this.texts.push({ x, y, text, color, size, life: 1, vy: -45 });
  }

  update(dt) {
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.y += t.vy * dt;
      t.life -= dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
  }

  draw(ctx, camera) {
    ctx.save();
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      ctx.globalAlpha = Math.max(0, t.life);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x - camera.x, t.y - camera.y);
    }
    ctx.restore();
  }
}
