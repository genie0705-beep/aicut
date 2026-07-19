const fs = require('fs');
const h = fs.readFileSync('aicut_full.html', 'utf8');

// Find actual page divs in the HTML BODY (not in CSS/style)
const styleEnd = h.lastIndexOf('</style>');
console.log('Last </style> at byte', styleEnd, 'line', h.slice(0, styleEnd).split('\n').length);

// Find all page- divs AFTER the last style tag
let searchPos = styleEnd;
const pages = [];
let count = 0;
while (count < 10) {
  const idx = h.indexOf('page-', searchPos);
  if (idx === -1) break;
  // Check if it's an id attribute
  const before = h.slice(Math.max(0, idx - 5), idx);
  if (before.includes('id="') || before.includes("id='")) {
    const endQuote = h.indexOf('"', h.indexOf('"', idx));
    const id = h.slice(idx, h.indexOf('"', idx));
    if (id.startsWith('page-')) {
      const line = h.slice(0, idx).split('\n').length;
      pages.push({ id, byte: idx - 5, line });
    }
  }
  searchPos = idx + 1;
  count++;
}

console.log('\nPage divs in body:');
pages.forEach(p => console.log('  ' + p.id + ' at byte ' + p.byte + ', line ' + p.line));

// Get content between pages
for (let i = 0; i < pages.length - 1; i++) {
  const start = pages[i].byte;
  const end = pages[i + 1].byte;
  const content = h.slice(start, end);
  console.log('\n--- ' + pages[i].id + ' (' + (content.length/1024).toFixed(0) + 'KB) ---');
  console.log('  Starts:', content.slice(0, 100).replace(/\n/g, ' ').trim());
  console.log('  Ends:', content.slice(-100).replace(/\n/g, ' ').trim());
}

// Also find sections within page-home
console.log('\n\n=== Key Sections in page-home ===');
const keySections = ['service-section', 'vfx-section', 'steps-section', 'reviews-section', 'faq-section'];
keySections.forEach(id => {
  const idx = h.indexOf('id="' + id + '"');
  if (idx === -1) {
    console.log(id + ': NOT FOUND');
    return;
  }
  const line = h.slice(0, idx).split('\n').length;
  // Find section tag
  const sectionStart = h.lastIndexOf('<section', idx);
  const sectionEnd = h.indexOf('</section>', idx) + 10;
  if (sectionStart > -1 && sectionEnd > sectionStart) {
    const sectionHtml = h.slice(sectionStart, sectionEnd);
    console.log('\n' + id + ' at line ' + line + ' (' + (sectionHtml.length/1024).toFixed(0) + 'KB)');
    console.log('  Opens:', sectionHtml.slice(0, 120).replace(/\n/g, ' ').trim());
    console.log('  Closes:', sectionHtml.slice(-80).replace(/\n/g, ' ').trim());
  }
});
