const fs = require('fs');
const html = fs.readFileSync('C:/Users/paul/.openclaw/workspace/memorial_admin.html', 'utf-8');
const lines = html.split('\n');

// Read the specific lines we need for exact replacement
const neededLines = [604, 664, 672, 682, 698, 851, 879, 981, 999, 1011, 1147, 1194, 1213, 1243, 1262, 1293, 1300, 1379, 1383, 1393, 1413, 1463, 1477, 1488, 1529, 1533, 1548, 1570, 1581, 1616, 1702, 1729, 1775, 1816, 1854, 1873, 1891, 1903];

neededLines.forEach(ln => {
  if (ln <= lines.length) {
    console.log(`L${ln}: ${lines[ln-1]}`);
  }
});
