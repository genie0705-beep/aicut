const fs = require('fs');
const html = fs.readFileSync('C:/Users/paul/.openclaw/workspace/memorial_admin_logs.html', 'utf-8');
const lines = html.split('\n');
const total = lines.length;
for (let i = total-10; i < total; i++) {
  console.log(`L${i+1}: ${lines[i]}`);
}
