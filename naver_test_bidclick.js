const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 5000));

  // Click one of the "1,500" bid buttons
  await page.evaluate(() => {
    const bidBtns = document.querySelectorAll('.input-bid-amt');
    if (bidBtns.length > 0) {
      bidBtns[0].click();
      return 'Clicked bid button #0';
    }
    return 'No bid buttons found';
  });

  await new Promise(r => setTimeout(r, 2000));

  // Check the page state after click
  const state = await page.evaluate(() => {
    // Look for any input fields or modals that appeared
    const result = {};
    
    // Any input that appeared near bid area
    const inputs = document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="search"])');
    result.inputs = Array.from(inputs).map(i => ({
      type: i.type, value: i.value, placeholder: i.placeholder, id: i.id, class: i.className?.substring(0, 60)
    }));

    // Any new divs that appeared
    const newDivs = document.querySelectorAll('div[style*="display"][style*="block"], div[role="dialog"], div[class*="popover"], div[class*="dropdown"]');
    result.popups = Array.from(newDivs).map(d => ({
      role: d.getAttribute('role') || '',
      text: d.innerText?.replace(/\s+/g, ' ').trim().substring(0, 200),
      visible: d.offsetParent !== null
    }));

    // Check what's visible near the bid column
    result.bodyText = document.body.innerText?.substring(1000, 2000).replace(/\s+/g, ' ').trim();
    
    return result;
  });

  console.log('=== After bid click ===');
  console.log('Inputs found:', JSON.stringify(state.inputs, null, 2));
  console.log('Popups found:', JSON.stringify(state.popups, null, 2));
  console.log('Body section:', state.bodyText);

  await b.close();
})().catch(e => console.log('ERR:', e.message));
