const fs = require('fs');
var c = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\memorial_admin.html', 'utf8');

// Find runtime textContent assignments that could fail
var idx = 0;
var count = 0;
while ((idx = c.indexOf('.textContent', idx)) > -1 && count < 100) {
  count++;
  var ctx = c.substring(Math.max(0, idx-60), idx + 20).replace(/\n/g, ' ');
  // Only show init-level assignments (not inside function definitions)
  console.log('At', idx, ':', ctx);
  idx++;
}
