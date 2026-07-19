const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0] || await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  console.log('1. SE4 에디터 열기...');
  await page.goto('https://blog.naver.com/PostEditor.naver?blogId=aicut', {
    waitUntil: 'domcontentloaded', timeout: 20000
  });
  await page.waitForTimeout(5000);

  const url = page.url();
  console.log(`URL: ${url}`);

  if (url.includes('nid.naver.com') || url.includes('login')) {
    console.log('❌ 로그인 필요');
    return;
  }

  // 페이지 구조 분석
  console.log('\n2. 페이지 구조 분석...');
  const frameInfo = await page.evaluate(() => {
    // Check all frames/iframes
    const frames = document.querySelectorAll('iframe');
    const frameList = [];
    frames.forEach((f, i) => {
      frameList.push({
        index: i,
        id: f.id || '(none)',
        name: f.name || '(none)',
        src: (f.src || '').substring(0, 100),
        title: f.title || '(none)'
      });
    });
    
    // Check if SmartEditor exists globally
    const hasSE = typeof SmartEditor !== 'undefined';
    const hasEditor = document.querySelector('.se-editor, .se-canvas, [class*="smart"]') !== null;
    
    return { frameCount: frames.length, frames: frameList, hasSmartEditor: hasSE, hasEditorElements: hasEditor };
  });

  console.log(`  iframe 수: ${frameInfo.frameCount}`);
  console.log(`  SmartEditor 전역: ${frameInfo.hasSmartEditor}`);
  console.log(`  에디터 DOM 요소: ${frameInfo.hasEditorElements}`);
  frameInfo.frames.forEach(f => console.log(`  [${f.index}] id="${f.id}" name="${f.name}" src="${f.src}"`));

  // Check if there's a different SmartEditor in post editor page
  // New Naver blog may use PostEditor.naver with different structure
  console.log('\n3. 페이지 전체 텍스트 확인...');
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log(bodyText);

  // Try accessing iframe
  console.log('\n4. iframe 내 SmartEditor 확인...');
  const frames = page.frames();
  console.log(`  Playwright 프레임 수: ${frames.length}`);
  
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    try {
      const hasSE = await f.evaluate(() => typeof SmartEditor !== 'undefined');
      const hasSE2 = await f.evaluate(() => typeof smartEditor !== 'undefined');
      const title = await f.evaluate(() => document.title || '');
      const isEditor = title.includes('스마트에디터') || title.includes('SE') || title.includes('editor');
      
      if (hasSE || hasSE2 || isEditor) {
        console.log(`  프레임[${i}]: SmartEditor=${hasSE}, smartEditor=${hasSE2}, title="${title.substring(0,50)}"`);
        
        // Try setDocumentTitle
        const result = await f.evaluate(() => {
          try {
            const se = SmartEditor;
            const keys = Object.keys(se);
            return { keys: keys.slice(0, 10), editorCount: Object.keys(se._editors || {}).length };
          } catch(e) {
            return { error: e.message };
          }
        });
        console.log(`  SmartEditor 정보:`, JSON.stringify(result));
      }
    } catch(e) {
      // Cross-origin iframe
    }
  }

  console.log('\n=== 분석 완료 ===');
})();
