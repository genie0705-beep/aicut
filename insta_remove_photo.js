const { chromium } = require('playwright');
async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  
  await p.goto('https://www.instagram.com/accounts/edit/', { timeout: 15000 });
  await p.waitForTimeout(3000);

  // "사진 변경" 버튼 클릭
  const clicked = await p.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, span'));
    const btn = divs.find(d => d.innerText?.trim() === '사진 변경');
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('사진 변경 클릭:', clicked);
  await new Promise(r => setTimeout(r, 2000));

  // 팝업/모달 내 옵션 확인
  const options = await p.evaluate(() => {
    return Array.from(document.querySelectorAll('button, [role="button"], span'))
      .map(el => el.innerText?.trim())
      .filter(t => t && t.length < 20);
  });
  console.log('옵션:', options);

  // "현재 사진 삭제" 또는 "삭제" 찾기
  const deleteBtn = options.find(t => t.includes('삭제') || t.includes('제거') || t.includes('Remove'));
  console.log('삭제 버튼:', deleteBtn);

  if (deleteBtn) {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"], span'));
      const btn = btns.find(b => b.innerText?.trim().includes('삭제') || b.innerText?.trim().includes('Remove'));
      if (btn) btn.click();
    });
    console.log('삭제 버튼 클릭');
    await new Promise(r => setTimeout(r, 2000));
    
    // 확인
    const confirm = await p.evaluate(() => {
      return Array.from(document.querySelectorAll('button'))
        .map(b => b.innerText?.trim())
        .filter(t => t);
    });
    console.log('확인 버튼:', confirm);
    
    // "확인" 또는 "예" 버튼
    const confirmBtn = confirm.find(t => t === '확인' || t === '예' || t === '삭제');
    if (confirmBtn) {
      await p.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.innerText?.trim() === '확인' || b.innerText?.trim() === '예');
        if (btn) btn.click();
      });
      console.log('✅ 삭제 확인');
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  process.exit(0);
}
run().catch(e => { console.error('❌', e.message); process.exit(1); });
