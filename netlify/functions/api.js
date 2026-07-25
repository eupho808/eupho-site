const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');

function loadJson(file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
  } catch {
    return [];
  }
}

function saveJson(file, data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

exports.handler = async (event, context) => {
  const method = event.httpMethod;
  const pathname = event.path.replace('/.netlify/functions/api', '').replace('/api', '') || '/';

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // GET beats
  if (pathname === '/beats' && method === 'GET') {
    return { statusCode: 200, headers, body: JSON.stringify(loadJson('beats.json')) };
  }

  // GET kits
  if (pathname === '/kits' && method === 'GET') {
    return { statusCode: 200, headers, body: JSON.stringify(loadJson('kits.json')) };
  }

  // GET users
  if (pathname === '/users' && method === 'GET') {
    const users = loadJson('users.json').map(u => ({ id: u.id, name: u.name, status: u.status, avatar: u.avatar }));
    return { statusCode: 200, headers, body: JSON.stringify(users) };
  }

  // GET canvas
  if (pathname === '/canvas' && method === 'GET') {
    return { statusCode: 200, headers, body: JSON.stringify(loadJson('canvas.json')) };
  }

  // POST canvas
  if (pathname === '/canvas' && method === 'POST') {
    try {
      const strokes = JSON.parse(event.body);
      saveJson('canvas.json', strokes);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid canvas data' }) };
    }
  }

  // POST register
  if (pathname === '/register' && method === 'POST') {
    const params = new URLSearchParams(event.body);
    const name = params.get('name')?.trim();
    const password = params.get('password')?.trim();
    if (!name || !password) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Empty fields' }) };

    const users = loadJson('users.json');
    if (users.find(u => u.name === name)) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Name taken' }) };

    const user = { id: 'u-' + Date.now().toString(36), name, password, status: '', avatar: '', wall: [] };
    users.push(user);
    saveJson('users.json', users);
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, user: { id: user.id, name: user.name } }) };
  }

  // POST login
  if (pathname === '/login' && method === 'POST') {
    const params = new URLSearchParams(event.body);
    const name = params.get('name')?.trim();
    const password = params.get('password')?.trim();
    const user = loadJson('users.json').find(u => u.name === name && u.password === password);
    if (!user) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid credentials' }) };
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, user: { id: user.id, name: user.name, status: user.status, avatar: user.avatar, wall: user.wall } }) };
  }

  // POST wall
  if (pathname === '/wall' && method === 'POST') {
    const params = new URLSearchParams(event.body);
    const id = params.get('id')?.trim();
    const text = params.get('text')?.trim();
    const users = loadJson('users.json');
    const user = users.find(u => u.id === id);
    if (!user) return { statusCode: 400, headers, body: JSON.stringify({ error: 'User not found' }) };
    user.wall.unshift({ text, time: Date.now() });
    saveJson('users.json', users);
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
};
