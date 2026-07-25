/**
 * Input handling for keyboard and touch.
 * Tracks pressed states and just-pressed frames.
 */
export class Input {
  constructor() {
    this.keys = {};
    this.prevKeys = {};
    this.touch = { left: false, right: false, jump: false, attack: false };

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    this.ACTIONS = {
      left: ['ArrowLeft', 'KeyA'],
      right: ['ArrowRight', 'KeyD'],
      up: ['ArrowUp', 'KeyW'],
      down: ['ArrowDown', 'KeyS'],
      jump: ['Space', 'KeyZ', 'KeyW', 'ArrowUp'],
      attack: ['KeyX', 'KeyK'],
      heavy: ['KeyC', 'KeyL'],
      dash: ['ShiftLeft', 'ShiftRight', 'KeyV'],
      hysteria: ['KeyH'],
      pause: ['Escape', 'KeyP'],
      interact: ['KeyE']
    };
  }

  onKeyDown(e) {
    for (const [action, codes] of Object.entries(this.ACTIONS)) {
      if (codes.includes(e.code)) {
        this.keys[action] = true;
        e.preventDefault();
        break;
      }
    }
  }

  onKeyUp(e) {
    for (const [action, codes] of Object.entries(this.ACTIONS)) {
      if (codes.includes(e.code)) {
        this.keys[action] = false;
        break;
      }
    }
  }

  isDown(action) {
    return !!this.keys[action] || !!this.touch[action];
  }

  isPressed(action) {
    return this.isDown(action) && !this.prevKeys[action];
  }

  update() {
    this.prevKeys = { ...this.keys, ...this.touch };
  }
}
