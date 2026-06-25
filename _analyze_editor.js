const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  
  // Close existing editor tabs
  for (const p of ctx.pages()) {
    if (p.url().includes('PostWriteForm')) await p.close();
  }
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  console.log('=== SMARTEDITOR DOM 분석 ===\n');
  
  // 1. All buttons analysis
  console.log('--- 모든 버튼 목록 ---');
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map((btn, i) => ({
      idx: i,
      text: (btn.innerText || '').trim().substring(0, 30),
      classes: (btn.className || '').substring(0, 60),
      ariaLabel: btn.getAttribute('aria-label') || '',
      visible: btn.offsetHeight > 0 && btn.offsetWidth > 0,
      rect: (() => { const r = btn.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })()
    })).filter(b => b.visible);
  });
  
  buttons.forEach(b => console.log(`  [${b.idx}] "${b.text}" | class:${b.classes} | aria:${b.ariaLabel} | pos:(${b.rect.x},${b.rect.y}) ${b.rect.w}x${b.rect.h}`));
  
  // 2. File inputs
  console.log('\n--- File inputs ---');
  const fileInputs = await page.evaluate(() => {
    const all = document.querySelectorAll('input[type="file"]');
    return Array.from(all).map((inp, i) => ({
      idx: i,
      id: inp.id,
      display: inp.style.display,
      visible: inp.offsetHeight > 0,
      parent: (inp.parentElement?.tagName || '') + '.' + (inp.parentElement?.className || '').substring(0, 40),
      rect: (() => { const r = inp.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })()
    }));
  });
  if (fileInputs.length === 0) {
    console.log('  ❌ File inputs 없음');
  } else {
    fileInputs.forEach(f => console.log(`  [${f.idx}] id:${f.id} | visible:${f.visible} | pos:(${f.rect.x},${f.rect.y}) ${f.rect.w}x${f.rect.h} | parent:${f.parent}`));
  }
  
  // 3. All iframes
  console.log('\n--- Iframes ---');
  const iframes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('iframe')).map((f, i) => ({
      idx: i,
      id: f.id,
      src: (f.src || '').substring(0, 80),
      visible: f.offsetHeight > 0,
      rect: (() => { const r = f.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })()
    }));
  });
  iframes.forEach(f => console.log(`  [${f.idx}] id:${f.id} | src:${f.src} | pos:(${f.rect.x},${f.rect.y}) ${f.rect.w}x${f.rect.h}`));
  
  // 4. 사진 버튼 click test
  console.log('\n--- 사진 버튼 클릭 테스트 ---');
  const clickResult = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const text = (btn.innerText || '').trim();
      if (text.startsWith('사진')) {
        btn.click();
        return { text: text.substring(0, 20), found: true };
      }
    }
    // Also check aria-label
    for (const btn of btns) {
      const aria = (btn.getAttribute('aria-label') || '');
      if (aria.includes('사진') || aria.includes('image') || aria.includes('photo')) {
        btn.click();
        return { text: aria.substring(0, 20), found: true, via: 'aria' };
      }
    }
    return { found: false };
  });
  console.log('  사진 버튼 클릭:', clickResult.found ? clickResult.text : '❌');
  
  await page.waitForTimeout(3000);
  
  // After click analysis
  console.log('\n--- 클릭 후 새로 생긴 요소 ---');
  const afterClick = await page.evaluate(() => {
    // Check for any panels/sections/overlays
    const results = [];
    
    // Check for new buttons
    const btns = document.querySelectorAll('button');
    btns.forEach((btn, i) => {
      const text = (btn.innerText || '').trim();
      const r = btn.getBoundingClientRect();
      if (text && r.width > 0 && r.height > 0) {
        results.push({ type: 'button', text: text.substring(0, 25), pos: `${Math.round(r.x)},${Math.round(r.y)} ${r.width}x${r.height}` });
      }
    });
    
    // Check for file inputs again
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach(inp => {
      const r = inp.getBoundingClientRect();
      results.push({ type: 'file_input', id: inp.id, pos: `${Math.round(r.x)},${Math.round(r.y)} ${r.width}x${r.height}` });
    });
    
    // Check for upload-related elements
    const uploadEls = document.querySelectorAll('[class*="upload"], [class*="editor"], [class*="photo"], [class*="image"], [class*="file"]');
    uploadEls.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        results.push({ type: el.tagName, class: (el.className || '').substring(0, 50), pos: `${Math.round(r.x)},${Math.round(r.y)} ${r.width}x${r.height}` });
      }
    });
    
    return results;
  });
  afterClick.forEach(item => console.log(`  ${item.type} | text:${item.text || ''} | class:${item.class || ''} | id:${item.id || ''} | pos:${item.pos}`));
  
  if (afterClick.length === 0) {
    console.log('  새로 생긴 요소 없음');
    
    // Try checking SmartEditor internal state
    const editorState = await page.evaluate(() => {
      if (typeof SmartEditor === 'undefined') return 'SmartEditor undefined';
      const editors = SmartEditor._editors || {};
      const keys = Object.keys(editors);
      return { editorsAvailable: keys.length > 0, keys: keys.slice(0, 5) };
    });
    console.log('  SmartEditor state:', JSON.stringify(editorState));
  }
  
  // 5. 해시태그 입력창 찾기
  console.log('\n--- 해시태그 입력창 ---');
  const hashResult = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    const results = [];
    inputs.forEach((inp, i) => {
      const ph = (inp.placeholder || '');
      const name = inp.name || '';
      const id = inp.id || '';
      const cls = (inp.className || '').substring(0, 40);
      const r = inp.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        results.push({ idx: i, placeholder: ph.substring(0, 20), name: name.substring(0, 20), id: id.substring(0, 20), class: cls, pos: `${Math.round(r.x)},${Math.round(r.y)} ${r.width}x${r.height}` });
      }
    });
    return results;
  });
  hashResult.forEach(h => console.log(`  [${h.idx}] placeholder:"${h.placeholder}" | name:${h.name} | id:${h.id} | class:${h.class} | pos:${h.pos}`));
  if (hashResult.length === 0) console.log('  visible input 없음');
  
  // Take screenshot
  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\blog_editor_analyze.png' });
  
  console.log('\n=== 분석 완료 ===');
  await browser.close();
})();
