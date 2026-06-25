const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  let igPage = null;
  for (const p of pages) {
    if (p.url().includes('instagram.com/aicut')) {
      igPage = p; break;
    }
  }
  
  if (!igPage) {
    igPage = await ctx.newPage();
    await igPage.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'networkidle', timeout: 30000 });
    await igPage.waitForTimeout(3000);
  }
  
  await igPage.bringToFront();
  await igPage.waitForTimeout(2000);
  
  // Screenshot current page
  await igPage.screenshot({ path: 'ig_home.png' });
  console.log('Screenshot saved');
  
  // Find ALL clickable elements
  const allButtons = await igPage.evaluate(() => {
    const result = [];
    // SVG elements with aria-label
    const svgs = document.querySelectorAll('svg');
    svgs.forEach(svg => {
      const ariaLabel = svg.getAttribute('aria-label');
      if (ariaLabel) {
        const r = svg.getBoundingClientRect();
        if (r.width > 0) {
          result.push({
            type: 'svg',
            label: ariaLabel,
            x: Math.round(r.x), y: Math.round(r.y),
            w: Math.round(r.width), h: Math.round(r.height)
          });
        }
      }
    });
    
    // Look for create/upload related text
    const all = document.querySelectorAll('[role="button"], a, button, [role="menuitem"]');
    all.forEach(el => {
      const text = (el.innerText || '').trim().toLowerCase();
      const ariaLabel = el.getAttribute('aria-label') || '';
      if (text.includes('create') || text.includes('new') || text.includes('upload') || text.includes('만들기') || text.includes('새') ||
          ariaLabel.includes('create') || ariaLabel.includes('new') || ariaLabel.includes('upload')) {
        const r = el.getBoundingClientRect();
        if (r.width > 0) {
          result.push({
            type: el.tagName,
            text: (el.innerText || '').substring(0, 30),
            ariaLabel: ariaLabel.substring(0, 30),
            x: Math.round(r.x), y: Math.round(r.y)
          });
        }
      }
    });
    
    return result;
  });
  
  console.log('\n=== ALL SVG buttons ===');
  allButtons.filter(b => b.type === 'svg').forEach(b => console.log(`  "${b.label}" at (${b.x},${b.y})`));
  
  console.log('\n=== Create-related elements ===');
  allButtons.filter(b => b.type !== 'svg').forEach(b => console.log(`  ${b.text || b.ariaLabel} at (${b.x},${b.y})`));
  
  await browser.close();
})();
