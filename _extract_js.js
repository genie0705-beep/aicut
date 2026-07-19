const fs = require('fs');
const html = fs.readFileSync('C:/Users/paul/.openclaw/workspace/memorial_admin_logs.html', 'utf-8');

// Extract JS between <script> tags
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let allJs = '';
let count = 0;

while ((match = scriptRegex.exec(html)) !== null) {
  allJs += match[1] + '\n';
  count++;
}

console.log(`Found ${count} script blocks, total ${allJs.length} chars`);

// Write to temp file for syntax check
fs.writeFileSync('C:/Users/paul/.openclaw/workspace/_temp_check.js', allJs);
console.log('Written to _temp_check.js for syntax validation');
