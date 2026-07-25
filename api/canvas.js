const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'data', 'canvas.json');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    const data = JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    return res.status(503).json({ error: 'Canvas write disabled' });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
