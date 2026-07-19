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

  // focusFirstText로 에디터 포커스
  await f.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      if (ed._canvasScrollingService?.focusFirstText) {
        ed._canvasScrollingService.focusFirstText();
        console.log('focusFirstText OK');
      }
    } catch(e) { console.log(e.message); }
  });
  await f.waitForTimeout(500);

  // keyboard.type 테스트 - 단축
  console.log('⌨️ 키보드 입력 테스트...');
  await page.keyboard.type('안녕하세요 테스트입니다.', { delay: 30 });
  await f.waitForTimeout(500);

  // 결과 확인
  const check = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const d = data.document;
    const canvas = document.querySelector('.se-canvas');
    const r = {
      title: ed.getDocumentTitle(),
      docKeys: Object.keys(d),
      canvasText: (canvas?.innerText || '').substring(0, 100),
      canvasTextLen: (canvas?.innerText || '').length,
    };
    if (d.blocks) {
      r.blocks = d.blocks.length;
      r.firstBlocks = d.blocks.slice(0,3).map(b => ({ type: b.type, text: (b.text || '').substring(0, 40) }));
    }
    // contentEditable 내용
    const ce = document.querySelector('[contenteditable]');
    r.ceText = ce ? ce.innerText.substring(0, 50) : 'no ce';
    return r;
  });
  console.log('📊:', JSON.stringify(check, null, 2));
  
  if (check.canvasTextLen > 75 || (check.ceText && check.ceText.includes('테스트'))) {
    console.log('✅ keyboard.type() 작동!');
  } else {
    console.log('❌ keyboard.type() 미작동');
  }
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));
