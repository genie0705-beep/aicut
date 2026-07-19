const fs = require('fs');
const h = fs.readFileSync('C:/Users/paul/.openclaw/workspace/memorial_admin.html', 'utf-8');
const lines = h.split('\n');

// Find renderRMSchedule function
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function renderRMSchedule')) {
    for (let j = i; j < Math.min(i+60, lines.length); j++) {
      const line = lines[j].trim();
      if (line.includes('empty') || line.includes('없습니다') || line.includes('schedule') || line.includes('innerHTML') && line.includes('700')) {
        console.log('L'+(j+1)+':', line.substring(0, 150));
      }
    }
    break;
  }
}

console.log('\n=== rm-overdue-list ===');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('rm-overdue-list.innerHTML')) {
    console.log('L'+(i+1)+':', lines[i].trim());
  }
}

console.log('\n=== contract-table empty ===');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('contract-table') && lines[i].includes('tbody') && (lines[i].includes('No') || lines[i].includes('없습니다'))) {
    console.log('L'+(i+1)+':', lines[i].trim());
  }
}
