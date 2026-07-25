(() => {
  const video = document.getElementById('mirror-video');
  const q = document.getElementById('mirror-q');
  const text = document.getElementById('mirror-text');
  const yes = document.getElementById('mirror-yes');
  const no = document.getElementById('mirror-no');

  const phrases = [
    'Your reflection blinked first.',
    'There is someone behind you in the glass.',
    'The mirror likes your face. It wants to keep it.',
    'You look older than when you opened this page.',
    'Your eyes are the same color as Hers.',
    'Do not smile. The reflection will copy you wrong.'
  ];

  yes.addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        video.srcObject = stream;
        q.textContent = 'It sees you now.';
        text.textContent = pick(phrases);
        setInterval(() => {
          text.textContent = pick(phrases);
        }, 5000);
      })
      .catch(() => {
        q.textContent = 'The mirror is denied.';
        text.textContent = 'It will remember that.';
      });
  });

  no.addEventListener('click', () => {
    q.textContent = 'The mirror is patient.';
    text.textContent = 'It will use mine instead.';
    video.style.background = '#000';
    video.style.boxShadow = 'inset 0 0 60px #7a1515';
    flashWatcher();
  });

  function flashWatcher() {
    const watcher = document.createElement('img');
    watcher.src = 'assets/chrome_zjoQOUTVG9.png';
    watcher.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.8);width:80px;height:80px;border-radius:50%;filter:grayscale(100%) blur(1px);opacity:0;z-index:30000;transition:opacity 0.3s ease;pointer-events:none;';
    document.body.appendChild(watcher);
    setTimeout(() => watcher.style.opacity = '0.6', 50);
    setTimeout(() => { watcher.style.opacity = '0'; setTimeout(() => watcher.remove(), 300); }, 400);
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
})();
