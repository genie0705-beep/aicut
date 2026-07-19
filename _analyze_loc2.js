const fs = require('fs');
const html = fs.readFileSync('C:/Users/paul/.openclaw/workspace/memorial_admin_logs.html', 'utf-8');
const lines = html.split('\n');

// Find buildLocationGrid function body (include click events)
for (let i = 2190; i < Math.min(2300, lines.length); i++) {
  if (lines[i].includes('loc-cell') || lines[i].includes('click') || lines[i].includes('mouseenter') || 
      lines[i].includes('loc-detail') || lines[i].includes('dp-') || lines[i].includes('showLoc') ||
      lines[i].includes('}') && i > 2200) {
    console.log(`L${i+1}: ${lines[i].trim().substring(0, 120)}`);
  }
}

// Find the end of buildLocationGrid
console.log('\n=== buildLocationGrid end ===');
for (let i = 2190; i < Math.min(2600, lines.length); i++) {
  if (lines[i].includes('function showLocation') || lines[i].includes('function openLocDetail') || 
      lines[i].includes('function closeLocDetail') || lines[i].includes('function toggleSection')) {
    console.log(`L${i+1}: ${lines[i].trim().substring(0, 120)}`);
  }
}
