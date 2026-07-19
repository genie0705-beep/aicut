const fs = require('fs');
const html = fs.readFileSync('C:/Users/paul/.openclaw/workspace/memorial_admin_logs.html', 'utf-8');
const lines = html.split('\n');

// topbar 영역 찾기 (375~420 라인 근처)
for (let i = 380; i < Math.min(420, lines.length); i++) {
  console.log(`L${i+1}: ${lines[i]}`);
}
