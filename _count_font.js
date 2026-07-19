const fs = require('fs');
let html = fs.readFileSync('C:/Users/paul/.openclaw/workspace/memorial_admin.html', 'utf-8');

// Count inline font-size occurrences
const inlineMatches = html.match(/font-size:\s*\d+\.?\d*px/g);
if (inlineMatches) {
  const counts = {};
  inlineMatches.forEach(m => {
    const val = m.match(/\d+\.?\d*px/)[0];
    counts[val] = (counts[val] || 0) + 1;
  });
  console.log('Inline font-size counts:');
  Object.entries(counts).sort((a,b) => parseFloat(a[0]) - parseFloat(b[0])).forEach(([k,v]) => {
    console.log(`  ${k}: ${v}개`);
  });
  console.log(`\nTotal: ${inlineMatches.length}개`);
}

// Count CSS font-size occurrences (in style block)
const styleStart = html.indexOf('<style>');
const styleEnd = html.indexOf('</style>');
const css = html.substring(styleStart, styleEnd);
const cssMatches = css.match(/font-size:\s*\d+\.?\d*px/g);
if (cssMatches) {
  console.log(`\nCSS font-size: ${cssMatches.length}개`);
  cssMatches.forEach(m => console.log(`  ${m}`));
}
