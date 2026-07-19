const fs = require('fs');
const h = fs.readFileSync('C:/Users/paul/.openclaw/workspace/memorial_admin.html', 'utf-8');
const lines = h.split('\n');

// Find newcontract section and form div
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('data-page="newcontract"')) {
    console.log('=== newcontract section L' + (i+1) + ' ===');
    for (let j = i; j < Math.min(i+30, lines.length); j++) {
      console.log('L' + (j+1) + ': ' + lines[j].trim());
    }
    break;
  }
}
