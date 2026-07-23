const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const cheerio = require('cheerio');

const HTML_DIR = path.join(__dirname, '../beano-wcopilot.webflow.io');
const OUTPUT_HTML_DIR = path.join(__dirname, '../localized-html');
const ASSETS_DIR = path.join(__dirname, '../localized-html/assets/beano');

if (!fs.existsSync(OUTPUT_HTML_DIR)) fs.mkdirSync(OUTPUT_HTML_DIR, { recursive: true });
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      return resolve();
    }
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    };
    client.get(url, options, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        let redirectUrl = response.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const urlObj = new URL(url);
          redirectUrl = urlObj.origin + (redirectUrl.startsWith('/') ? '' : '/') + redirectUrl;
        }
        return download(redirectUrl, dest).then(resolve).catch(reject);
      }
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

function getLocalFileName(cleanUrl) {
  try {
    const urlObj = new URL(cleanUrl);
    const filename = path.basename(urlObj.pathname);
    const hash = Buffer.from(cleanUrl).toString('base64').substring(0, 8).replace(/[/+=]/g, '_');
    // Ensure we have an extension if it's a CSS file
    if (cleanUrl.includes('fonts.googleapis.com/css')) {
      return `${hash}_fonts.css`;
    }
    return `${hash}_${filename || 'index'}`;
  } catch(e) {
    return `error_${Date.now()}`;
  }
}

async function processCss(cssContent, baseUrl) {
  const urlRegex = /url\(['"]?([^'"\)]+)['"]?\)/g;
  const importRegex = /@import\s+['"]([^'"]+)['"]/g;
  
  let match;
  let newContent = cssContent;
  const urlsToDownload = [];

  while ((match = urlRegex.exec(cssContent)) !== null) {
    urlsToDownload.push(match[1]);
  }
  while ((match = importRegex.exec(cssContent)) !== null) {
    urlsToDownload.push(match[1]);
  }

  for (let rawUrl of urlsToDownload) {
    if (rawUrl.startsWith('data:')) continue;
    
    let absoluteUrl;
    try {
      absoluteUrl = new URL(rawUrl, baseUrl).href;
    } catch (e) {
      continue;
    }

    const localFileName = getLocalFileName(absoluteUrl);
    const localPath = path.join(ASSETS_DIR, localFileName);
    const relativeUrl = `./assets/beano/${localFileName}`;

    console.log(`Downloading CSS nested asset ${absoluteUrl}...`);
    try {
      await download(absoluteUrl, localPath);
      if (localFileName.endsWith('.css')) {
         const nestedCss = fs.readFileSync(localPath, 'utf8');
         const processedNestedCss = await processCss(nestedCss, absoluteUrl);
         fs.writeFileSync(localPath, processedNestedCss);
      }
      newContent = newContent.split(rawUrl).join(relativeUrl);
    } catch (e) {
      console.error(`Error downloading nested asset ${absoluteUrl}:`, e.message);
    }
  }
  return newContent;
}

async function processFile(filePath) {
  console.log(`Processing HTML file: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Basic check for HTML
  if (!filePath.endsWith('.html') && !filePath.includes('g0lnomhfn3mg')) return;
  
  const $ = cheerio.load(content);
  const downloadQueue = new Set();
  
  // 1. Remove integrity and crossorigin to prevent local execution blocks
  $('[integrity]').removeAttr('integrity');
  $('[crossorigin]').removeAttr('crossorigin');

  // 2. Remove preconnects as they are useless locally and cause issues
  $('link[rel="preconnect"]').remove();

  // 3. Find and replace URLs in all attributes
  $('*').each((i, el) => {
    for (const attr in el.attribs) {
      const val = el.attribs[attr];
      if (!val) continue;

      // Match absolute URLs
      const urls = val.match(/https?:\/\/[^'"\s\)]+/g);
      if (urls) {
        for (const u of urls) {
          // ignore common namespaces
          if (u === 'http://www.w3.org/2000/svg' || u.includes('schema.org')) continue;
          downloadQueue.add(u);
        }
      }
    }
  });

  // 4. Handle inline script contents (like WebFont.load)
  $('script').each((i, el) => {
    const scriptContent = $(el).html();
    if (scriptContent) {
      const urls = scriptContent.match(/https?:\/\/[^'"\s\)]+/g);
      if (urls) {
        for (const u of urls) {
          if (u.includes('schema.org')) continue;
          downloadQueue.add(u);
        }
      }
      
      // Specifically look for WebFont.load
      if (scriptContent.includes('WebFont.load')) {
        // We can just nuke the WebFont.load block and add the CSS manually if we want,
        // but easier to just extract families if possible.
        const familyMatch = scriptContent.match(/families:\s*\[([^\]]+)\]/);
        if (familyMatch) {
          const families = familyMatch[1].replace(/['"]/g, '').split(',').map(s => s.trim());
          // construct google fonts url
          const familyParams = families.map(f => {
            return f.replace(':', ':wght@').replace(/ /g, '+');
          }).join('&family=');
          const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${familyParams}&display=swap`;
          downloadQueue.add(googleFontsUrl);
          
          // Replace the script with a link tag
          const localFileName = getLocalFileName(googleFontsUrl);
          const relativeUrl = `./assets/beano/${localFileName}`;
          $(el).replaceWith(`<link rel="stylesheet" href="${relativeUrl}">`);
        }
      }
    }
  });

  // 5. Handle inline styles with url()
  $('[style*="url("]').each((i, el) => {
    const style = $(el).attr('style');
    const urlMatch = style.match(/url\(['"]?(https?:\/\/[^'"\)]+)['"]?\)/);
    if (urlMatch) {
      downloadQueue.add(urlMatch[1]);
    }
  });

  // Process the download queue
  let modifiedHtml = $.html();

  for (const url of Array.from(downloadQueue)) {
    try {
      const localFileName = getLocalFileName(url);
      const localPath = path.join(ASSETS_DIR, localFileName);
      const relativeUrl = `./assets/beano/${localFileName}`;

      console.log(`Downloading ${url}...`);
      await download(url, localPath);

      if (localFileName.endsWith('.css') || url.includes('.css') || url.includes('fonts.googleapis.com/css')) {
        let cssContent = fs.readFileSync(localPath, 'utf8');
        cssContent = await processCss(cssContent, url);
        fs.writeFileSync(localPath, cssContent);
      }

      // Update DOM with simple string replacement
      modifiedHtml = modifiedHtml.split(url).join(relativeUrl);
    } catch (e) {
      console.error(`Error downloading ${url}:`, e.message);
    }
  }

  const outputFilePath = path.join(OUTPUT_HTML_DIR, path.basename(filePath) + (filePath.endsWith('.html') ? '' : '.html'));
  fs.writeFileSync(outputFilePath, modifiedHtml);
  console.log(`Saved completely offline HTML to ${outputFilePath}`);
}

async function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else {
      if (entry.name.endsWith('.html') || !entry.name.includes('.')) {
        await processFile(fullPath);
      }
    }
  }
}

async function main() {
  await processDirectory(HTML_DIR);
  console.log('Advanced localization complete. All files should be fully offline.');
}

main().catch(console.error);
