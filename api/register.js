const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'data', 'users.json');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { name, password } = req.body || {};
  if (!name || !password) return res.status(400).json({ error: 'Empty fields' });

  const users = JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
  if (users.find(u => u.name === name)) return res.status(400).json({ error: 'Name taken' });

  const user = { id: 'u-' + Date.now().toString(36), name, password, status: '', avatar: '', wall: [] };
  users.push(user);
  fs.writeFileSync(file, JSON.stringify(users, null, 2));
  res.status(200).json({ success: true, user: { id: user.id, name: user.name } });
};
