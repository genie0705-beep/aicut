const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  
  for (const p of ctx.pages()) {
    if (p.url().includes('PostWriteForm')) await p.close();
  }
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  console.log('=== 1. 이미지 업로드 버튼 찾기 ===');
  
  // Find image upload button by class
  const imgBtnInfo = await page.evaluate(() => {
    // Try se-toolbar-item-image
    const items = document.querySelectorAll('.se-toolbar-item-image, .se-image-toolbar-button');
    const results = [];
    items.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      results.push({
        tag: el.tagName,
        class: (el.className || '').substring(0, 60),
        visible: r.width > 0,
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }
      });
    });
    
    // Try all SVG/image-related buttons
    const allSvgs = document.querySelectorAll('svg, [class*="image"], [class*="photo"], [class*="picture"]');
    allSvgs.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        results.push({
          tag: el.tagName,
          class: (el.className || '').substring(0, 60),
          aria: el.getAttribute('aria-label') || '',
          parentText: (el.parentElement?.innerText || '').trim().substring(0, 20),
          rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }
        });
      }
    });
    
    return results;
  });
  
//  imgBtnInfo.forEach((item, i) => {
//    console.log(`  [${i}] ${item.tag} | class:${item.class} | aria:${item.aria || ''} | parentText:"${item.parentText || ''}" | pos:(${item.rect.x},${item.rect.y}) ${item.rect.w}x${item.rect.h}`);
//  });
  console.log('  Found', imgBtnInfo.length, 'elements (skipping SVG className issue)');
  
  // 2. Click the image toolbar button
  console.log('\n=== 2. 이미지 툴바 버튼 클릭 후 패널 분석 ===');
  
  const clicked = await page.evaluate(() => {
    const btn = document.querySelector('.se-image-toolbar-button');
    if (btn) { btn.click(); return 'clicked se-image-toolbar-button'; }
    return 'not found';
  });
  console.log('  Click result:', clicked);
  await page.waitForTimeout(3000);
  
  // Analyze after click
  const afterClick = await page.evaluate(() => {
    const results = [];
    
    // Check for overlay/panel
    const panels = document.querySelectorAll('[class*="panel"], [class*="modal"], [class*="overlay"], [class*="popup"], [class*="dialog"]');
    panels.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        try { results.push({ tag: el.tagName, class: String(el.className || '').substring(0, 60), id: el.id || '', rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } }); } catch(e) {}
      }
    });
    
    // Check all visible buttons again
    const btns = document.querySelectorAll('button');
    btns.forEach((btn, i) => {
      const text = (btn.innerText || '').trim();
      const r = btn.getBoundingClientRect();
      if (text && r.width > 0 && r.height > 0) {
        results.push({ tag: 'BUTTON', text: text.substring(0, 30), class: String(btn.className || '').substring(0, 40), rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } });
      }
    });
    
    // Check for file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(inp => {
      const r = inp.getBoundingClientRect();
      results.push({ tag: 'INPUT[file]', id: inp.id || 'no-id', rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, display: inp.style.display });
    });
    
    // Check iframe 내부
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((f, i) => {
      const r = f.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        try { results.push({ tag: 'IFRAME', id: f.id || 'no-id', src: String(f.src || '').substring(0, 60), rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } }); } catch(e) {}
      }
    });
    
    return results;
  });
  
  console.log(`  클릭 후 발견된 요소 ${afterClick.length}개:`);
  afterClick.forEach((item, i) => {
    console.log(`  [${i}] ${item.tag} | text:"${item.text || ''}" | class:${item.class || ''} | id:${item.id || ''} | pos:(${item.rect.x},${item.rect.y}) ${item.rect.w}x${item.rect.h}${item.display ? ' | display:'+item.display : ''}${item.src ? ' | src:'+item.src : ''}`);
  });
  
  // 3. 해시태그 input 찾기 - 더 상세히
  console.log('\n=== 3. 해시태그(글감) input 상세 ===');
  const tagInfo = await page.evaluate(() => {
    // Find by placeholder
    const inputs = document.querySelectorAll('input');
    const results = [];
    inputs.forEach(inp => {
      const r = inp.getBoundingClientRect();
      results.push({
        placeholder: (inp.placeholder || ''),
        name: inp.name || '',
        id: inp.id || '',
        class: (inp.className || '').substring(0, 50),
        type: inp.type,
        visible: r.width > 0,
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }
      });
    });
    return results;
  });
  tagInfo.forEach(t => console.log(`  placeholder:"${t.placeholder}" | name:${t.name} | id:${t.id} | class:${t.class} | type:${t.type} | pos:(${t.rect.x},${t.rect.y}) ${t.rect.w}x${t.rect.h}`));
  
  // Take screenshot
  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\blog_editor_analyze2.png' });
  
  await page.waitForTimeout(2000);
  
  // Try to dismiss panel if open
  await page.mouse.click(100, 200);
  await page.waitForTimeout(1000);
  
  console.log('\n=== 분석 완료 ===');
  
  await browser.close();
})();
