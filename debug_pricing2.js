const fs = require('fs');
const h = fs.readFileSync('aicut_full.html', 'utf8');

// Find the total file size
console.log('File size:', h.length);

// Find key markers with their surrounding structure
const markers = [
  'id="mainNav"',
  'id="page-home"',
  'id="page-pricing"',
  'id="page-client"',
  'id="page-admin"',
  'id="b2bModal"',
  'id="loginModal"',
  '<footer>',
  '</body>'
];

markers.forEach(m => {
  const idx = h.indexOf(m);
  if (idx > -1) {
    const snippet = h.slice(Math.max(0, idx-20), idx + 80).replace(/\n/g, ' ').trim();
    console.log(m + ' at byte ' + idx + ': ' + snippet.slice(0, 120));
  }
});

// Find all occurrences of page-pricing and page-home
const allMarkers = [];
const searchItems = ['page-home', 'page-pricing', 'page-client', 'page-admin'];
searchItems.forEach(item => {
  let pos = 0;
  const refs = [];
  while (true) {
    const idx = h.indexOf(item, pos);
    if (idx === -1) break;
    const line = h.slice(0, idx).split('\n').length;
    const snippet = h.slice(Math.max(0, idx-30), idx+30).replace(/\n/g, ' ').trim();
    refs.push({ byte: idx, line, snippet });
    pos = idx + 1;
  }
  console.log('\n' + item + ' (' + refs.length + ' occurrences):');
  refs.forEach(r => {
    console.log('  byte=' + r.byte + ' line=' + r.line + ' ...' + r.snippet.slice(-60));
  });
});
