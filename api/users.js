const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'data', 'users.json');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const users = JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
  const safe = users.map(u => ({ id: u.id, name: u.name, status: u.status, avatar: u.avatar }));
  res.status(200).json(safe);
};
