const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // Find the newest write tab
  let target = -1;
  pages.forEach((p, i) => {
    if (p.url().includes('Redirect=Write')) target = i;
  });
  
  const p = pages[target];
  const f = await (await p.$('#mainFrame')).contentFrame();
  
  // 팝업 정리
  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  await f.waitForTimeout(500);
  
  // 현재 상태
  const state = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const c = document.querySelector('.se-canvas');
    return {
      blocks: d.blocks?.length || 0,
      chars: d.blocks?.reduce((a,b) => a + (b.text?.length||0), 0),
      imgComps: d.components?.filter(x => x.fileName).length || 0,
      canvasTextLen: (c?.innerText || '').length,
      canvasText: (c?.innerText || '').substring(0, 100),
    };
  });
  console.log('현재 상태:', JSON.stringify(state));

  if (state.canvasTextLen > 500) {
    console.log('✅ 텍스트 정상 표시됨!');
    
    // 스크롤해서 저장 버튼 보이게
    await f.evaluate(() => {
      const btn = document.querySelector('.save_btn__bzc5B');
      if (btn) btn.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await f.waitForTimeout(500);
    
    // 저장 버튼 찾기
    const sBtn = await f.$('.save_btn__bzc5B');
    if (sBtn) {
      await sBtn.evaluate(b => b.click());
      console.log('💾 저장 버튼 클릭');
      await f.waitForTimeout(2000);
    } else {
      // text match
      const anyBtn = await f.$('button:has-text("저장"), span:has-text("저장")');
      if (anyBtn) { await anyBtn.evaluate(b => b.click()); console.log('💾 저장'); }
    }
  }
  
  // 최종
  const final = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const c = document.querySelector('.se-canvas');
    return {
      blocks: d.blocks?.length,
      chars: d.blocks?.reduce((a,b) => a + (b.text?.length||0), 0),
      imgComps: d.components?.filter(x => x.fileName).length,
      canvasTextLen: (c?.innerText || '').length,
    };
  });
  console.log('\n📋 최종:', JSON.stringify(final));
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));
