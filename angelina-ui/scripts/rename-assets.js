const fs = require('fs');
const path = require('path');

const dir = 'public/assets/beano';

function decodeAndMove(directory) {
    const files = fs.readdirSync(directory);
    for (const f of files) {
        const fullPath = path.join(directory, f);
        if (fs.statSync(fullPath).isDirectory()) {
            decodeAndMove(fullPath);
            continue;
        }
        
        let decoded = decodeURIComponent(f);
        if (f !== decoded) {
            const destPath = path.join(directory, decoded);
            const destDir = path.dirname(destPath);
            
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            
            fs.renameSync(fullPath, destPath);
            console.log(`Renamed: ${f} -> ${decoded}`);
        }
    }
}

decodeAndMove(dir);
console.log("Done renaming files.");
