const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const wp = pages[2] || pages.find(p => p.url().includes('Redirect=Write'));
  if (!wp) { console.log('NO PAGE'); await b.close(); return; }
  await wp.bringToFront(); await sleep(2000);
  
  const se = wp.frames().find(f => f.url().includes('PostWriteForm'));
  if (!se) { console.log('NO IFRAME'); await b.close(); return; }
  
  // dialog 리스너
  se.on('dialog', async dialog => { await dialog.accept(); });
  
  // 26 버튼 클릭 (force)
  await se.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '26') {
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return;
      }
    }
  });
  await sleep(3000);
  
  // 팝업 내 HTML 자세히 분석
  const detail = await se.evaluate(() => {
    const popup = document.querySelector('.popup_content__lUaop');
    if (!popup) return { error: 'no popup_content' };
    
    // 모든 버튼 찾기
    const btns = popup.querySelectorAll('button');
    const btnList = Array.from(btns).map(b => ({
      text: b.innerText.trim().substring(0, 30),
      cls: b.className.substring(0, 50),
      html: b.outerHTML.substring(0, 200)
    }));
    
    // 모든 input/checkbox 찾기
    const inputs = popup.querySelectorAll('input, [role=checkbox]');
    const inputList = Array.from(inputs).map(i => ({
      type: i.getAttribute('type') || i.getAttribute('role') || i.tagName,
      checked: i.checked !== undefined ? i.checked : undefined
    }));
    
    // 첫 번째 항목의 HTML
    const firstItem = popup.querySelector('li, [class*=item]');
    const firstHtml = firstItem ? firstItem.outerHTML.substring(0, 500) : 'no item';
    
    return {
      btnCount: btns.length,
      btns: btnList,
      inputCount: inputs.length,
      inputs: inputList,
      firstItemHtml: firstHtml
    };
  });
  
  console.log('=== 팝업 상세 분석 ===');
  console.log(JSON.stringify(detail, null, 2));
  
  await b.close();
})();
