const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  const fe = await page.$('#mainFrame');
  const f = await fe.contentFrame();
  
  for (let i = 0; i < 30; i++) {
    const ok = await f.evaluate(() => typeof SmartEditor?._editors?.['blogpc001'] !== 'undefined');
    if (ok) break;
    await page.waitForTimeout(1000);
  }
  
  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  
  // 글감 제거 후 새로 typing해서 text component 구조 확인
  await f.evaluate(() => {
    const w = document.querySelector('.se-components-wrap');
    if (w) w.innerHTML = '';
  });
  await page.waitForTimeout(500);
  
  // focus + type
  await f.evaluate(() => {
    try { SmartEditor._editors['blogpc001']._canvasScrollingService?.focusFirstText(); } catch(e) {}
  });
  await page.waitForTimeout(1000);
  await page.keyboard.type('테스트 문장입니다.', { delay: 20 });
  await page.waitForTimeout(1000);
  
  // text component 상세 분석
  const textComp = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const doc = ed.getDocumentData().document;
    const textComps = doc.components.filter(c => c['@ctype'] === 'text' || c.type === 'text');
    
    if (textComps.length === 0) return { error: 'no text component', allCompKeys: doc.components.map(c => Object.keys(c)) };
    
    const tc = textComps[0];
    return {
      allKeys: Object.keys(tc),
      type: tc.type,
      ctype: tc['@ctype'],
      // 모든 값
      full: JSON.parse(JSON.stringify(tc)),
    };
  });
  
  console.log('Text Component 구조:', JSON.stringify(textComp, null, 2));
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));
