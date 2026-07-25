// Admin panel is disabled in public build.
const ADMIN_PASSWORD = null;

let beatsCatalog = [];
let kitsCatalog = [];

const loginBox = document.getElementById('admin-login');
const panel = document.getElementById('admin-panel');
const passInput = document.getElementById('admin-pass');
const loginBtn = document.getElementById('admin-login-btn');
const loginError = document.getElementById('login-error');

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  if (sessionStorage.getItem('fs_admin') === '1') showPanel();

  loginBtn.addEventListener('click', tryLogin);
  passInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryLogin(); });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-beats').classList.toggle('admin-hidden', btn.dataset.tab !== 'beats');
      document.getElementById('tab-kits').classList.toggle('admin-hidden', btn.dataset.tab !== 'kits');
    });
  });

  document.getElementById('beat-upload-btn').addEventListener('click', uploadBeat);
  document.getElementById('kit-upload-btn').addEventListener('click', uploadKit);
  document.getElementById('admin-export-btn').addEventListener('click', exportBeats);

  setupDrop('admin-upload-zone');
});

function tryLogin() {
  loginError.textContent = 'Admin panel is disabled in public build.';
  loginError.classList.remove('admin-hidden');
  passInput.value = '';
  setTimeout(() => loginError.classList.add('admin-hidden'), 3000);
}

function showPanel() {
  loginBox.classList.add('admin-hidden');
  panel.classList.add('active');
  renderBeats();
  renderKits();
}

async function loadData() {
  try {
    const b = await fetch(window.API_BASE + '/beats');
    beatsCatalog = await b.json();
    const k = await fetch(window.API_BASE + '/kits');
    kitsCatalog = await k.json();
    if (panel.classList.contains('active')) {
      renderBeats();
      renderKits();
    }
  } catch (e) {
    console.error(e);
  }
}

async function uploadBeat() {
  const audio = document.getElementById('beat-audio').files[0];
  const cover = document.getElementById('beat-cover').files[0];
  if (!audio) return showStatus('beat-upload-status', 'select audio file', 'error');

  const formData = new FormData();
  formData.append('beat', audio);
  if (cover) formData.append('cover', cover);
  formData.append('title', document.getElementById('beat-title').value || audio.name);
  formData.append('bpm', document.getElementById('beat-bpm').value);
  formData.append('key', document.getElementById('beat-key').value);
  formData.append('tags', document.getElementById('beat-tags').value);
  formData.append('price', '');
  formData.append('licenses', JSON.stringify({
    mp3: { label: 'MP3 Lease', price: document.getElementById('lic-mp3').value || '$30' },
    wav: { label: 'WAV Lease', price: document.getElementById('lic-wav').value || '$50' },
    stems: { label: 'Trackout Stems', price: document.getElementById('lic-stems').value || '$100' },
    exclusive: { label: 'Exclusive', price: document.getElementById('lic-exclusive').value || '$300' }
  }));

  try {
    const res = await fetch(window.API_BASE + '/beats', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
      beatsCatalog.push(data.beat);
      renderBeats();
      showStatus('beat-upload-status', 'uploaded: ' + data.beat.title, 'success');
    } else {
      showStatus('beat-upload-status', data.error || 'failed', 'error');
    }
  } catch (e) {
    showStatus('beat-upload-status', 'server error', 'error');
  }
}

async function uploadKit() {
  const file = document.getElementById('kit-file').files[0];
  if (!file) return showStatus('kit-upload-status', 'select ZIP file', 'error');

  const formData = new FormData();
  formData.append('kit', file);
  formData.append('title', document.getElementById('kit-title').value || file.name);
  formData.append('price', document.getElementById('kit-price').value || '$25');
  formData.append('description', document.getElementById('kit-desc').value);

  try {
    const res = await fetch(window.API_BASE + '/kits', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
      kitsCatalog.push(data.kit);
      renderKits();
      showStatus('kit-upload-status', 'uploaded: ' + data.kit.title, 'success');
    } else {
      showStatus('kit-upload-status', data.error || 'failed', 'error');
    }
  } catch (e) {
    showStatus('kit-upload-status', 'server error', 'error');
  }
}

function renderBeats() {
  const list = document.getElementById('admin-list');
  const count = document.getElementById('admin-count');
  count.textContent = beatsCatalog.length + ' beat' + (beatsCatalog.length !== 1 ? 's' : '') + ' on server';
  list.innerHTML = '';

  if (beatsCatalog.length === 0) {
    list.innerHTML = '<div class="admin-item" style="color:var(--text-dim);">No beats yet.</div>';
    return;
  }

  beatsCatalog.forEach(beat => {
    const item = document.createElement('div');
    item.className = 'admin-item';
    item.innerHTML = '<span>' + escapeHtml(beat.title) + ' <span style="color:var(--text-dim);">(' + beat.id + ')</span></span>' +
      '<button class="btn" data-id="' + beat.id + '" data-type="beat">Delete</button>';
    list.appendChild(item);
  });

  list.querySelectorAll('button[data-type="beat"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      await fetch(window.API_BASE + '/beats/' + encodeURIComponent(id), { method: 'DELETE' });
      beatsCatalog = beatsCatalog.filter(b => b.id !== id);
      renderBeats();
    });
  });
}

function renderKits() {
  const list = document.getElementById('admin-kits-list');
  list.innerHTML = '';
  if (kitsCatalog.length === 0) {
    list.innerHTML = '<div class="admin-item" style="color:var(--text-dim);">No kits yet.</div>';
    return;
  }
  kitsCatalog.forEach(kit => {
    const item = document.createElement('div');
    item.className = 'admin-item';
    item.innerHTML = '<span>' + escapeHtml(kit.title) + ' <span style="color:var(--text-dim);">(' + kit.id + ')</span></span>' +
      '<a class="btn" href="' + kit.file + '" download>Download</a>';
    list.appendChild(item);
  });
}

function exportBeats() {
  const blob = new Blob([JSON.stringify(beatsCatalog, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fractured-silk-beats-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

function showStatus(id, msg, type) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = 'upload-status ' + type;
  setTimeout(() => { el.className = 'upload-status'; el.textContent = ''; }, 4000);
}

function setupDrop(id) {
  const zone = document.getElementById(id);
  if (!zone) return;
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
