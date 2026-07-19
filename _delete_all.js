const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  let page = null;
  for (const p of ctx.pages()) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { console.log('PostWriteForm 없음'); await b.close(); return; }
  
  // 저장 목록 열기
  console.log('저장 목록 열기...');
  await page.evaluate(() => { const btn = document.querySelector('.save_count_btn__ZTLNa'); if (btn) btn.click(); });
  await sleep(2000);
  
  // dialog 처리
  page.on('dialog', async d => { console.log('  다이얼로그:', d.message().substring(0, 40)); try { await d.accept(); } catch(e) {} });
  
  // 전체 삭제 버튼 찾기
  const hasAllDelete = await page.evaluate(() => {
    const layer = document.querySelector('.layer_popup__WjlfW');
    if (!layer) return false;
    const all = layer.querySelectorAll('*');
    for (const el of all) {
      const t = (el.innerText || '').trim();
      if (t.includes('전체') && t.includes('삭제')) {
        el.click();
        return 'clicked: ' + t;
      }
    }
    return false;
  });
  console.log('전체 삭제:', hasAllDelete);
  
  if (hasAllDelete) {
    await sleep(3000);
  } else {
    // 개별 삭제 - 각 delete_button 클릭
    console.log('개별 삭제 시작 (41개)...');
    const deleteButtons = await page.evaluate(() => {
      const layer = document.querySelector('.layer_popup__WjlfW');
      if (!layer) return 0;
      const btns = layer.querySelectorAll('.delete_button__kdXNv');
      return btns.length;
    });
    console.log('삭제 버튼 수:', deleteButtons);
    
    // 각 버튼 클릭
    for (let i = 0; i < deleteButtons; i++) {
      await page.evaluate((idx) => {
        const layer = document.querySelector('.layer_popup__WjlfW');
        if (!layer) return;
        const btns = layer.querySelectorAll('.delete_button__kdXNv');
        if (btns[idx]) btns[idx].click();
      }, 0);  // 항상 첫 번째 버튼 클릭 (삭제되면 다음이 첫 번째가 됨)
      await sleep(1000);
      
      // 진행상황
      if ((i + 1) % 5 === 0) console.log(`  ${i + 1}/${deleteButtons} 삭제 완료`);
    }
    
    await sleep(2000);
  }
  
  // 삭제 후 확인
  const afterState = await page.evaluate(() => {
    const layer = document.querySelector('.layer_popup__WjlfW');
    if (!layer) return { layer: '없음' };
    const btns = layer.querySelectorAll('.delete_button__kdXNv');
    const li = layer.querySelectorAll('li');
    return { deleteBtns: btns.length, liCount: li.length, text: (layer.innerText || '').substring(0, 100) };
  });
  console.log('\n삭제 후 상태:', JSON.stringify(afterState));
  
  // 저장 숫자 확인
  const saveCount = await page.evaluate(() => {
    const btn = document.querySelector('.save_count_btn__ZTLNa');
    return btn ? btn.innerText : '없음';
  });
  console.log('저장 카운트:', saveCount);
  
  await b.close();
})();
