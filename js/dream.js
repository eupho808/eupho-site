(() => {
  const canvas = document.getElementById('dream');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const lines = [];
  let fade = 0;

  function addLine(x, y) {
    const prev = lines.length ? lines[lines.length - 1] : { x: x, y: y };
    lines.push({ x1: prev.x, y1: prev.y, x2: x, y2: y, life: 1 });
    if (lines.length > 80) lines.shift();
  }

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    addLine(e.clientX - rect.left, e.clientY - rect.top);
  });

  const dreamImages = [
    'assets/0fc087e240a9d044251fbcd6dcf11fbd.jpg',
    'assets/396d4ecb7b7865d0ccbc03563c5c5f10.jpg',
    'assets/8b5a26f959a56123d3cdfbf4d3374f59.jpg',
    'assets/99e0dbf969f0ca47ea2df78c9bad46f9.jpg'
  ];

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    for (let i = 0; i < 6; i++) {
      lines.push({
        x1: cx,
        y1: cy,
        x2: cx + (Math.random() - 0.5) * 200,
        y2: cy + (Math.random() - 0.5) * 200,
        life: 1
      });
    }
    if (Math.random() < 0.15) flashMemory(cx, cy);
  });

  function flashMemory(x, y) {
    const img = new Image();
    img.src = dreamImages[Math.floor(Math.random() * dreamImages.length)];
    img.onload = () => {
      const size = 80 + Math.random() * 120;
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.filter = 'grayscale(100%) contrast(1.2)';
      ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
      ctx.restore();
    };
  }

  function loop() {
    ctx.fillStyle = 'rgba(10,10,10,0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    lines.forEach((l, i) => {
      l.life -= 0.003;
      if (l.life <= 0) return;
      ctx.strokeStyle = 'rgba(' + (160 + i % 60) + ',' + (90 + i % 40) + ',' + (80 + i % 40) + ',' + l.life * 0.6 + ')';
      ctx.lineWidth = 1 + l.life;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
    });

    // auto-forget old
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].life <= 0) lines.splice(i, 1);
    }

    // occasional automatic corridor
    fade++;
    if (fade > 120) {
      fade = 0;
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      addLine(x, y);
    }

    requestAnimationFrame(loop);
  }

  loop();
})();
