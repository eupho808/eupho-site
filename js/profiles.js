const AUTH_KEY = 'fs_user';
const VENDOR_PASSWORD = 'teeth2026';
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  loadStats();

  const saved = localStorage.getItem(AUTH_KEY);
  if (saved) {
    currentUser = JSON.parse(saved);
    if (currentUser.name === 'eupho') showProfile();
  }

  document.getElementById('login-btn').addEventListener('click', login);
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('save-status').addEventListener('click', saveStatus);
  document.getElementById('wall-post-btn').addEventListener('click', postWall);
  document.getElementById('wall-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') postWall(); });
});

async function loadStats() {
  try {
    const [beats, kits] = await Promise.all([
      fetch(window.API_BASE + '/beats').then(r => r.json()),
      fetch(window.API_BASE + '/kits').then(r => r.json())
    ]);
    document.getElementById('stat-beats').textContent = beats.length + ' beat' + (beats.length !== 1 ? 's' : '');
    document.getElementById('stat-kits').textContent = kits.length + ' kit' + (kits.length !== 1 ? 's' : '');
  } catch (e) { console.error(e); }
}

function login() {
  showAuth('producer panel is disabled in public build', 'error');
}

function logout() {
  currentUser = null;
  localStorage.removeItem(AUTH_KEY);
  document.getElementById('auth-section').classList.remove('admin-hidden');
  document.getElementById('profile-section').classList.add('admin-hidden');
}

function showProfile() {
  document.getElementById('auth-section').classList.add('admin-hidden');
  document.getElementById('profile-section').classList.remove('admin-hidden');
  document.getElementById('p-name').textContent = currentUser.name;
  document.getElementById('p-status').textContent = currentUser.status || 'Set your status...';
  renderWall();
}

async function saveStatus() {
  if (!currentUser) return;
  const status = document.getElementById('p-status').textContent;
  currentUser.status = status;
  localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));
  await fetch(window.API_BASE + '/wall', {
    method: 'POST',
    body: new URLSearchParams({ id: currentUser.id, text: '[status] ' + status })
  });
}

async function postWall() {
  if (!currentUser) return;
  const input = document.getElementById('wall-input');
  const text = input.value.trim();
  if (!text) return;

  await fetch(window.API_BASE + '/wall', {
    method: 'POST',
    body: new URLSearchParams({ id: currentUser.id, text: text })
  });

  currentUser.wall = currentUser.wall || [];
  currentUser.wall.unshift({ text, time: Date.now() });
  localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));
  input.value = '';
  renderWall();
}

function renderWall() {
  const list = document.getElementById('wall-list');
  list.innerHTML = '';
  const posts = currentUser.wall || [];
  if (posts.length === 0) {
    list.innerHTML = '<div style="color:var(--text-dim);font-size:11px;">No posts yet.</div>';
    return;
  }
  posts.forEach(post => {
    const div = document.createElement('div');
    div.className = 'wall-post';
    div.innerHTML = '<div>' + escapeHtml(post.text) + '</div><time>' + new Date(post.time).toLocaleString() + '</time>';
    list.appendChild(div);
  });
}

function showAuth(msg, type) {
  const el = document.getElementById('auth-status');
  el.textContent = msg;
  el.className = 'upload-status ' + type;
  setTimeout(() => { el.className = 'upload-status'; el.textContent = ''; }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
