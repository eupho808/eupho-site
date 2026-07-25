const fs = require('fs');
const path = require('path');

const src = process.argv[2] || 'C:\\Users\\bruhz\\OneDrive\\Рабочий стол\\2026';
const uploads = path.join(process.cwd(), 'uploads');
const dataDir = path.join(process.cwd(), 'data');

if (!fs.existsSync(uploads)) fs.mkdirSync(uploads, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function isFinalMp3(filePath) {
  const dirName = path.basename(path.dirname(filePath));
  const fileName = path.basename(filePath, '.mp3');
  const d = dirName.toLowerCase().replace(/[^a-z0-9а-я]/g, '');
  const f = fileName.toLowerCase().replace(/[^a-z0-9а-я]/g, '');
  return f.startsWith(d.slice(0, 15)) || d.startsWith(f.slice(0, 15));
}

function cleanName(name) {
  return name
    .replace(/\.mp3$/i, '')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/[^\x00-\x7F]/g, c => {
      const map = {
        'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i',
        'й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t',
        'у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y',
        'ь':'','э':'e','ю':'yu','я':'ya','і':'i','ґ':'g','є':'ye'
      };
      const lc = c.toLowerCase();
      return map[lc] !== undefined ? map[lc] : '';
    })
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function extractBpm(name) {
  const m = name.match(/(\d{2,3})\s*(?:bpm)?/i);
  return m ? parseInt(m[1], 10) : 140;
}

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.toLowerCase().endsWith('.mp3') && fs.statSync(p).size > 800000 && isFinalMp3(p)) {
      files.push(p);
    }
  }
}
walk(src);

console.log('found final beats:', files.length);

files.forEach((f, i) => {
  const dirName = path.basename(path.dirname(f));
  const safe = cleanName(dirName) || ('beat-' + (i + 1));
  const target = path.join(uploads, safe + '.mp3');
  fs.copyFileSync(f, target);
});

const beats = files.map((f, i) => {
  const dirName = path.basename(path.dirname(f));
  const safe = cleanName(dirName) || ('beat-' + (i + 1));
  const bpm = extractBpm(dirName);
  return {
    id: 'beat-' + (i + 1).toString().padStart(3, '0'),
    title: safe,
    bpm: bpm,
    key: '',
    tags: [],
    cover: '',
    audio: 'uploads/' + safe + '.mp3',
    duration: 0,
    licenses: {
      mp3: { label: 'MP3 Lease', price: '$8' },
      wav: { label: 'MP3 + WAV Lease', price: '$13' },
      stems: { label: 'Trackout Stems', price: '$16' },
      unlimited: { label: 'Unlimited Lease', price: '$29' },
      exclusive: { label: 'Exclusive', price: '$44+' }
    }
  };
});

fs.writeFileSync(path.join(dataDir, 'beats.json'), JSON.stringify(beats, null, 2));
console.log('created data/beats.json with', beats.length, 'beats');
