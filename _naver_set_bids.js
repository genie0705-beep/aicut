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
  
  // Click 입찰가 변경 to enter edit mode
  await adsPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const b of btns) {
      if (b.innerText.trim() === '입찰가 변경' && b.offsetParent !== null) { b.click(); return; }
    }
  });
  await new Promise(r => setTimeout(r, 3000));
  
  // === CHANGE 1: AI영상제작 bid 3,500 → 1,500 ===
  // Click the bid button (index 1 = AI영상제작's 3,500)
  await adsPage.evaluate(() => {
    const allBtns = Array.from(document.querySelectorAll('button'));
    const bidBtns = allBtns.filter(b => {
      const t = b.innerText.trim();
      return /^[\d,]+$/.test(t) && parseInt(t.replace(/,/g,'')) >= 1000 && b.offsetParent !== null;
    });
    if (bidBtns[1]) bidBtns[1].click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  // Now set the value to 1500
  const set1 = await adsPage.evaluate(() => {
    const bidInput = document.querySelector('.ad-cms-input-number-input');
    if (!bidInput) return 'NO_INPUT';
    
    // Clear and set new value
    bidInput.value = '';
    bidInput.value = '1500';
    
    // Trigger React input event
    bidInput.dispatchEvent(new Event('input', { bubbles: true }));
    bidInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    return 'SET_TO_1500';
  });
  console.log('AI영상제작 bid set:', set1);
  await new Promise(r => setTimeout(r, 1000));
  
  // Press Enter to confirm
  await adsPage.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 2000));
  
  // === CHANGE 2: 강의영상제작 bid 3,500 → 1,500 ===
  // Click bid button index 3 (강의영상제작's 3,500)
  await adsPage.evaluate(() => {
    const allBtns = Array.from(document.querySelectorAll('button'));
    const bidBtns = allBtns.filter(b => {
      const t = b.innerText.trim();
      return /^[\d,]+$/.test(t) && parseInt(t.replace(/,/g,'')) >= 1000 && b.offsetParent !== null;
    });
    if (bidBtns[3]) bidBtns[3].click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  const set2 = await adsPage.evaluate(() => {
    const bidInput = document.querySelector('.ad-cms-input-number-input');
    if (!bidInput) return 'NO_INPUT';
    
    bidInput.value = '';
    bidInput.value = '1500';
    bidInput.dispatchEvent(new Event('input', { bubbles: true }));
    bidInput.dispatchEvent(new Event('change', { bubbles: true }));
    return 'SET_TO_1500';
  });
  console.log('강의영상제작 bid set:', set2);
  await new Promise(r => setTimeout(r, 1000));
  await adsPage.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 2000));
  
  // == Check what the bid values look like now ==
  const finalState = await adsPage.evaluate(() => {
    const text = document.body.innerText;
    const aiIdx = text.indexOf('AI영상제작');
    const lectureIdx = text.indexOf('강의영상제작');
    return {
      aiSection: aiIdx >= 0 ? text.slice(aiIdx, aiIdx + 200) : 'NOT_FOUND',
      lectureSection: lectureIdx >= 0 ? text.slice(lectureIdx, lectureIdx + 200) : 'NOT_FOUND'
    };
  });
  
  console.log('\n=== FINAL STATE ===');
  console.log('AI영상제작:', finalState.aiSection);
  console.log('강의영상제작:', finalState.lectureSection);
  
  // Verify by checking bid value in the row
  const bidVerify = await adsPage.evaluate(() => {
    const text = document.body.innerText;
    const aiMatch = text.match(/AI영상제작[\s\S]{0,200}?(\d[\d,]*)\s*원/);
    const lectureMatch = text.match(/강의영상제작[\s\S]{0,200}?(\d[\d,]*)\s*원/);
    return {
      aiBid: aiMatch ? aiMatch[1] : 'NOT FOUND',
      lectureBid: lectureMatch ? lectureMatch[1] : 'NOT FOUND'
    };
  });
  
  console.log('\n=== VERIFIED BIDS ===');
  console.log('AI영상제작 bid:', bidVerify.aiBid);
  console.log('강의영상제작 bid:', bidVerify.lectureBid);
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
