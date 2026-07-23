const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            // Regex to match our specific asset paths
            const regex = /\/assets\/beano\/[a-zA-Z0-9_%.-]+/g;
            content = content.replace(regex, (match) => {
                const decoded = decodeURIComponent(match);
                if (decoded !== match) {
                    modified = true;
                    return decoded;
                }
                return match;
            });
            
            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDir(path.join(__dirname, '../src'));
console.log('Done replacing strings in code.');
