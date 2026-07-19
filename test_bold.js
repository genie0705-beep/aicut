const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => { await d.dismiss(); });
  
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  const fe = await page.$('#mainFrame');
  const f = await fe.contentFrame();
  
  // Wait for SE
  for (let i = 0; i < 20; i++) {
    const ok = await f.evaluate(() => typeof SmartEditor?._editors?.['blogpc001'] !== 'undefined');
    if (ok) break;
    await page.waitForTimeout(1000);
  }
  
  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  await f.waitForTimeout(500);
  
  // 글감 제거
  await f.evaluate(() => {
    const wrap = document.querySelector('.se-components-wrap');
    if (wrap) wrap.innerHTML = '';
  });
  await f.waitForTimeout(500);
  
  // BOLD 테스트: SE4의 native formatting 사용
  // SetDocumentData로 bold 포함 텍스트 설정
  await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    data.document.blocks = [
      { type: 'paragraph', text: '일반 텍스트입니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '<b>볼드 텍스트입니다.</b>', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '<b>볼드</b>와 일반 혼합입니다.', style: { textAlign: 'center' } },
    ];
    ed.setDocumentData(data);
  });
  await f.waitForTimeout(1000);
  
  // blocks 검사
  const blocksWithBold = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const blocks = data.document.blocks;
    return blocks.map(b => ({
      type: b.type,
      text: (b.text || '').substring(0, 50),
      hasBold: (b.text || '').includes('<b>'),
      textEscaped: (b.text || '').includes('&lt;b&gt;'),
    }));
  });
  
  console.log('blocks with bold:', JSON.stringify(blocksWithBold, null, 2));
  
  // Canvas HTML도 확인
  const canvasHTML = await f.evaluate(() => {
    const c = document.querySelector('.se-canvas');
    if (!c) return 'no canvas';
    const wrap = c.querySelector('.se-components-wrap');
    if (!wrap) return 'no wrap';
    return Array.from(wrap.children).slice(0, 3).map(el => ({
      outer: el.outerHTML.substring(0, 200),
      innerText: (el.innerText || '').substring(0, 50),
    }));
  });
  
  console.log('\ncanvas 구조:', JSON.stringify(canvasHTML, null, 2));
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));
