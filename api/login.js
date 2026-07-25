const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'data', 'users.json');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { name, password } = req.body || {};
  const users = JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
  const user = users.find(u => u.name === name && u.password === password);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  res.status(200).json({ success: true, user: { id: user.id, name: user.name, status: user.status, avatar: user.avatar, wall: user.wall } });
};
