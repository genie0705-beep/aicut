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
    [3, 5].forEach(i => { if (cbs[i]) cbs[i].click(); });
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
  
  // CH1: AI영상제작 - click its bid button (index 1)
  await adsPage.evaluate(() => {
    const allBtns = Array.from(document.querySelectorAll('button'));
    const bidBtns = allBtns.filter(b => {
      const t = b.innerText.trim();
      return /^[\d,]+$/.test(t) && parseInt(t.replace(/,/g,'')) >= 1000 && b.offsetParent !== null;
    });
    if (bidBtns[1]) bidBtns[1].click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  // Use Playwright's native fill on the input
  const inputHandle = await adsPage.$('.ad-cms-input-number-input');
  if (inputHandle) {
    await inputHandle.click();
    await inputHandle.fill('');
    await inputHandle.fill('1500');
    console.log('AI영상제작: filled 1500 via Playwright fill()');
  } else {
    console.log('AI영상제작: input not found');
  }
  await new Promise(r => setTimeout(r, 1500));
  await adsPage.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 2000));
  
  // CH2: 강의영상제작 - click its bid button (index 3)
  await adsPage.evaluate(() => {
    const allBtns = Array.from(document.querySelectorAll('button'));
    const bidBtns = allBtns.filter(b => {
      const t = b.innerText.trim();
      return /^[\d,]+$/.test(t) && parseInt(t.replace(/,/g,'')) >= 1000 && b.offsetParent !== null;
    });
    if (bidBtns[3]) bidBtns[3].click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  const inputHandle2 = await adsPage.$('.ad-cms-input-number-input');
  if (inputHandle2) {
    await inputHandle2.click();
    await inputHandle2.fill('');
    await inputHandle2.fill('1500');
    console.log('강의영상제작: filled 1500 via Playwright fill()');
  } else {
    console.log('강의영상제작: input not found');
  }
  await new Promise(r => setTimeout(r, 1500));
  await adsPage.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 2000));
  
  // Click somewhere else to save/blur
  await adsPage.evaluate(() => {
    const closeBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.innerText.trim() === '닫기' && b.offsetParent !== null
    );
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  // Check the result
  const finalState = await adsPage.evaluate(() => {
    const text = document.body.innerText;
    const aiIdx = text.indexOf('AI영상제작');
    const lectureIdx = text.indexOf('강의영상제작');
    return {
      aiSection: aiIdx >= 0 ? text.slice(aiIdx, aiIdx + 150) : 'NOT_FOUND',
      lectureSection: lectureIdx >= 0 ? text.slice(lectureIdx, lectureIdx + 150) : 'NOT_FOUND'
    };
  });
  
  console.log('\n=== RESULT ===');
  console.log('AI영상제작:', finalState.aiSection);
  console.log('강의영상제작:', finalState.lectureSection);
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
