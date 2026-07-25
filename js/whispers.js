(() => {
  // 1. Subtle cursor trail
  const trail = [];
  const maxTrail = 8;
  let lastX = 0, lastY = 0;

  document.addEventListener('mousemove', (e) => {
    if (Math.hypot(e.clientX - lastX, e.clientY - lastY) < 10) return;
    lastX = e.clientX;
    lastY = e.clientY;

    const dot = document.createElement('div');
    dot.style.cssText =
      'position:fixed;left:' + (e.clientX - 2) + 'px;top:' + (e.clientY - 2) + 'px;' +
      'width:4px;height:4px;border-radius:50%;background:rgba(120,45,35,0.18);' +
      'pointer-events:none;z-index:99999;transition:opacity 0.6s ease,transform 0.6s ease;';
    document.body.appendChild(dot);
    trail.push(dot);

    requestAnimationFrame(() => {
      dot.style.opacity = '0';
      dot.style.transform = 'scale(0.4)';
    });

    if (trail.length > maxTrail) {
      const old = trail.shift();
      setTimeout(() => old.remove(), 600);
    }
    setTimeout(() => {
      if (dot.parentNode) dot.remove();
    }, 700);
  });

  // 2. Logo secret: 7 clicks reveals a whisper
  const logos = document.querySelectorAll('.logo');
  let logoClicks = 0;
  logos.forEach(logo => {
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', () => {
      logoClicks++;
      if (logoClicks === 7) {
        const whisper = document.createElement('div');
        whisper.textContent = 'the symbol is a door. knock three times.';
        whisper.style.cssText =
          'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
          'background:#e8e3d7;border:1px solid var(--border-dark);padding:12px 16px;' +
          'font-size:12px;color:var(--blood);z-index:30000;box-shadow:0 4px 14px rgba(0,0,0,0.2);';
        document.body.appendChild(whisper);
        setTimeout(() => {
          whisper.style.opacity = '0';
          whisper.style.transition = 'opacity 1s ease';
          setTimeout(() => whisper.remove(), 1000);
        }, 2200);
        logoClicks = 0;
      }
    });
  });

  // 3. Footer year hover reveal + click opens a model texture
  const footerPs = document.querySelectorAll('.footer p');
  footerPs.forEach(p => {
    if (p.textContent.includes('2011-2026')) {
      p.style.cursor = 'help';
      p.title = 'some years were longer than others';
      p.addEventListener('click', () => {
        window.open('assets/models/alice/AliceW_Skin_DM.png', '_blank');
      });
    }
  });

  // 4. Random rare whisper on first scroll
  let whispered = false;
  document.addEventListener('scroll', () => {
    if (whispered) return;
    if (Math.random() < 0.02) {
      whispered = true;
      const w = document.createElement('div');
      w.textContent = pickWhisper();
      w.style.cssText =
        'position:fixed;bottom:80px;left:16px;font-size:10px;color:var(--text-dim);' +
        'opacity:0;pointer-events:none;z-index:9999;transition:opacity 2s ease;';
      document.body.appendChild(w);
      requestAnimationFrame(() => w.style.opacity = '0.7');
      setTimeout(() => {
        w.style.opacity = '0';
        setTimeout(() => w.remove(), 2000);
      }, 3500);
    }
  }, { passive: true });

  function pickWhisper() {
    const whispers = [
      'the rabbit was here first.',
      'your reflection typed that.',
      'the beats are listening.',
      'do not refresh.',
      'someone else is browsing this exact page.',
      'the vendor knows your screen resolution.',
      'the looking-glass is warmer now.',
      'visit /mirror.html if you dare.',
      '/teeth.html knows your balance.',
      '/dream.html is still growing.',
      '/admin.html hides the vendor terminal.',
      'press 7 on the logo three times.'
    ];
    return whispers[Math.floor(Math.random() * whispers.length)];
  }
})();
