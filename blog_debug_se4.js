const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const context = browser.contexts()[0];
  let page = context.pages().find(p => p.url().includes('PostWriteForm'));
  if (!page) {
    page = await context.newPage();
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
  }
  
  // Deep dive: explore SE4 SmartEditor internal structure
  const info = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const edKeys = Object.keys(ed);
    
    // Find canvas service
    const canvasRelated = edKeys.filter(k => 
      k.toLowerCase().includes('canvas') || 
      k.toLowerCase().includes('scroll') ||
      k.toLowerCase().includes('focus')
    );
    
    // Check for internal APIs
    const internalAPIs = [];
    for (const key of edKeys) {
      if (typeof ed[key] === 'object' && ed[key] !== null) {
        const subKeys = Object.keys(ed[key]).filter(sk => typeof ed[key][sk] === 'function');
        if (subKeys.length > 0) {
          internalAPIs.push({ key, methods: subKeys.slice(0, 15) });
        }
      }
    }
    
    return {
      keys: edKeys.slice(0, 40),
      canvasRelated,
      internalAPIs: internalAPIs.slice(0, 10),
      editorType: ed.constructor?.name,
    };
  });
  
  console.log('=== EDITOR STRUCTURE ===');
  console.log('Type:', info.editorType);
  console.log('\nAll keys (first 40):');
  info.keys.forEach(k => console.log('  ' + k));
  console.log('\nCanvas/focus related:', info.canvasRelated);
  console.log('\nInternal APIs with methods:');
  info.internalAPIs.forEach(api => {
    console.log('  ' + api.key + ':');
    api.methods.forEach(m => console.log('    - ' + m));
  });
})();
