const fs = require('fs');
const html = fs.readFileSync('C:/Users/paul/.openclaw/workspace/memorial_admin_logs.html', 'utf-8');
const lines = html.split('\n');

// Find buildLocationGrid function
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function buildLocationGrid') || 
      lines[i].includes('buildLocationGrid') ||
      lines[i].includes('loc-cell') && (lines[i].includes('addEventListener') || lines[i].includes('click'))) {
    console.log(`L${i+1}: ${lines[i].trim().substring(0, 120)}`);
  }
}

// Find loc-cell click handler area
console.log('\n=== loc-cell 관련 이벤트 ===');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('loc-cell') && (lines[i].includes('mouse') || lines[i].includes('click') || lines[i].includes('addEvent'))) {
    console.log(`L${i+1}: ${lines[i].trim().substring(0, 120)}`);
  }
}

// Find location data structure
console.log('\n=== location 데이터 ===');
for (let i = 0; i < lines.length; i++) {
  if ((lines[i].includes('locationData') || lines[i].includes('locationsData')) && lines[i].includes('{')) {
    const start = Math.max(0, i-1);
    for (let j = start; j < Math.min(i+5, lines.length); j++) {
      console.log(`L${j+1}: ${lines[j].trim().substring(0, 120)}`);
    }
    console.log('---');
    break;
  }
}

// Find location section structure
console.log('\n=== location section ===');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('data-page=\"locations\"')) {
    for (let j = i; j < Math.min(i+30, lines.length); j++) {
      console.log(`L${j+1}: ${lines[j].trim().substring(0, 120)}`);
    }
    break;
  }
}
