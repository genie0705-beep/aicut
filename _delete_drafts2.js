const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('PostWriteForm')) { page = p; break; }
  }
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(10000);
  }
  
  // 저장 카운트 버튼 클릭 (aria-haspopup)
  console.log('저장 목록 열기...');
  await page.evaluate(() => {
    const btn = document.querySelector('.save_count_btn__ZTLNa');
    if (btn) { btn.click(); console.log('clicked'); }
  });
  await sleep(3000);
  
  // 팝업/메뉴 확인
  const menuState = await page.evaluate(() => {
    const r = {};
    // aria-haspopup 관련 메뉴 찾기
    const menus = document.querySelectorAll('[role="menu"], [role="listbox"], [class*="menu"], [class*="popup"], [class*="dropdown"]');
    r.menus = [];
    menus.forEach(m => {
      const rect = m.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const style = window.getComputedStyle(m);
        r.menus.push({
          cls: m.className.substring(0, 50),
          visible: style.display !== 'none',
          text: (m.innerText || '').substring(0, 100),
          items: m.querySelectorAll('li, button, [role="menuitem"]').length
        });
      }
    });
    r.body = (document.body.innerText || '').substring(0, 400);
    return r;
  });
  console.log('메뉴 상태:', JSON.stringify(menuState, null, 2));
  
  // 저장 목록 스크롤 다운해서 전체 항목 확인
  const listItems = await page.evaluate(() => {
    const items = document.querySelectorAll('[role="menuitem"], li, .save-list-item, [class*="draft"], [class*="save-item"]');
    const result = [];
    items.forEach((item, i) => {
      const rect = item.getBoundingClientRect();
      if (rect.width > 50) {
        result.push({ idx: i, text: (item.innerText || '').substring(0, 50), hasDeleteBtn: !!item.querySelector('[class*="del"], [class*="trash"], [class*="remove"]'), itemCls: item.className.substring(0, 40) });
      }
    });
    return result;
  });
  console.log('\n저장 목록 항목:', listItems.length + '개');
  listItems.forEach(item => console.log(`  [${item.idx}] ${item.text}`));
  
  // 삭제 버튼 찾기
  console.log('\n삭제 버튼 검색...');
  const delInfo = await page.evaluate(() => {
    const all = document.querySelectorAll('button, a, span, [role="button"]');
    const result = [];
    all.forEach(el => {
      const t = (el.innerText || '').trim();
      const cls = (el.className || '') + '';
      if (t.includes('삭제') || cls.includes('del') || cls.includes('trash') || cls.includes('remove') || cls.includes('delete')) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0) result.push({ text: t.substring(0, 10), cls: cls.substring(0, 40), tag: el.tagName, visible: el.offsetParent !== null });
      }
    });
    return result;
  });
  console.log('삭제 관련:', delInfo.length + '개');
  delInfo.forEach(d => console.log(`  "${d.text}" | <${d.tag}> | ${d.cls} | visible:${d.visible}`));
  
  await b.close();
})();
