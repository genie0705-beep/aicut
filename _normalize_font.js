const fs = require('fs');
let html = fs.readFileSync('C:/Users/paul/.openclaw/workspace/memorial_admin.html', 'utf-8');

// 1. Add CSS variables to :root
html = html.replace(
  ':root{',
  ':root{\n    --text-xs: 11px;\n    --text-sm: 12px;\n    --text-base: 13px;\n    --text-md: 14px;\n    --text-lg: 16px;\n    --text-xl: 20px;'
);

// 2. Font-size mapping
const pxMap = [
  [6, 11], [7, 11], [8, 11], [9, 11], [9.5, 11],
  [10, 11], [10.5, 11],
  [11.5, 11],
  [12.5, 12],
  [13.5, 13],
  [15, 14],
  [17, 16],
  [18, 16],
  [19, 20],
  [22, 20], [23, 20]
];

pxMap.forEach(([oldV, newV]) => {
  const re = new RegExp(`font-size\\s*:\\s*${oldV}\\.?\\d*px`, 'g');
  html = html.replace(re, `font-size: ${newV}px`);
});

// 3. Replace CSS class definitions with CSS variables
const styleStart = html.indexOf('<style>');
const styleEnd = html.indexOf('</style>');
const beforeStyle = html.substring(0, styleStart);
const styleContent = html.substring(styleStart, styleEnd);
const afterStyle = html.substring(styleEnd);

let newCss = styleContent;

const cssReplacements = [
  [/\\.kpi-label\\s*\\{([^}]*?)font-size\\s*:\\s*\\d+\\.?\\d*px/g, '.kpi-label{$1font-size: var(--text-sm)'],
  [/\\.kpi-value\\s*\\{([^}]*?)font-size\\s*:\\s*\\d+\\.?\\d*px/g, '.kpi-value{$1font-size: var(--text-xl)'],
  [/\\.kpi-sub\\s*\\{([^}]*?)font-size\\s*:\\s*\\d+\\.?\\d*px/g, '.kpi-sub{$1font-size: var(--text-xs)'],
  [/\\.badge\\s*\\{([^}]*?)font-size\\s*:\\s*\\d+\\.?\\d*px/g, '.badge{$1font-size: var(--text-xs)'],
  [/\\.section-sub\\s*\\{([^}]*?)font-size\\s*:\\s*\\d+\\.?\\d*px/g, '.section-sub{$1font-size: var(--text-sm)'],
  [/table\\.data-table\\s+th\\s*\\{([^}]*?)font-size\\s*:\\s*\\d+\\.?\\d*px/g, 'table.data-table th{$1font-size: var(--text-xs)'],
  [/\\.nav-item\\s*\\{([^}]*?)font-size\\s*:\\s*\\d+\\.?\\d*px/g, '.nav-item{$1font-size: var(--text-md)'],
  [/\\.btn\\s*\\{([^}]*?)font-size\\s*:\\s*\\d+\\.?\\d*px/g, '.btn{$1font-size: var(--text-base)'],
  [/\\.fee-name\\s*\\{([^}]*?)font-size\\s*:\\s*\\d+\\.?\\d*px/g, '.fee-name{$1font-size: var(--text-md)'],
  [/\\.fee-sub\\s*\\{([^}]*?)font-size\\s*:\\s*\\d+\\.?\\d*px/g, '.fee-sub{$1font-size: var(--text-sm)']
];

cssReplacements.forEach(([re, replacement]) => {
  newCss = newCss.replace(re, replacement);
});

// Add font-size for td if not already present
if (!newCss.match(/table\.data-table\s+td\s*\{[^}]*?font-size/)) {
  newCss = newCss.replace(
    /table\.data-table\s+td\s*\{/,
    'table.data-table td{font-size: var(--text-base);'
  );
}

html = beforeStyle + newCss + afterStyle;

fs.writeFileSync('C:/Users/paul/.openclaw/workspace/memorial_admin.html', html, 'utf-8');
console.log('Font-size normalization complete');

// Verify: check for remaining unusual values
const allFont = html.match(/font-size:\s*\d+\.?\d*px/g);
if (allFont) {
  const unusual = allFont.filter(m => {
    const v = parseFloat(m.match(/\d+\.?\d*/)[0]);
    return ![11, 12, 13, 14, 16, 20].includes(v) && v <= 23;
  });
  if (unusual.length > 0) {
    console.log('Remaining unusual values:', [...new Set(unusual)].join(', '));
  } else {
    console.log('All values normalized to 6-step system ✅');
  }
  console.log('Total font-size declarations:', allFont.length);
}
