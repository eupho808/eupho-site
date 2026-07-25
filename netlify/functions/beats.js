const fs = require('fs');
const path = require('path');
const os = require('os');

function generateId(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_');
}

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const boundary = (event.headers['content-type'] || '').match(/boundary=([^;]+)/)?.[1];
    if (!boundary) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No boundary' })
      };
    }

    const bodyBuffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
    const boundaryBuffer = Buffer.from('--' + boundary);

    const parts = [];
    let start = bodyBuffer.indexOf(boundaryBuffer);

    while (start !== -1) {
      const end = bodyBuffer.indexOf(boundaryBuffer, start + boundaryBuffer.length);
      if (end === -1) break;

      const part = bodyBuffer.slice(start + boundaryBuffer.length, end);
      const headerEnd = part.indexOf('\r\n\r\n');
      if (headerEnd === -1) {
        start = end;
        continue;
      }

      const header = part.slice(0, headerEnd).toString();
      const data = part.slice(headerEnd + 4, part.length - 2);

      const nameMatch = header.match(/name="([^"]+)"/);
      const filenameMatch = header.match(/filename="([^"]*)"/);

      parts.push({
        name: nameMatch ? nameMatch[1] : '',
        filename: filenameMatch ? filenameMatch[1] : null,
        data: data
      });

      start = end;
    }

    const filePart = parts.find(p => p.name === 'beat' && p.filename);
    if (!filePart || filePart.data.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No beat file' })
      };
    }

    const ext = path.extname(filePart.filename).toLowerCase() || '.mp3';
    if (!['.mp3', '.wav'].includes(ext)) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Only MP3 or WAV allowed' })
      };
    }

    const title = path.basename(filePart.filename, ext)
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    const id = generateId(title);
    const filename = sanitizeFilename(id + ext);

    const tmpDir = os.tmpdir();
    const tmpPath = path.join(tmpDir, filename);
    fs.writeFileSync(tmpPath, filePart.data);

    const beat = {
      id: id,
      title: title,
      bpm: '?',
      key: '?',
      tags: ['uploaded'],
      price: '$?',
      preview: tmpPath
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: true, beat: beat })
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};
