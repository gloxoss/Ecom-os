const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/sections/home-view.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace multiline strings inside style={{...}} with single line strings
// Webflow inline styles typically contain 'translate3d(.... \n rotateX...)'
content = content.replace(/style=\{\{(.*?)\}\}/gs, (match, p1) => {
  // Remove newlines inside the style object
  const cleaned = p1.replace(/\r?\n\s*/g, ' ');
  return `style={{${cleaned}}}`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed inline styles in home-view.tsx');
