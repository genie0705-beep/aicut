const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // 에디터 탭 찾기
  const wp = pages[2] || pages.find(p => p.url().includes('Redirect=Write'));
  if (!wp) { console.log('NO WP TAB'); await b.close(); return; }
  await wp.bringToFront();
  await sleep(2000);
  
  const se = wp.frames().find(f => f.url().includes('PostWriteForm'));
  if (!se) { console.log('NO IFRAME'); await b.close(); return; }
  
  console.log('1. 26번 버튼 클릭');
  const btn = await se.$('button[aria-label*="임시저장"]');
  if (btn) {
    await btn.click();
    console.log('   클릭됨');
  } else {
    console.log('   버튼 못 찾음');
    await b.close();
    return;
  }
  await sleep(3000);
  
  // 팝업에서 삭제 버튼/링크 찾기
  console.log('\n2. 팝업 버튼 분석');
  const popupInfo = await se.evaluate(() => {
    const all = document.querySelectorAll('button, a, li, [role=menuitem]');
    const results = [];
    all.forEach(el => {
      const t = el.innerText.trim();
      if (t && t.length < 30) {
        results.push({ tag: el.tagName, text: t, cls: el.className.substring(0, 30) });
      }
    });
    return results.slice(0, 40);
  });
  
  // '삭제' 관련 버튼 찾기
  const deleteBtns = popupInfo.filter(p => p.text.includes('삭제') || p.text.includes('전체'));
  const otherBtns = popupInfo.filter(p => p.text.length > 0 && p.text.length < 20);
  
  console.log('삭제 관련:', JSON.stringify(deleteBtns));
  console.log('전체 버튼 (앞 20개):', JSON.stringify(otherBtns.slice(0, 20)));
  
  // '전체삭제' 있으면 클릭
  let deleted = false;
  if (deleteBtns.length > 0) {
    for (const db of deleteBtns) {
      await se.evaluate((text) => {
        const all = document.querySelectorAll('button, a, [role=menuitem]');
        for (const el of all) {
          if (el.innerText.trim() === text) { el.click(); return; }
        }
      }, db.text);
      await sleep(2000);
      deleted = true;
      console.log('   클릭:', db.text);
    }
  }
  
  if (!deleted) {
    console.log('\n3. 전체삭제 없음 → 개별 삭제 시도');
    // 각 항목의 삭제 버튼을 찾아서 클릭
    // 목록에서 각 항목 옆에 '삭제' 버튼이 있을 것
    const allDelBtns = await se.evaluate(() => {
      const btns = [];
      document.querySelectorAll('button, a, span, [role=button]').forEach(el => {
        const t = el.innerText.trim();
        if (t === '삭제' || t.includes('삭제')) {
          btns.push({ text: t, tag: el.tagName, cls: el.className.substring(0, 40) });
        }
      });
      return btns;
    });
    console.log('개별 삭제 버튼들:', JSON.stringify(allDelBtns));
    
    if (allDelBtns.length > 0) {
      // 모두 클릭
      for (let i = 0; i < allDelBtns.length; i++) {
        await se.evaluate((idx) => {
          const btns = [];
          document.querySelectorAll('button, a, span, [role=button]').forEach(el => {
            if (el.innerText.trim() === '삭제' || el.innerText.trim().includes('삭제')) {
              btns.push(el);
            }
          });
          if (btns[idx]) btns[idx].click();
        }, i);
        await sleep(1500);
        console.log(`   ${i+1}번째 삭제`);
      }
    }
  }
  
  // 결과 확인
  await sleep(3000);
  const remain = await se.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '26') return '아직 26 남음';
      if (btn.innerText.trim().match(/^\d+$/)) return btn.innerText.trim() + '개 남음';
    }
    return '0개 (삭제 완료)';
  });
  
  console.log('\n=== 결과 ===');
  console.log(remain);
  
  await b.close();
})();
