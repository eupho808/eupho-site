(() => {
  const container = document.getElementById('game-container');
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const startOverlay = document.getElementById('start-overlay');
  const startBtn = document.getElementById('start-btn');

  const W = canvas.width;
  const H = canvas.height;

  // Visual novel / Japanese indie horror: Alice in corrupted Wonderland
  const state = {
    scene: 0,
    choices: [],
    sanity: 100,
    collected: 0,
    endings: [],
    running: false,
    typing: false,
    textIndex: 0,
    currentText: '',
    targetText: '',
    bgFlicker: 0,
    enemyNear: false
  };

  // Use real model textures as scene backgrounds
  const scenes = [
    {
      bg: 'assets/models/floor1/d01_landscape.png',
      name: 'Vale of Tears',
      text: 'The river here is thick, like warm ink. You remember this place, but the memory is not yours.',
      choices: [
        { text: 'Follow the river', next: 1 },
        { text: 'Sit down and wait', next: 2 }
      ]
    },
    {
      bg: 'assets/models/cheshire_cat/texture003.png',
      name: 'Cheshire Path',
      text: 'A cat with too many teeth grins from a branch that was not there a moment ago. "Wrong way," it says, though its mouth does not move.',
      choices: [
        { text: 'Ask for directions', next: 3 },
        { text: 'Keep walking', next: 4 }
      ]
    },
    {
      bg: 'assets/models/card_soldier/texture001.png',
      name: 'Waiting Place',
      text: 'You sit. The grass grows over your shoes. It is patient, this place. It has nowhere else to be.',
      choices: [
        { text: 'Stand up quickly', next: 4 },
        { text: 'Stay still', next: 5 }
      ]
    },
    {
      bg: 'assets/models/queen/queen_of_hearts_diff.png',
      name: 'The Queen',
      text: 'The Queen tilts her head. "Off with her doubt," she whispers. The sentence is already in your mouth.',
      choices: [
        { text: 'Bow', next: 6 },
        { text: 'Run', next: 7 }
      ]
    },
    {
      bg: 'assets/models/floor1/d01_dome_sky.png',
      name: 'Dome Sky',
      text: 'The sky is painted on the inside of a skull. You walk beneath it, very small, very watched.',
      choices: [
        { text: 'Look up', next: 8 },
        { text: 'Look at your feet', next: 9 }
      ]
    },
    {
      bg: 'assets/models/floor1/d01_wall01.png',
      name: 'Overgrown',
      text: 'The grass reaches your waist, then your throat. You do not scream. You have forgotten what screaming is for.',
      ending: 'devoured'
    },
    {
      bg: 'assets/models/queen/queen_of_hearts_diff_a.png',
      name: 'Court',
      text: 'The court applauds. Your head remains. The Queen smiles. You are safe here, in the way a nail is safe in wood.',
      ending: 'captive'
    },
    {
      bg: 'assets/models/cheshire_cat/texture005.png',
      name: 'Chase',
      text: 'You run until your reflection cannot keep up. Behind you, something laughs in your own voice.',
      choices: [
        { text: 'Keep running', next: 7 },
        { text: 'Hide behind a tree', next: 9 }
      ]
    },
    {
      bg: 'assets/models/floor1/d01_dome.png',
      name: 'Open Eye',
      text: 'You looked up. The sky looked back. It knows your name now, and names are heavy things to carry.',
      ending: 'seen'
    },
    {
      bg: 'assets/models/floor1/d01_floor_side.png',
      name: 'Rooted',
      text: 'Your feet have become very good at walking. They do not stop when you ask.',
      ending: 'endless'
    },
    {
      bg: 'assets/models/card_soldier/texture003.png',
      name: 'Safe, briefly',
      text: 'You press your back against bark that feels like old paper. The footsteps pass. The silence after is worse.',
      ending: 'escaped'
    }
  ];

  const images = {};
  let loaded = 0;

  scenes.forEach((s, i) => {
    const img = new Image();
    img.src = s.bg;
    img.onload = () => { loaded++; };
    img.onerror = () => { loaded++; };
    images[i] = img;
  });

  startBtn.addEventListener('click', () => {
    startOverlay.classList.add('hidden');
    state.running = true;
    loadScene(0);
    requestAnimationFrame(loop);
  });

  container.addEventListener('click', (e) => {
    if (!state.running) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    handleClick(x, y);
  });

  window.addEventListener('keydown', (e) => {
    if (!state.running) return;
    if (state.typing && e.key === ' ') {
      state.textIndex = state.targetText.length;
      state.currentText = state.targetText;
      state.typing = false;
      return;
    }
    const scene = scenes[state.scene];
    if (!scene.choices || state.typing) return;
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= scene.choices.length) {
      choose(scene.choices[num - 1]);
    }
  });

  function loadScene(index) {
    state.scene = index;
    state.textIndex = 0;
    state.currentText = '';
    state.targetText = scenes[index].text;
    state.typing = true;
    state.enemyNear = index === 3 || index === 7;
  }

  function loop() {
    if (!state.running) return;
    update();
    draw();
    requestAnimationFrame(loop);
  }

  function update() {
    if (state.typing) {
      state.textIndex += 0.8;
      state.currentText = state.targetText.slice(0, Math.floor(state.textIndex));
      if (state.textIndex >= state.targetText.length) {
        state.typing = false;
      }
    }

    if (state.enemyNear) state.sanity -= 0.03;
    if (state.sanity < 0) state.sanity = 0;
    state.bgFlicker = Math.random() < 0.02 + (100 - state.sanity) * 0.001;
  }

  function draw() {
    const scene = scenes[state.scene];
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    const img = images[state.scene];
    if (img && img.complete && img.naturalWidth) {
      ctx.save();
      ctx.globalAlpha = 0.55 + Math.sin(Date.now() * 0.001) * 0.05;
      if (state.bgFlicker) ctx.globalAlpha = 0.35;
      const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      ctx.restore();
    }

    // Vignette
    const grad = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 400);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Static noise
    ctx.save();
    ctx.globalAlpha = 0.06 + (100 - state.sanity) * 0.001;
    for (let i = 0; i < H; i += 2) {
      if (Math.random() < 0.1) {
        ctx.fillStyle = Math.random() < 0.5 ? '#fff' : '#000';
        ctx.fillRect(0, i, W, 1);
      }
    }
    ctx.restore();

    // Text box
    ctx.fillStyle = 'rgba(20, 18, 15, 0.92)';
    ctx.fillRect(20, H - 170, W - 40, 150);
    ctx.strokeStyle = '#7a1515';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, H - 170, W - 40, 150);

    ctx.fillStyle = '#b8b1a4';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(scene.name, 34, H - 148);

    ctx.fillStyle = '#e8e3d7';
    ctx.font = '13px Arial';
    wrapText(ctx, state.currentText, 34, H - 122, W - 68, 20);

    // Choices
    if (!state.typing && scene.choices) {
      scene.choices.forEach((choice, i) => {
        const y = H - 170 - 34 - (scene.choices.length - 1 - i) * 28;
        ctx.fillStyle = 'rgba(20,18,15,0.9)';
        ctx.fillRect(20, y, W - 40, 24);
        ctx.strokeStyle = '#5a4f45';
        ctx.strokeRect(20, y, W - 40, 24);
        ctx.fillStyle = '#c4bdb0';
        ctx.font = '12px Arial';
        ctx.fillText((i + 1) + '. ' + choice.text, 34, y + 16);
      });
    }

    // HUD
    ctx.fillStyle = '#e8e3d7';
    ctx.font = '12px Arial';
    ctx.fillText('Sanity: ' + Math.floor(state.sanity) + '%', 24, 30);
    if (state.enemyNear) {
      ctx.fillStyle = '#7a1515';
      ctx.fillText('SOMEONE IS CLOSE', 24, 50);
    }

    if (scene.ending) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#7a1515';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('ENDING: ' + scene.ending.toUpperCase(), W / 2, H / 2);
      ctx.fillStyle = '#c4bdb0';
      ctx.font = '12px Arial';
      ctx.fillText('Refresh to walk again.', W / 2, H / 2 + 30);
      ctx.textAlign = 'left';
      state.running = false;
    }
  }

  function handleClick(x, y) {
    const scene = scenes[state.scene];
    if (state.typing) {
      state.textIndex = state.targetText.length;
      state.currentText = state.targetText;
      state.typing = false;
      return;
    }
    if (!scene.choices) return;
    scene.choices.forEach((choice, i) => {
      const cy = H - 170 - 34 - (scene.choices.length - 1 - i) * 28;
      if (x > 20 && x < W - 20 && y > cy && y < cy + 24) {
        choose(choice);
      }
    });
  }

  function choose(choice) {
    state.collected++;
    state.sanity = Math.min(100, state.sanity + 5);
    loadScene(choice.next);
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }
})();
