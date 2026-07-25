let beatsData = [];
let currentAudio = null;
let currentBeat = null;
let activeTag = 'all';

const TELEGRAM_HANDLE = 'euphotg';

const playerBar = document.getElementById('player-bar');
const playerCover = document.getElementById('player-cover');
const playerTitle = document.getElementById('player-title');
const playerMeta = document.getElementById('player-meta');
const playerWave = document.getElementById('player-wave');
const playerPlay = document.getElementById('player-play');
const playerTime = document.getElementById('player-time');
const playerBuy = document.getElementById('player-buy');

document.addEventListener('DOMContentLoaded', async () => {
  await loadBeats();
  initPlayer();
  initFilters();
});

async function loadBeats() {
  try {
    const res = await fetch(window.API_BASE + '/beats');
    beatsData = await res.json();
    renderTags();
    renderBeats();
    document.getElementById('beat-count').textContent = beatsData.length + ' beat' + (beatsData.length !== 1 ? 's' : '');
  } catch (error) {
    console.error('Failed to load beats:', error);
    document.getElementById('beat-grid').innerHTML = '<p style="text-align:center;color:var(--text-dim);">failed to load beats...</p>';
  }
}

function initFilters() {
  document.querySelectorAll('.beat-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTag = btn.dataset.tag;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderBeats();
    });
  });
}

function renderTags() {
  const tags = new Set();
  beatsData.forEach(b => (b.tags || []).forEach(t => tags.add(t)));

  const container = document.getElementById('beat-filters');
  if (!container) return;
  container.innerHTML = '';

  const allBtn = createFilterBtn('all', 'ALL');
  allBtn.classList.add('active');
  container.appendChild(allBtn);

  Array.from(tags).sort().forEach(tag => container.appendChild(createFilterBtn(tag, tag)));
}

function createFilterBtn(tag, label) {
  const btn = document.createElement('button');
  btn.className = 'btn filter-btn';
  btn.textContent = label;
  btn.dataset.tag = tag;
  btn.addEventListener('click', () => {
    activeTag = tag;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderBeats();
  });
  return btn;
}

function renderBeats() {
  const grid = document.getElementById('beat-grid');
  const empty = document.getElementById('beat-empty');
  if (!grid) return;

  const beats = activeTag === 'all' ? beatsData : beatsData.filter(b => (b.tags || []).includes(activeTag));

  grid.innerHTML = '';
  if (beats.length === 0) {
    grid.style.display = 'none';
    if (empty) empty.style.display = 'block';
    return;
  }

  grid.style.display = 'grid';
  if (empty) empty.style.display = 'none';

  beats.forEach(beat => {
    const card = document.createElement('article');
    card.className = 'beat-card';
    card.dataset.id = beat.id;
    const cover = beat.cover || 'assets/13.jpg';
    const tags = (beat.tags || []).map(t => '<span class="beat-tag">' + escapeHtml(t) + '</span>').join('');
    const starting = getStartingPrice(beat);

    card.innerHTML =
      '<div class="beat-cover" style="background-image:url(' + escapeHtml(cover) + ')">' +
        '<div class="beat-play-overlay"><div class="beat-play-btn"><span class="icon-play"></span></div></div>' +
      '</div>' +
      '<div class="beat-info">' +
        '<div class="beat-title">' + escapeHtml(beat.title) + '</div>' +
        '<div class="beat-meta">' + (beat.bpm || '?') + ' BPM | ' + (beat.key || '?') + '</div>' +
        '<div class="beat-tags">' + tags + '</div>' +
        '<div class="beat-price-row"><span class="beat-starting">from ' + escapeHtml(starting) + '</span></div>' +
      '</div>';

    card.addEventListener('click', (e) => {
      if (!e.target.closest('.beat-play-btn')) return;
      selectBeat(beat.id);
    });

    grid.appendChild(card);
  });
}

function getStartingPrice(beat) {
  const licenses = beat.licenses || {};
  const prices = Object.values(licenses).map(l => l.price).filter(Boolean);
  if (prices.length) return prices.sort()[0];
  return beat.price || '$?';
}

function selectBeat(id) {
  const beat = beatsData.find(b => b.id === id);
  if (!beat) return;

  if (currentBeat && currentBeat.id === beat.id && currentAudio) {
    togglePlay();
    return;
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentBeat = beat;
  currentAudio = new Audio(beat.audio || beat.preview);

  playerTitle.textContent = beat.title;
  playerMeta.textContent = (beat.bpm || '?') + ' BPM | ' + (beat.key || '?') + ' | ' + (beat.tags || []).join(', ');
  playerCover.style.backgroundImage = 'url(' + (beat.cover || 'assets/13.jpg') + ')';
  playerBuy.innerHTML = renderLicenseButtons(beat);
  bindLicenseButtons(playerBuy, beat);

  document.querySelectorAll('.beat-card').forEach(c => c.classList.toggle('active', c.dataset.id === id));

  currentAudio.addEventListener('timeupdate', updateTime);
  currentAudio.addEventListener('ended', () => { playerPlay.innerHTML = '<span class="icon-play"></span>'; });
  currentAudio.addEventListener('error', () => { playerTitle.textContent = 'preview unavailable'; });

  playerBar.classList.add('active');
  drawWave();

  currentAudio.play().then(() => { playerPlay.innerHTML = '<span class="icon-stop"></span>'; }).catch(() => { playerPlay.innerHTML = '<span class="icon-play"></span>'; });
}

function togglePlay() {
  if (!currentAudio) return;
  if (currentAudio.paused) {
    currentAudio.play();
    playerPlay.innerHTML = '<span class="icon-stop"></span>';
  } else {
    currentAudio.pause();
    playerPlay.innerHTML = '<span class="icon-play"></span>';
  }
}

function initPlayer() {
  playerPlay.addEventListener('click', togglePlay);
}

function updateTime() {
  if (!currentAudio) return;
  playerTime.textContent = formatTime(currentAudio.currentTime) + ' / ' + formatTime(currentAudio.duration || 0);
  updateWaveProgress(currentAudio.currentTime / (currentAudio.duration || 1));
}

function renderLicenseButtons(beat) {
  const licenses = beat.licenses || {};
  return Object.keys(licenses).map(type => {
    const l = licenses[type];
    return '<button class="btn license-btn" data-type="' + type + '">' + escapeHtml(l.label) + ' ' + escapeHtml(l.price) + '</button>';
  }).join('');
}

function bindLicenseButtons(container, beat) {
  container.querySelectorAll('.license-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = btn.dataset.type;
      const l = (beat.licenses || {})[type] || { label: type, price: beat.price || '$?' };
      const url = 'https://t.me/' + TELEGRAM_HANDLE + '?text=' +
        encodeURIComponent('hi, i want to buy "' + beat.title + '" - ' + l.label + ' (' + l.price + ')');
      window.open(url, '_blank');
    });
  });
}

function drawWave() {
  playerWave.innerHTML = '';
  const bars = 40;
  for (let i = 0; i < bars; i++) {
    const bar = document.createElement('div');
    bar.className = 'player-bar-el';
    bar.style.height = (15 + Math.random() * 85) + '%';
    playerWave.appendChild(bar);
  }
}

function updateWaveProgress(pct) {
  const bars = playerWave.querySelectorAll('.player-bar-el');
  const active = Math.floor(pct * bars.length);
  bars.forEach((bar, i) => bar.classList.toggle('active', i < active));
}

function formatTime(s) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
