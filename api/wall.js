const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'data', 'users.json');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { id, text } = req.body || {};
  const users = JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
  const user = users.find(u => u.id === id);
  if (!user) return res.status(400).json({ error: 'User not found' });

  user.wall.unshift({ text, time: Date.now() });
  fs.writeFileSync(file, JSON.stringify(users, null, 2));
  res.status(200).json({ success: true });
};
