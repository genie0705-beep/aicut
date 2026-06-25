const fs = require('fs');
var c = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\memorial_admin.html', 'utf8');

var marker = "open-contract-modal').addEventListener('click', function(){ openModal('contract-modal'); });";
var idx = c.indexOf(marker);
if (idx === -1) { console.log('Marker not found'); process.exit(1); }

var rest = c.substring(idx + marker.length);
var lines = rest.split('\n');

// lines[0-2] are blank, lines[3] = '    return;', lines[4] = '  }'
// These are orphaned - skip them
// The actual handler content starts at line 5

// Build the fixed content
var fix = '\n\n';
fix += "document.getElementById('submit-contract').addEventListener('click', function(){\n";
for (var i = 5; i < lines.length; i++) {
  // Skip the final closing </script> line if we hit it
  if (lines[i].indexOf('</script>') > -1) break;
  fix += lines[i] + '\n';
}
fix += '});\n';

c = c.substring(0, idx + marker.length) + fix;

fs.writeFileSync('C:\\Users\\paul\\.openclaw\\workspace\\memorial_admin.html', c, 'utf8');
console.log('Fixed submit-contract handler');
