const fs = require('fs');

let html = fs.readFileSync('C:/Users/paul/.openclaw/workspace/public/index.html', 'utf8');

// Change nav links: /pricing -> #pricing, /service -> #service
// But keep /#steps-section and /#reviews-section as they are (section scrolls)

// Lines from nav section - only change specific nav links, not section anchors
const navReplacements = [
  // Logo (goes to home)
  { from: '<div class="nav-logo" href="/"', to: '<div class="nav-logo" href="#home"' },
  // Service main link
  { from: '<a href="/service" style="cursor:pointer">\n        <span data-i18n="nav_service">서비스</span>', 
    to: '<a href="#service" style="cursor:pointer">\n        <span data-i18n="nav_service">서비스</span>' },
  // Service dropdown items
  { from: '<a href="/service" style="cursor:pointer">\n          <span class="dd-icon">✂️</span>',
    to: '<a href="#service" style="cursor:pointer">\n          <span class="dd-icon">✂️</span>' },
  // Pricing
  { from: '<a href="/pricing" style="cursor:pointer" data-i18n="nav_pricing">요금제</a>',
    to: '<a href="#pricing" style="cursor:pointer" data-i18n="nav_pricing">요금제</a>' },
];

for (const r of navReplacements) {
  html = html.replace(r.from, r.to);
}

// Also update /#steps-section and /#reviews-section - keep them but ensure they still work
// These should scroll to sections on home

fs.writeFileSync('C:/Users/paul/.openclaw/workspace/public/index.html', html, 'utf8');

// Verify
const checks = {
  'pricing_hash': html.includes('href="#pricing"') && !html.includes('href="/pricing"'),
  'service_hash': html.includes('href="#service"'),
  'old_pricing_gone': !html.includes('href="/pricing"'),
  'old_service_gone': !html.includes('href="/service" style="cursor:pointer"'),
};

console.log('Verification:', JSON.stringify(checks, null, 2));

// Count nav links
const pricingLinks = (html.match(/pricing/g) || []).length;
const serviceLinks = (html.match(/href="#service"/g) || []).length;
console.log('Total #pricing references:', pricingLinks);
console.log('Total #service references:', serviceLinks);
console.log('DONE');
