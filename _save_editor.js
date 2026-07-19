const { chromium } = require('playwright');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  // Find the editor tab
  const editPage = pages.find(p => p.url().includes('PostUpdate') || p.url().includes('Redirect=Update'));
  if (!editPage) { console.log('No editor tab found'); return; }
  
  console.log('에디터 탭 발견:', editPage.url().substring(0, 100));
  
  // Look for 저장 button in the main page (not iframe)
  const saveInfo = await editPage.evaluate(() => {
    // Look for text "저장" in visible elements
    const results = [];
    document.querySelectorAll('*').forEach(el => {
      const t = (el.textContent || '').trim();
      if ((t === '저장' || t === '임시저장') && el.offsetParent !== null) {
        const rect = el.getBoundingClientRect();
        results.push({
          tag: el.tagName,
          text: t,
          class: el.className?.substring(0, 50),
          id: el.id,
          rect: `${Math.round(rect.x)},${Math.round(rect.y)}`,
          parentCls: el.parentElement?.className?.substring(0, 50),
          parentTag: el.parentElement?.tagName,
        });
      }
    });
    return results;
  });
  
  console.log('저장 요소:', JSON.stringify(saveInfo, null, 2));
  
  if (saveInfo.length > 0) {
    const el = saveInfo[0];
    const selector = el.tag === 'SPAN' || el.tag === 'DIV' ? `${el.tag}:has-text("${el.text}")` : el.tag;
    
    // Try clicking via evaluate
    await editPage.evaluate((text) => {
      document.querySelectorAll('*').forEach(el => {
        if ((el.textContent || '').trim() === text && el.offsetParent !== null) {
          el.click();
        }
      });
    }, el.text);
    
    console.log('✅ 클릭 완료');
    await sleep(5000);
    console.log('저장 후 URL:', (await editPage.url()).substring(0, 100));
  } else {
    console.log('저장 버튼 없음 - 스크린샷 확인');
    await editPage.screenshot({ path: '_debug_editor_full.png' });
  }

  // Try the iframe for publish button
  const editFrame = editPage.frames().find(f => f.url().includes('PostUpdateForm'));
  if (editFrame) {
    const publishBtn = await editFrame.$('button.publish_btn__m9KHH');
    if (publishBtn) {
      console.log('\n발행 버튼 발견됨 (임시저장 불가능 - 수동 저장 필요)');
    }
  }
})();
