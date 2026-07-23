const fs = require('fs');
const path = require('path');
const https = require('https');

const SECTIONS_DIR = path.join(__dirname, '../src/components/sections');
const ASSETS_DIR = path.join(__dirname, '../public/assets/beano');

if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) return resolve(dest);
    
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      } else {
        file.close();
        fs.unlink(dest, () => {});
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function processAll() {
  const files = fs.readdirSync(SECTIONS_DIR).filter(f => f.endsWith('.tsx'));
  const urlRegex = /https:\/\/cdn\.prod\.website-files\.com\/69700209399c1d34b8f11637\/([a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/g;
  
  for (const file of files) {
    const filePath = path.join(SECTIONS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    const matches = [...content.matchAll(urlRegex)];
    for (const match of matches) {
      const fullUrl = match[0];
      const filename = match[1];
      // Decode URI components in case of spaces
      const decodedFilename = decodeURIComponent(filename);
      const localPath = path.join(ASSETS_DIR, decodedFilename);
      const relativeUrl = `/assets/beano/${decodedFilename}`;
      
      console.log(`Downloading ${fullUrl} to ${localPath}...`);
      try {
        await downloadFile(fullUrl, localPath);
        // Replace in content
        content = content.split(fullUrl).join(relativeUrl);
      } catch (err) {
        console.error(`Error downloading ${fullUrl}:`, err.message);
      }
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}

processAll().catch(console.error);
