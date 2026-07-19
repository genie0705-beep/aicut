const fs = require('fs');
const h = fs.readFileSync('C:/Users/paul/.openclaw/workspace/memorial_admin.html', 'utf-8');
const lines = h.split('\n');

// Find the nav-list in HTML (sidebar section)
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('class="nav-list"') || (lines[i].includes('nav-list') && lines[i].includes('<nav'))) {
    console.log('=== nav-list HTML 시작 L' + (i+1) + ' ===');
    for (let j = i; j < Math.min(i + 30, lines.length); j++) {
      console.log('L' + (j+1) + ': ' + lines[j].trim());
      if (lines[j].includes('</nav>')) break;
    }
    break;
  }
}
