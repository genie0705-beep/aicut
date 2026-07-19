const fs = require('fs');
const html = fs.readFileSync('aicut_full.html', 'utf8');
console.log('Total size:', (html.length/1024).toFixed(0), 'KB');
console.log('');

// Title
const titleMatch = html.match(/<title>([^<]+)<\/title>/);
console.log('Title:', titleMatch ? titleMatch[1] : 'N/A');

// Meta description
const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
console.log('Meta description:', descMatch ? descMatch[1].slice(0, 100) : 'N/A');

// All section/page IDs
const idRegex = /id="([^"]+)"/g;
let match;
const ids = [];
while ((match = idRegex.exec(html)) !== null) {
  ids.push(match[1]);
}
const uniqueIds = [...new Set(ids)];
console.log('\nTotal unique IDs:', uniqueIds.length);
const keyIds = uniqueIds.filter(id => 
  id.includes('section') || id.includes('page') || id.includes('content') ||
  id.includes('main') || id.includes('modal') || id.includes('pricing') ||
  id.includes('b2b') || id.includes('login') || id.includes('faq')
);
console.log('Key IDs:', keyIds.join(', '));

// showPage calls
const showPageRegex = /showPage\('([^']+)'/g;
const showPages = [];
while ((match = showPageRegex.exec(html)) !== null) {
  showPages.push(match[1]);
}
console.log('\nshowPage virtual pages:', [...new Set(showPages)]);

// showTab calls
const showTabRegex = /showTab\('([^']+)','([^']+)'/g;
const tabs = [];
while ((match = showTabRegex.exec(html)) !== null) {
  tabs.push(match[1] + '/' + match[2]);
}
const uniqueTabs = [...new Set(tabs)];
console.log('showTab contexts:', uniqueTabs.slice(0, 15));

// Mobile navigation - scroll destinations (section-based pages)
const scrollRegex = /scrollTo_\('#([^']+)'\)/g;
const scrollTargets = [];
while ((match = scrollRegex.exec(html)) !== null) {
  scrollTargets.push(match[1]);
}
console.log('\nScroll-to sections:', [...new Set(scrollTargets)]);

// Main divs structure
const mainDivs = html.match(/<div[^>]*id="(app|root|main|container|wrap|wrapper)"[^>]*>/g);
console.log('\nMain containers:', mainDivs ? mainDivs.slice(0, 5) : 'none found');

// Key content sections
const contentSections = [
  'service-section', 'vfx-section', 'process-section', 'steps-section',
  'reviews-section', 'pricing-section', 'faq-section', 'contact-section',
  'b2b-modal', 'login-modal', 'register-modal', 'legal-modal'
];
contentSections.forEach(id => {
  const regex = new RegExp(`id="${id}"`);
  const found = regex.test(html);
  if (found) {
    // Get surrounding context
    const idx = html.search(regex);
    const snippet = html.slice(Math.max(0, idx - 50), idx + 100);
    console.log(`\nSection "${id}": FOUND`);
    console.log('  Context:', snippet.replace(/\n/g, ' ').trim().slice(0, 200));
  }
});

// Number of script tags and style tags
const scriptCount = (html.match(/<script/g) || []).length;
const styleCount = (html.match(/<style/g) || []).length;
const linkCSS = (html.match(/<link[^>]*rel="stylesheet"/g) || []).length;
console.log(`\n\nScripts: ${scriptCount}, Styles: ${styleCount}, External CSS: ${linkCSS}`);

console.log('\n--- Analysis complete ---');
