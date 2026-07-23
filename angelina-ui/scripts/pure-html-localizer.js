const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const HTML_DIR = path.join(__dirname, '../beano-wcopilot.webflow.io');
const OUTPUT_HTML_DIR = path.join(__dirname, '../localized-html');
const ASSETS_DIR = path.join(__dirname, '../localized-html/assets/beano');

if (!fs.existsSync(OUTPUT_HTML_DIR)) fs.mkdirSync(OUTPUT_HTML_DIR, { recursive: true });
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) return resolve(dest);
    
    const client = url.startsWith('https') ? https : http;
    const requestOptions = {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    };
    client.get(url, requestOptions, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
         let redirectUrl = response.headers.location;
         if (!redirectUrl.startsWith('http')) {
           redirectUrl = new URL(redirectUrl, url).href;
         }
         return downloadFile(redirectUrl, dest).then(resolve).catch(reject);
      }
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      } else {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function getLocalFileName(cleanUrl) {
  try {
    const urlObj = new URL(cleanUrl);
    let filename = path.basename(urlObj.pathname);
    const hash = Buffer.from(cleanUrl).toString('base64').substring(0, 8).replace(/[/+=]/g, '_');
    if (cleanUrl.includes('fonts.googleapis.com/css')) {
      return `${hash}_fonts.css`;
    }
    return `${hash}_${filename || 'index'}`;
  } catch(e) {
    return `error_${Date.now()}`;
  }
}

async function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  const urlRegex = /(?:src|href)="([^"]+)"|url\(['"]?([^'"\)]+)['"]?\)/g;
  
  for (const file of files) {
    const inputFilePath = path.join(dirPath, file.name);
    
    // Maintain relative directory structure for output
    const relativeDir = path.relative(HTML_DIR, dirPath);
    const outputDir = path.join(OUTPUT_HTML_DIR, relativeDir);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    if (file.isDirectory()) {
      await processDirectory(inputFilePath);
      continue;
    }
    
    if (!file.name.endsWith('.html') && !file.name.includes('.')) {
      // some webflow exports have no extension for routes
      // we'll process them anyway if they look like html
      let tempContent = '';
      try { tempContent = fs.readFileSync(inputFilePath, 'utf8'); } catch(e){}
      if (!tempContent.includes('<html')) continue;
    } else if (!file.name.endsWith('.html')) {
      continue;
    }

    const outputFilePath = path.join(outputDir, file.name.endsWith('.html') ? file.name : file.name + '.html');
    console.log(`Processing ${inputFilePath}...`);
    
    let content = fs.readFileSync(inputFilePath, 'utf8');
    
    // Remove integrity/crossorigin to prevent local issues
    content = content.replace(/\s+integrity="[^"]+"/g, '');
    content = content.replace(/\s+crossorigin="[^"]*"/g, '');
    
    // Specifically handle WebFont.load
    const webfontRegex = /WebFont\.load\(\{[\s\S]*?families:\s*\[([^\]]+)\][\s\S]*?\}\);/;
    const wfMatch = content.match(webfontRegex);
    if (wfMatch) {
      const families = wfMatch[1].replace(/['"]/g, '').split(',').map(s => s.trim());
      const familyParams = families.map(f => f.replace(':', ':wght@').replace(/ /g, '+')).join('&family=');
      const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${familyParams}&display=swap`;
      
      const localFileName = getLocalFileName(googleFontsUrl);
      const localPath = path.join(ASSETS_DIR, localFileName);
      
      const relativeAssetPath = path.relative(outputDir, ASSETS_DIR).replace(/\\/g, '/');
      const relativeUrl = `${relativeAssetPath}/${localFileName}`;
      
      try {
        console.log(`Downloading Google Fonts CSS...`);
        await downloadFile(googleFontsUrl, localPath);
        
        // Read CSS and download inner font files
        let cssContent = fs.readFileSync(localPath, 'utf8');
        const fontUrlRegex = /url\((https:\/\/[^)]+)\)/g;
        const fontMatches = [...cssContent.matchAll(fontUrlRegex)];
        for (const fontMatch of fontMatches) {
           const fUrl = fontMatch[1];
           const fLocalName = getLocalFileName(fUrl);
           const fLocalPath = path.join(ASSETS_DIR, fLocalName);
           await downloadFile(fUrl, fLocalPath);
           cssContent = cssContent.split(fUrl).join(`./${fLocalName}`); // relative to CSS file
        }
        fs.writeFileSync(localPath, cssContent);
        
        // Replace WebFont script with link tag
        content = content.replace(/<script[^>]*>[\s\S]*?WebFont\.load[\s\S]*?<\/script>/, `<link rel="stylesheet" href="${relativeUrl}">`);
      } catch (err) {
        console.error('Error with fonts:', err.message);
      }
    }

    // Process all other URLs
    const matches = [...content.matchAll(urlRegex)];
    for (const match of matches) {
      const fullUrl = match[1] || match[2];
      
      // We only care about absolute http/https URLs
      if (!fullUrl || !fullUrl.startsWith('http')) continue;
      // Skip xml namespaces
      if (fullUrl.includes('w3.org')) continue;
      
      const localFileName = getLocalFileName(fullUrl);
      const localPath = path.join(ASSETS_DIR, localFileName);
      
      const relativeAssetPath = path.relative(outputDir, ASSETS_DIR).replace(/\\/g, '/');
      const relativeUrl = `${relativeAssetPath}/${localFileName}`;
      
      const exactMatchStr = match[0];
      const replacementStr = exactMatchStr.replace(fullUrl, relativeUrl);
      
      try {
        console.log(`Downloading ${fullUrl}...`);
        await downloadFile(fullUrl, localPath);
        
        // If it's a CSS file, process URLs inside it
        if (localFileName.endsWith('.css') || fullUrl.includes('.css')) {
           let cssContent = fs.readFileSync(localPath, 'utf8');
           const cssUrlRegex = /url\(['"]?([^'"\)]+)['"]?\)/g;
           const cssMatches = [...cssContent.matchAll(cssUrlRegex)];
           for (const cm of cssMatches) {
               let nestedUrl = cm[1];
               if (nestedUrl.startsWith('data:')) continue; // Skip data URIs
               
               if (!nestedUrl.startsWith('http')) {
                 nestedUrl = new URL(nestedUrl, fullUrl).href;
               }
               const nLocalName = getLocalFileName(nestedUrl);
               const nLocalPath = path.join(ASSETS_DIR, nLocalName);
               try {
                   await downloadFile(nestedUrl, nLocalPath);
                   const exactNestedMatchStr = cm[0];
                   const nestedReplacementStr = exactNestedMatchStr.replace(cm[1], `./${nLocalName}`);
                   cssContent = cssContent.split(exactNestedMatchStr).join(nestedReplacementStr); // relative to CSS file location
               } catch(e) {
                   console.error(`Error downloading nested ${nestedUrl}:`, e.message);
               }
           }
           fs.writeFileSync(localPath, cssContent);
        }
        
        content = content.split(exactMatchStr).join(replacementStr);
      } catch (err) {
        console.error(`Error downloading ${fullUrl}:`, err.message);
      }
    }
    
    fs.writeFileSync(outputFilePath, content);
    console.log(`Saved completely offline HTML to ${outputFilePath}`);
  }
}

async function processAll() {
  await processDirectory(HTML_DIR);
}

processAll().catch(console.error);
