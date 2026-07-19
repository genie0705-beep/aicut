const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  const baseUrl = 'https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566';
  await adsPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));
  
  // Step 1: Click "입찰가 변경" to see if we can do bulk bid changes
  const bidBtn = await adsPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const btn of btns) {
      if (btn.innerText.trim() === '입찰가 변경' && btn.offsetParent !== null) {
        btn.click();
        return 'CLICKED';
      }
    }
    return 'NOT FOUND';
  });
  console.log('입찰가 변경 button:', bidBtn);
  await new Promise(r => setTimeout(r, 3000));
  
  // Check what appeared (modal, panel, etc.)
  const afterClick = await adsPage.evaluate(() => {
    // Check for any new modals/dialogs/panels
    const dialogs = document.querySelectorAll('[role="dialog"], .modal, .drawer, .popup, [class*="overlay"]');
    const dialogTexts = Array.from(dialogs).map(d => ({
      role: d.getAttribute('role'),
      class: d.className?.slice(0, 60),
      visible: d.offsetParent !== null,
      text: d.innerText?.trim()?.slice(0, 200)
    }));
    
    // Check for new buttons
    const newBtns = Array.from(document.querySelectorAll('button')).filter(b => 
      b.offsetParent !== null && b.innerText.trim().length > 0
    ).map(b => b.innerText.trim().slice(0, 30));
    
    return { dialogs: dialogTexts, visibleButtons: newBtns.slice(0, 20) };
  });
  
  console.log('\nAfter click state:');
  console.log('Dialogs:', JSON.stringify(afterClick.dialogs, null, 2));
  console.log('Visible buttons:', afterClick.visibleButtons);
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
