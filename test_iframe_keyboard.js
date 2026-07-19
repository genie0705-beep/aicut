const { chromium } = require('playwright');

const TITLE = '피부과 영상 마케팅, 숏폼 편집 하나로 해결되는 이유 | 여름 시즌 준비';

async function waitForSE(page) {
  for (let i = 0; i < 20; i++) {
    const fe = await page.$('#mainFrame');
    if (fe) {
      const f = await fe.contentFrame();
      if (f) {
        try {
          const ok = await f.evaluate(() => typeof SmartEditor?._editors?.['blogpc001'] !== 'undefined');
          if (ok) return f;
        } catch(e) { /* retry */ }
      }
    }
    await page.waitForTimeout(1500);
  }
  return null;
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => { await d.accept(); });
  
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('🔄 로딩...');
  const f = await waitForSE(page);
  if (!f) { console.log('❌'); process.exit(1); }
  
  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  await f.waitForTimeout(500);

  // 제목
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅ 제목');

  // focusFirstText
  await f.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      ed._canvasScrollingService?.focusFirstText();
    } catch(e) {}
  });
  await f.waitForTimeout(1000);

  // Iframe의 keyboard로 타이핑 (main page가 아니라 iframe에 직접)
  console.log('⌨️ iframe keyboard typing...');
  await f.keyboard.type('테스트 문구입니다. 잘 보이나요?', { delay: 30 });
  await f.waitForTimeout(1000);

  // 결과
  const result = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const d = data.document;
    const canvas = document.querySelector('.se-canvas');
    const r = { title: ed.getDocumentTitle() };
    
    if (d.blocks && Array.isArray(d.blocks)) {
      r.blocks = d.blocks.length;
      let chars = 0;
      d.blocks.forEach(b => { if (b.text) chars += b.text.length; });
      r.chars = chars;
      r.firstBlocks = d.blocks.slice(0,2).map(b => ({ type: b.type, text: (b.text||'').substring(0,30) }));
    } else {
      r.blocks = 'MISSING';
      r.docKeys = Object.keys(d);
    }
    
    r.canvasText = (canvas?.innerText || '').substring(0, 100);
    r.canvasTextLen = (canvas?.innerText || '').length;
    
    // active element
    r.activeEl = document.activeElement?.tagName || 'none';
    r.activeElCls = document.activeElement?.className?.substring(0, 40) || '';
    
    return r;
  });
  
  console.log('📊:', JSON.stringify(result, null, 2));
  
  if (result.chars > 10) {
    console.log('\n✅ iframe keyboard.type() 작동!');
  } else {
    console.log('\n❌ 미작동');
  }
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));
