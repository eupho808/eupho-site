(() => {
  const countEl = document.getElementById('teeth-count');
  let teeth = 32;
  let lastX = 0, lastY = 0;

  document.addEventListener('mousemove', (e) => {
    const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
    if (dist > 40) {
      lastX = e.clientX;
      lastY = e.clientY;
      if (Math.random() < 0.12 && teeth > 0) {
        teeth--;
        countEl.textContent = teeth;
        if (teeth === 0) {
          countEl.textContent = 'debt';
          revealWatcher();
        }
      }
    }
  });

  function revealWatcher() {
    const w = document.createElement('img');
    w.src = 'assets/3f8bf865a5c12bb1eb94d1f8d3c25004.jpg';
    w.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;object-fit:cover;opacity:0;z-index:30000;pointer-events:none;transition:opacity 2s ease;';
    document.body.appendChild(w);
    setTimeout(() => w.style.opacity = '0.25', 50);
    setTimeout(() => { w.style.opacity = '0'; setTimeout(() => w.remove(), 2000); }, 3000);
  }
})();
