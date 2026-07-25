const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'data', 'beats.json');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const data = JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
  res.status(200).json(data);
};
