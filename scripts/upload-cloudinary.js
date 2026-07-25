const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

const beats = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'beats.json'), 'utf8'));
const srcRoot = process.argv[2] || 'C:\\Users\\bruhz\\OneDrive\\Рабочий стол\\2026';

async function findMp3(title) {
  const candidates = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.toLowerCase().endsWith('.mp3')) candidates.push(p);
    }
  }
  walk(srcRoot);

  // Match by folder name containing title
  return candidates.find(p => {
    const folder = path.basename(path.dirname(p)).toLowerCase();
    return title.toLowerCase().split(' ').slice(0, 3).every(w => folder.includes(w));
  });
}

(async () => {
  for (let i = 0; i < beats.length; i++) {
    const beat = beats[i];
    const mp3Path = await findMp3(beat.title);
    if (!mp3Path) {
      console.log('not found:', beat.title);
      continue;
    }

    try {
      const res = await cloudinary.uploader.upload(mp3Path, {
        resource_type: 'video',
        public_id: 'eupho/beats/' + beat.id,
        overwrite: true
      });
      beat.audio = res.secure_url;
      console.log(i + 1, '/', beats.length, 'uploaded', beat.id, res.secure_url);
    } catch (e) {
      console.error('failed', beat.id, e.message);
    }
  }

  fs.writeFileSync(path.join(process.cwd(), 'data', 'beats.json'), JSON.stringify(beats, null, 2));
  console.log('done');
})();
