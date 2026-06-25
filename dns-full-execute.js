const { chromium } = require('playwright');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const dnsPage = browser.contexts()[0].pages().find(p => p.url().includes('app.hosting.kr') && p.url().includes('dns'));
  const firebasePage = browser.contexts()[0].pages().find(p => p.url().includes('console.firebase.google.com') && p.url().includes('domains'));
  
  if (!dnsPage) { console.error('DNS page not found!'); await browser.close(); return; }
  
  // Auto-accept dialogs
  dnsPage.on('dialog', async dialog => {
    console.log(`📋 Dialog: "${dialog.message().slice(0, 120)}" => Accept`);
    await dialog.accept();
  });
  
  await sleep(1500);
  
  // =============================================
  // STEP 0: Identify check/save and cancel/X buttons for the two inline forms
  // =============================================
  console.log('\n=== STEP 0: Identify form buttons ===');
  
  const formButtonsDetail = await dnsPage.evaluate(() => {
    const results = [];
    // Get the full SVG path data for the icons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      const rect = btn.getBoundingClientRect();
      const y = Math.round(rect.y);
      if (y >= 930 && y <= 1080 && rect.width >= 20) {
        // Find SVG inside
        const svg = btn.querySelector('svg');
        let pathData = '';
        let svgColor = '';
        if (svg) {
          svgColor = svg.getAttribute('color') || '';
          const paths = svg.querySelectorAll('path');
          paths.forEach(p => { pathData += (p.getAttribute('d') || '').slice(0, 50) + ' | '; });
        }
        const classStr = typeof btn.className === 'string' ? btn.className.slice(0, 80) : '';
        results.push({ y, x: Math.round(rect.x), w: Math.round(rect.width), h: Math.round(rect.height), class: classStr, svgColor, paths: pathData.slice(0, 100) });
      }
    });
    return results;
  });
  
  console.log('Form buttons:');
  for (const fb of formButtonsDetail) {
    console.log(`  @(${fb.x},${fb.y}) ${fb.w}x${fb.h} color=${fb.svgColor} paths="${fb.paths}"`);
  }
  
  // Identify the checkmark icon - look for SVG with checkmark path
  const checkIcons = await dnsPage.evaluate(() => {
    const results = [];
    document.querySelectorAll('svg').forEach((svg, idx) => {
      const rect = svg.getBoundingClientRect();
      if (rect.y >= 930 && rect.y <= 1080 && rect.width >= 14) {
        const svgHtml = svg.outerHTML;
        const isCheck = svgHtml.includes('check') || svgHtml.includes('Check') || svgHtml.toLowerCase().includes('m9.473');
        const paths = [];
        svg.querySelectorAll('path').forEach(p => paths.push(p.getAttribute('d')?.slice(0, 60)));
        results.push({ idx, y: Math.round(rect.y), x: Math.round(rect.x), w: Math.round(rect.width), h: Math.round(rect.height), isCheck, paths: paths.join(' | ') });
      }
    });
    return results;
  });
  
  console.log('\nSVG icons in form area:');
  for (const ci of checkIcons) {
    console.log(`  [${ci.idx}] @(${ci.x},${ci.y}) ${ci.w}x${ci.h} isCheck=${ci.isCheck} paths="${ci.paths}"`);
  }
  
  // Let's look at the actual HTML of the inline forms more carefully
  const formHtml = await dnsPage.evaluate(() => {
    const results = [];
    // Find the DNS record row container
    const containers = document.querySelectorAll('[class*="css-"]');
    containers.forEach((c, idx) => {
      const rect = c.getBoundingClientRect();
      const y = Math.round(rect.y);
      if (y >= 920 && y <= 1000 && rect.width > 100) {
        results.push({ idx, tag: c.tagName, y, text: c.textContent.trim().slice(0, 200), className: (typeof c.className === 'string' ? c.className.slice(0, 60) : '') });
      }
    });
    return results;
  });
  
  console.log('\nContainer elements in y=920..1000:');
  for (const el of formHtml) {
    console.log(`  [${el.idx}] ${el.tag} y=${el.y}: "${el.text}" class="${el.className}"`);
  }
  
  await browser.close();
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
