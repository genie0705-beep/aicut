const fs = require('fs');
const h = fs.readFileSync('aicut_full.html', 'utf8');

// Find PRICING PAGE in the BODY (after the main styles)
const lastStyleEnd = h.lastIndexOf('</style>');
const bodyContent = h.slice(lastStyleEnd);

console.log('Content after last </style>: ' + (bodyContent.length/1024).toFixed(0) + 'KB');

// Look for page-pricing div reference
const ppDiv = bodyContent.indexOf('page-pricing');
console.log('page-pricing reference at byte', ppDiv, '(relative to style end)');
if (ppDiv > -1) {
  console.log('Context:', bodyContent.slice(Math.max(0, ppDiv-20), ppDiv+100).replace(/\n/g, ' ').trim());
  // Check if it's inside a div tag
  const beforeDiv = bodyContent.slice(Math.max(0, ppDiv-80), ppDiv);
  console.log('Before:', beforeDiv.replace(/\n/g, ' ').trim());
}

// Also look for the complete page-pricing div in the original HTML
// It might be referenced inside a <script> template or inline
const allPpRefs = [];
let pos = 0;
while (true) {
  const idx = h.indexOf('page-pricing', pos);
  if (idx === -1) break;
  allPpRefs.push(idx);
  pos = idx + 1;
}
console.log('\nAll page-pricing references in file:');
allPpRefs.forEach(idx => {
  const snippet = h.slice(Math.max(0, idx-60), idx+80).replace(/\n/g, ' ').trim();
  console.log('  byte ' + idx + ': ' + snippet.slice(0, 150));
});
