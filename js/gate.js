(() => {
  const canvas = document.getElementById('attractor');
  const ctx = canvas.getContext('2d');
  const codeEl = document.getElementById('gate-code');
  const input = document.getElementById('gate-input');
  const errorEl = document.getElementById('gate-error');
  const submitBtn = document.getElementById('gate-submit');

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let currentCode = generateCode(6);
  let frame = 0;

  function generateCode(len) {
    let out = '';
    for (let i = 0; i < len; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }

  function shuffleCode() {
    currentCode = generateCode(6);
    codeEl.textContent = currentCode.split('').map(() => '-').join('');
  }

  // De Jong attractor params
  const a = 1.641, b = 1.902, c = 0.316, d = 1.525;
  let x = 0.1, y = 0.1;
  let mouseX = canvas.width / 2;
  let mouseY = canvas.height / 2;

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
  });

  function draw() {
    // faint trails
    ctx.fillStyle = 'rgba(17, 17, 17, 0.12)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const scale = 48 + Math.sin(frame * 0.002) * 4;

    // mouse slightly perturbs attractor
    const mx = (mouseX - cx) / canvas.width;
    const my = (mouseY - cy) / canvas.height;

    for (let i = 0; i < 180; i++) {
      const nx = Math.sin(a * y) - Math.cos(b * x);
      const ny = Math.sin(c * x) - Math.cos((d + my * 0.05) * y);
      x = nx;
      y = ny;

      const px = cx + x * scale * (1 + mx * 0.3);
      const py = cy + y * scale * (1 + my * 0.3);

      const dist = Math.hypot(px - mouseX, py - mouseY);
      const heat = Math.max(0, 1 - dist / 90);

      ctx.fillStyle = `rgba(${140 + heat * 80}, ${60 + heat * 40}, ${50 + heat * 30}, ${0.25 + heat * 0.35})`;
      ctx.fillRect(px, py, 1.2, 1.2);
    }

    // draw faint code near center, breathing
    ctx.save();
    ctx.globalAlpha = 0.18 + Math.sin(frame * 0.03) * 0.06;
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillStyle = '#c4a090';
    ctx.textAlign = 'center';
    ctx.fillText(currentCode, cx + Math.sin(frame * 0.01) * 20, cy + Math.cos(frame * 0.012) * 10);
    ctx.restore();

    frame++;
    requestAnimationFrame(draw);
  }

  shuffleCode();
  draw();

  // reshuffle every 25 seconds to keep pressure
  setInterval(() => {
    shuffleCode();
    input.value = '';
    errorEl.textContent = 'the pattern shifted. look again.';
  }, 25000);

  submitBtn.addEventListener('click', checkCode);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkCode();
  });

  function checkCode() {
    const val = input.value.trim().toUpperCase();
    if (val === currentCode) {
      sessionStorage.setItem('fs_gate_passed', '1');
      errorEl.textContent = '';
      codeEl.textContent = currentCode;
      codeEl.style.color = '#2a522a';
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 700);
    } else {
      errorEl.textContent = 'the pattern does not recognize you.';
      input.value = '';
      shuffleCode();
    }
  }
})();
