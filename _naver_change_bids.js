const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  const baseUrl = 'https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566';
  await adsPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));
  
  // Select AI영상제작 (#3) and 강의영상제작 (#5)
  await adsPage.evaluate(() => {
    const cbs = document.querySelectorAll('input[type="checkbox"]');
    [3, 5].forEach(i => { if (cbs[i]) { cbs[i].click(); cbs[i].checked = true; } });
  });
  await new Promise(r => setTimeout(r, 500));
  
  // Click 입찰가 변경
  await adsPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const b of btns) {
      if (b.innerText.trim() === '입찰가 변경' && b.offsetParent !== null) { b.click(); return; }
    }
  });
  await new Promise(r => setTimeout(r, 3000));
  
  // Now click the bid button for AI영상제작 (2nd bid button, index 1)
  // The bid buttons are: [3,500, 3,500, 1,500, 3,500, ...]
  // Index 0 = AI영상(3,500), 1 = AI영상제작(3,500) ← this one
  // Index 3 = 강의영상제작(3,500) ← this one
  
  const clickBidResult = await adsPage.evaluate(() => {
    const allBtns = Array.from(document.querySelectorAll('button'));
    
    // Find ALL bid amount buttons (numbers like "3,500", "1,500")
    const bidBtns = allBtns.filter(b => {
      const t = b.innerText.trim();
      return /^[\d,]+$/.test(t) && parseInt(t.replace(/,/g,'')) >= 1000 && b.offsetParent !== null;
    });
    
    console.log('Found bid buttons:', bidBtns.length);
    
    // Click index 1 (AI영상제작 bid - 3,500)
    if (bidBtns[1]) {
      console.log('Clicking bid button 1:', bidBtns[1].innerText.trim());
      bidBtns[1].click();
      return 'CLICKED_INDEX_1';
    }
    return 'NO_BUTTON';
  });
  
  console.log('Bid click:', clickBidResult);
  await new Promise(r => setTimeout(r, 2000));
  
  // Check what appeared after clicking
  const afterClick = await adsPage.evaluate(() => {
    // Check for input fields, dropdowns, popups
    const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="number"]'))
      .filter(i => i.offsetParent !== null)
      .map(i => ({ type: i.type, value: i.value, placeholder: i.placeholder }));
    
    // Check for any visible popup/dropdown
    const bodyText = document.body.innerText;
    const relevantText = bodyText.slice(Math.max(0, bodyText.indexOf('AI영상제작') - 100), bodyText.indexOf('AI영상제작') + 300);
    
    return { inputs, text: relevantText };
  });
  
  console.log('\nAfter clicking bid:', JSON.stringify(afterClick, null, 2));
  
  // Try the HTML approach - any select, input, or contenteditable elements near the bid
  const bidEditElements = await adsPage.evaluate(() => {
    // Look for any recently appeared input fields or select dropdowns
    const allInputs = document.querySelectorAll('input');
    const allSelects = document.querySelectorAll('select');
    const allContentEditable = document.querySelectorAll('[contenteditable="true"]');
    
    return {
      inputs: Array.from(allInputs).map(i => ({
        type: i.type,
        value: i.value,
        placeholder: i.placeholder,
        className: i.className?.slice(0, 30),
        visible: i.offsetParent !== null
      })).filter(i => i.visible),
      selects: Array.from(allSelects).map(s => ({
        value: s.value,
        options: Array.from(s.options).slice(0, 5).map(o => o.text),
        visible: s.offsetParent !== null
      })).filter(s => s.visible),
      contentEditable: Array.from(allContentEditable).map(e => ({
        text: e.innerText?.slice(0, 30),
        visible: e.offsetParent !== null
      })).filter(e => e.visible)
    };
  });
  
  console.log('\nEditable elements:', JSON.stringify(bidEditElements, null, 2));
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
