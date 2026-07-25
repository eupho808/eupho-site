export class Camera {
  constructor(width, height) {
    this.x = 0;
    this.y = 0;
    this.width = width;
    this.height = height;
    this.shake = 0;
    this.shakeDecay = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.bounds = { minX: 0, minY: -300, maxX: 5000, maxY: 2000 };
    this.zoom = 1;
  }

  setBounds(minX, minY, maxX, maxY) {
    this.bounds = { minX, minY, maxX, maxY };
  }

  follow(target, dt) {
    this.targetX = target.x + target.width / 2 - this.width / (2 * this.zoom);
    this.targetY = target.y + target.height / 2 - this.height / (2 * this.zoom) - 60;

    const smooth = 6 * dt;
    this.x += (this.targetX - this.x) * smooth;
    this.y += (this.targetY - this.y) * smooth;

    this.x = Math.max(this.bounds.minX, Math.min(this.x, this.bounds.maxX - this.width / this.zoom));
    this.y = Math.max(this.bounds.minY, Math.min(this.y, this.bounds.maxY - this.height / this.zoom));

    if (this.shake > 0) {
      this.x += (Math.random() - 0.5) * this.shake;
      this.y += (Math.random() - 0.5) * this.shake;
      this.shake -= this.shakeDecay * dt;
      if (this.shake < 0) this.shake = 0;
    }
  }

  addShake(amount, duration) {
    this.shake = Math.max(this.shake, amount);
    this.shakeDecay = amount / Math.max(duration, 0.001);
  }

  worldToScreen(x, y) {
    return { x: (x - this.x) * this.zoom, y: (y - this.y) * this.zoom };
  }
}
