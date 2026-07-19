const fs = require('fs');
const h = fs.readFileSync('C:/Users/paul/.openclaw/workspace/memorial_admin.html', 'utf-8');
const lines = h.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('location') && lines[i].includes('tab') && lines[i].includes('id=')) {
    console.log('L' + (i+1) + ': ' + lines[i].trim());
  }
}

console.log('\n=== loc-filter-tabs 찾기 ===');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('loc-filter-tabs')) {
    for (let j = Math.max(0, i-3); j < Math.min(lines.length, i+10); j++) {
      console.log('L' + (j+1) + ': ' + lines[j].trim());
    }
    console.log('---');
    break;
  }
}

console.log('\n=== full-loc-grid 찾기 ===');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('full-loc-grid')) {
    console.log('L' + (i+1) + ': ' + lines[i].trim());
    break;
  }
}
