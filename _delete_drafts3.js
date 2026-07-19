const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  let page = null;
  for (const p of ctx.pages()) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { console.log('PostWriteForm 없음'); await b.close(); return; }
  
  // 저장 카운트 버튼 클릭해서 목록 열기
  console.log('저장 목록 열기...');
  await page.evaluate(() => { const btn = document.querySelector('.save_count_btn__ZTLNa'); if (btn) btn.click(); });
  await sleep(2000);
  
  // 레이어 분석
  const detail = await page.evaluate(() => {
    const r = {};
    const layer = document.querySelector('.layer_popup__WjlfW');
    if (!layer) { r.error = 'layer not found'; return r; }
    
    r.layerCls = layer.className;
    r.layerVisible = layer.offsetParent !== null;
    
    // 하위 항목들
    const items = layer.querySelectorAll('li');
    r.liCount = items.length;
    
    // 각 li 내부 버튼 분석
    items.forEach((item, i) => {
      if (i < 3) {
        r['item' + i + '_text'] = (item.innerText || '').substring(0, 80);
        r['item' + i + '_html'] = item.innerHTML.substring(0, 200);
      }
    });
    
    // 삭제 버튼 찾기
    const all = layer.querySelectorAll('button, a, span');
    r.deleteBtns = [];
    all.forEach(el => {
      const t = (el.innerText || '').trim();
      const cls = (el.className || '') + '';
      const onclick = el.getAttribute('onclick') || '';
      if (t.includes('삭제') || cls.includes('del') || cls.includes('trash') || onclick.includes('del')) {
        r.deleteBtns.push({ text: t.substring(0, 10), cls: cls.substring(0, 50), tag: el.tagName, onclick: onclick.substring(0, 60) });
      }
    });
    
    // 페이지 번호
    const pageBtns = layer.querySelectorAll('button');
    r.pageBtns = [];
    pageBtns.forEach(b => {
      const t = (b.innerText || '').trim();
      if (t.match(/^[0-9]+$/) || t.includes('다음') || t.includes('이전')) {
        r.pageBtns.push(t);
      }
    });
    
    return r;
  });
  console.log(JSON.stringify(detail, null, 2));
  
  await b.close();
})();
