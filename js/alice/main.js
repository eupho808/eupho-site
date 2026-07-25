/**
 * Entry point for Alice: Fractured Looking-Glass.
 */
import { Game } from './Game.js';

const canvas = document.getElementById('game-canvas');
const healthBar = document.getElementById('health-bar');
const scoreEl = document.getElementById('score');
const hysteriaFill = document.getElementById('hysteria-fill');
const pepperEl = document.getElementById('pepper');
const memoryEl = document.getElementById('memory-count');
const startOverlay = document.getElementById('start-overlay');
const gameOverOverlay = document.getElementById('gameover-overlay');
const victoryOverlay = document.getElementById('victory-overlay');
const endTitle = document.getElementById('end-title');
const endScore = document.getElementById('end-score');
const startBtn = document.getElementById('start-btn');
const retryBtn = document.getElementById('retry-btn');
const continueBtn = document.getElementById('continue-btn');
const pauseMenu = document.getElementById('pause-menu');
const memoryList = document.getElementById('memory-list');
const hint = document.getElementById('hint');

let game = null;

function updateHUD() {
  if (!game) return;
  healthBar.innerHTML = '';
  for (let i = 0; i < game.player.maxHealth; i++) {
    const rose = document.createElement('div');
    rose.className = 'rose' + (i >= game.player.health ? ' empty' : '');
    healthBar.appendChild(rose);
  }
  scoreEl.textContent = 'TEETH: ' + game.player.teeth;
  pepperEl.textContent = 'PEPPER: ' + game.player.pepper + '/' + game.player.maxPepper;
  memoryEl.textContent = 'MEMORIES: ' + game.memories.length;
  hysteriaFill.style.width = (game.player.hysteria / game.player.maxHysteria * 100) + '%';

  if (game.player.hysteriaTimer > 0) {
    hysteriaFill.parentElement.classList.add('active');
  } else {
    hysteriaFill.parentElement.classList.remove('active');
  }
}

function updateMemoryList() {
  memoryList.innerHTML = '';
  if (game.memories.length === 0) {
    memoryList.innerHTML = '<p style="color:#888">No memories recovered yet.</p>';
    return;
  }
  game.memories.forEach(m => {
    const p = document.createElement('p');
    p.textContent = m;
    p.style.marginBottom = '0.5rem';
    p.style.color = '#aaf';
    p.style.fontSize = '0.8rem';
    memoryList.appendChild(p);
  });
}

window.onGameOver = (teeth, memories) => {
  endTitle.textContent = 'MADNESS WINS';
  endTitle.style.color = '#cc0000';
  endScore.textContent = `Teeth: ${teeth} | Memories: ${memories}`;
  gameOverOverlay.classList.remove('hidden');
  hint.style.display = 'none';
};

window.onVictory = (teeth, memories) => {
  endTitle.textContent = 'WONDERLAND SHATTERS';
  endTitle.style.color = '#ffd700';
  endScore.textContent = `Teeth: ${teeth} | Memories: ${memories}`;
  victoryOverlay.classList.remove('hidden');
  hint.style.display = 'none';
};

function startGame() {
  game = new Game(canvas);
  game.start();
  startOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  victoryOverlay.classList.add('hidden');
  pauseMenu.classList.add('hidden');
  hint.style.display = 'block';
  updateHUDLoop();
}

function updateHUDLoop() {
  if (!game) return;
  updateHUD();
  if (!game.gameOver && !game.victory) {
    requestAnimationFrame(updateHUDLoop);
  }
}

startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);
continueBtn.addEventListener('click', () => {
  victoryOverlay.classList.add('hidden');
  startGame();
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && game && !game.gameOver && !game.victory) {
    game.togglePause();
    pauseMenu.classList.toggle('hidden');
    if (!pauseMenu.classList.contains('hidden')) {
      updateMemoryList();
    }
  }
});

pauseMenu.querySelector('#resume-btn').addEventListener('click', () => {
  game.togglePause();
  pauseMenu.classList.add('hidden');
});

pauseMenu.querySelector('#restart-btn').addEventListener('click', () => {
  game.togglePause();
  startGame();
});

pauseMenu.querySelector('#main-menu-btn').addEventListener('click', () => {
  game.togglePause();
  pauseMenu.classList.add('hidden');
  startOverlay.classList.remove('hidden');
  hint.style.display = 'none';
  game = null;
});
