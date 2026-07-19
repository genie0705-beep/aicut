const fs = require('fs');
const html = fs.readFileSync('C:/Users/paul/.openclaw/workspace/memorial_admin_logs.html', 'utf-8');
const lines = html.split('\n');

// Find dashboard section and kpi-grid area
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('data-page="dashboard"')) {
    console.log(`=== 대시보드 섹션 시작 L${i+1} ===`);
    // Show next 40 lines to find kpi-grid and where location status card starts
    for (let j = i; j < Math.min(i+60, lines.length); j++) {
      console.log(`L${j+1}: ${lines[j].trim().substring(0, 130)}`);
    }
    break;
  }
}
