const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 5000));

  // Try to click the bid edit button for "영상편집" keyword on page 7
  // First, attempt to click the button
  const result = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    for (const row of rows) {
      const keywordEl = row.querySelector('.keyword_text');
      const keyword = keywordEl?.innerText?.trim();
      if (keyword === '영상편집') {
        const bidBtn = row.querySelector('.input-bid-amt');
        if (bidBtn) {
          bidBtn.click();
          bidBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
          return 'Found and clicked bid button for: ' + keyword + ' | button HTML: ' + bidBtn.outerHTML.substring(0, 100);
        }
        return 'Found ' + keyword + ' but no .input-bid-amt button found';
      }
    }
    return '영상편집 not found on page 1';
  });

  console.log(result);
  await new Promise(r => setTimeout(r, 2000));

  // Check what happened after click
  const after = await page.evaluate(() => {
    // Look for modals, popovers, or any new elements
    const newElements = [];
    
    // Check for modal-like elements
    const modals = document.querySelectorAll('[role="dialog"], [role="tooltip"], [class*="modal"], [class*="popup"], [class*="overlay"]');
    modals.forEach(m => {
      newElements.push({
        role: m.getAttribute('role') || 'none',
        text: m.innerText?.substring(0, 200).replace(/\s+/g, ' ').trim(),
        html: m.innerHTML?.substring(0, 200)
      });
    });

    // Check for input elements near the page
    const allInputs = document.querySelectorAll('input[type="text"], input[type="number"], input:not([type="checkbox"])');
    allInputs.forEach(inp => {
      newElements.push({
        type: inp.type,
        id: inp.id,
        placeholder: inp.placeholder,
        value: inp.value,
        class: inp.className?.substring(0, 50)
      });
    });

    return newElements;
  });

  console.log('\n=== After click state ===');
  after.forEach(el => {
    console.log(JSON.stringify(el, null, 2));
  });

  await b.close();
})().catch(e => console.log('ERR:', e.message));
