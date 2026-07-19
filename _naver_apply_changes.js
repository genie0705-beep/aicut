const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  const baseUrl = 'https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566';
  await adsPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));
  
  // Page 1: Keywords that need bid reduction (3,500원 → 1,500원)
  // AI영상제작 (checkbox #3) - 30imp, 0clicks, relevance 2/10
  // 강의영상제작 (checkbox #5) - 11imp, 0clicks
  
  // Step 1: Check the checkboxes for target keywords
  const checkResult = await adsPage.evaluate(() => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    // checkbox #3 = AI영상제작, #5 = 강의영상제작
    [3, 5].forEach(idx => {
      if (checkboxes[idx]) {
        checkboxes[idx].click();
        checkboxes[idx].checked = true;
      }
    });
    return { 
      cb3: checkboxes[3]?.checked,
      cb5: checkboxes[5]?.checked
    };
  });
  console.log('Checkboxes checked:', checkResult);
  await new Promise(r => setTimeout(r, 1000));
  
  // Step 2: Click "입찰가 변경"
  await adsPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const btn of btns) {
      if (btn.innerText.trim() === '입찰가 변경' && btn.offsetParent !== null) {
        btn.click();
        return true;
      }
    }
    return false;
  });
  console.log('Clicked 입찰가 변경');
  await new Promise(r => setTimeout(r, 3000));
  
  // Check for modal/dialog
  const modalState = await adsPage.evaluate(() => {
    // Get all visible text
    const bodyText = document.body.innerText;
    
    // Check for specific patterns
    const hasModal = bodyText.includes('입찰가') || bodyText.includes('일괄') || bodyText.includes('변경');
    
    // Find any new visible elements
    const btns = Array.from(document.querySelectorAll('button')).filter(b => 
      b.offsetParent !== null && b.innerText.trim().length > 0
    ).map(b => b.innerText.trim().slice(0, 30));
    
    const inputs = Array.from(document.querySelectorAll('input')).filter(i => 
      i.offsetParent !== null && i.type !== 'checkbox'
    ).map(i => ({
      type: i.type,
      placeholder: i.placeholder?.slice(0, 20),
      value: i.value?.slice(0, 20)
    }));
    
    return {
      visibleBtns: btns.slice(0, 30),
      visibleInputs: inputs.slice(0, 5),
      hasBidText: bodyText.includes('일괄입찰가'),
      hasSetText: bodyText.includes('설정')
    };
  });
  
  console.log('\nModal state:', JSON.stringify(modalState, null, 2));
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
