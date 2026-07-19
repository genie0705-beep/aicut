const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let ep = null, sf = null;
  for (const p of ctx.pages()) {
    const f = p.frames().find(f => f.url().includes('/postwrite') || f.url().includes('PostWriteForm'));
    if (f) {
      const hasEd = await f.evaluate(() => Object.keys(SmartEditor._editors||{}).length > 0).catch(()=>false);
      if (hasEd) { ep = p; sf = f; break; }
    }
  }
  if (!ep || !sf) { console.log('No editor'); await b.close(); return; }
  
  ep.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
  
  console.log('[1] 발행 버튼 찾기...');
  
  // Find publish button in parent page (not iframe)
  const btnInfo = await ep.evaluate(() => {
    const all = document.querySelectorAll('button, a, span');
    for (const el of all) {
      const text = (el.textContent || '').trim();
      if (text === '발행') {
        return {
          found: true,
          tag: el.tagName,
          text: text,
          class: el.className.substring(0, 60),
          id: el.id,
          rect: el.getBoundingClientRect()
        };
      }
    }
    return { found: false };
  });
  
  console.log('발행 버튼:', JSON.stringify(btnInfo, null, 2));
  
  if (btnInfo.found) {
    // Click publish in parent page
    await ep.evaluate(() => {
      const all = document.querySelectorAll('button, a, span');
      for (const el of all) {
        if ((el.textContent || '').trim() === '발행') {
          el.click();
          return;
        }
      }
    });
    console.log('[2] 발행 버튼 클릭!');
    await ep.waitForTimeout(3000);
    
    // Check for category/confirm dialog
    const pageState = await ep.evaluate(() => {
      // Look for category selector or confirm dialog
      const cats = document.querySelectorAll('select option');
      const catOptions = Array.from(cats).map(o => o.textContent.trim()).slice(0, 20);
      const confirmBtns = Array.from(document.querySelectorAll('button')).filter(b => {
        const t = (b.textContent || '').trim();
        return t === '확인' || t === '등록' || t === '발행' || t === '저장';
      }).map(b => ({ text: (b.textContent || '').trim(), class: b.className.substring(0, 40) }));
      return { cats: catOptions, confirmBtns };
    });
    console.log('발행 후 상태:', JSON.stringify(pageState, null, 2));
    
    // Click confirm if available
    for (const btn of pageState.confirmBtns) {
      if (btn.text === '확인' || btn.text === '등록') {
        await ep.evaluate(() => {
          const all = document.querySelectorAll('button');
          for (const b of all) {
            if ((b.textContent || '').trim() === '확인' || (b.textContent || '').trim() === '등록') {
              b.click();
              break;
            }
          }
        });
        console.log('[3] 확인 버튼 클릭');
        await ep.waitForTimeout(2000);
        break;
      }
    }
  }
  
  console.log('\n=== 발행 완료 ===');
  await b.close();
})();
