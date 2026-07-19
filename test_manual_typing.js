const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  
  // Wait for SE
  const fe = await page.$('#mainFrame');
  const f = await fe.contentFrame();
  for (let i = 0; i < 30; i++) {
    const ok = await f.evaluate(() => typeof SmartEditor?._editors?.['blogpc001'] !== 'undefined');
    if (ok) break;
    await page.waitForTimeout(1000);
  }
  
  // Popup cleanup
  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  
  // 글감 제거
  await f.evaluate(() => {
    const w = document.querySelector('.se-components-wrap');
    if (w) w.innerHTML = '';
  });
  await page.waitForTimeout(500);
  
  // Focus + type a simple word
  await f.evaluate(() => {
    try {
      SmartEditor._editors['blogpc001']._canvasScrollingService?.focusFirstText();
    } catch(e) {}
  });
  await page.waitForTimeout(1000);
  
  // Type '테스트' in English = 'test'
  await page.keyboard.type('테스트 문장입니다.', { delay: 20 });
  await page.waitForTimeout(1000);
  
  // Check data model
  const data = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const doc = ed.getDocumentData().document;
    return {
      keys: Object.keys(doc),
      blocksCount: doc.blocks?.length || 0,
      firstBlock: doc.blocks?.[0] ? { keys: Object.keys(doc.blocks[0]), type: doc.blocks[0].type, text: (doc.blocks[0].text || '').substring(0, 30) } : null,
      compsCount: doc.components?.length || 0,
      compTypes: doc.components?.map(c => c.type || c['@ctype'] || 'unknown') || [],
    };
  });
  
  console.log('직접 타이핑 후 데이터:', JSON.stringify(data, null, 2));
  
  // Check canvas
  const canvas = await f.evaluate(() => {
    const c = document.querySelector('.se-canvas');
    return {
      text: (c?.innerText || '').substring(0, 50),
      imgs: c?.querySelectorAll('img').length || 0,
    };
  });
  console.log('canvas:', JSON.stringify(canvas));
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));
