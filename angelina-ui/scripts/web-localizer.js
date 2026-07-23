const fs = require('fs');
const path = require('path');
const https = require('https');

const HTML_DIR = path.join(__dirname, '../beano-wcopilot.webflow.io');
const OUTPUT_HTML_DIR = path.join(__dirname, '../localized-html');
const ASSETS_DIR = path.join(__dirname, '../public/assets/beano');

if (!fs.existsSync(OUTPUT_HTML_DIR)) fs.mkdirSync(OUTPUT_HTML_DIR, { recursive: true });
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

const urlRegex = /https:\/\/cdn\.prod\.website-files\.com\/[^"'\s\)]+/g;

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) return resolve();
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(dest, () => reject(new Error(`Failed to get '${url}' (${response.statusCode})`)));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const urls = [...new Set(content.match(urlRegex) || [])];
  
  for (const url of urls) {
    // some urls might have quotes at the end if regex missed boundary
    let cleanUrl = url;
    if (cleanUrl.endsWith('"')) cleanUrl = cleanUrl.slice(0, -1);
    if (cleanUrl.endsWith("'")) cleanUrl = cleanUrl.slice(0, -1);
    if (cleanUrl.endsWith(")")) cleanUrl = cleanUrl.slice(0, -1);

    const filename = path.basename(cleanUrl.split('?')[0]);
    // prefix with a hash of the URL to avoid collisions
    const hash = Buffer.from(cleanUrl).toString('base64').substring(0, 8).replace(/[/+=]/g, '_');
    const localFileName = `${hash}_${filename}`;
    const localPath = path.join(ASSETS_DIR, localFileName);
    const relativeUrl = `/assets/beano/${localFileName}`;

    console.log(`Downloading ${cleanUrl} to ${localPath}...`);
    try {
      await download(cleanUrl, localPath);
      // Replace globally in content
      content = content.split(cleanUrl).join(relativeUrl);
    } catch (e) {
      console.error(`Error downloading ${cleanUrl}:`, e.message);
    }
  }

  const outputFilePath = path.join(OUTPUT_HTML_DIR, path.basename(filePath));
  fs.writeFileSync(outputFilePath, content);
  console.log(`Saved localized HTML to ${outputFilePath}`);
}

async function main() {
  const files = fs.readdirSync(HTML_DIR).filter(f => f.endsWith('.html'));
  for (const file of files) {
    await processFile(path.join(HTML_DIR, file));
  }
}

main().catch(console.error);
