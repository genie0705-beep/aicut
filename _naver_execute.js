const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  const baseUrl = 'https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566';
  await adsPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));
  
  // =========================================================
  // OPERATION: 입찰가 인하 (3,500원 → 1,500원)
  // Target: AI영상제작(checkbox#3), 강의영상제작(checkbox#5)
  // =========================================================
  
  console.log('=== PHASE 1: Check and bid change ===');
  
  // Step 1: Select keywords
  await adsPage.evaluate(() => {
    const cbs = document.querySelectorAll('input[type="checkbox"]');
    [3, 5].forEach(i => { if (cbs[i]) { cbs[i].click(); cbs[i].checked = true; } });
  });
  await new Promise(r => setTimeout(r, 500));
  
  // Step 2: Click 입찰가 변경
  await adsPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const b of btns) {
      if (b.innerText.trim() === '입찰가 변경' && b.offsetParent !== null) { b.click(); return; }
    }
  });
  await new Promise(r => setTimeout(r, 3000));
  
  // Step 3: Look for the bid input field and change value
  // The UI shows bid values as clickable buttons with values like "3,500", "3,500", "1,500"
  // Click the "3,500" that corresponds to the first selected keyword to lower it
  const bidChangeResult = await adsPage.evaluate(() => {
    // After clicking 입찰가 변경, bid cells become buttons
    // Look for buttons that show bid amounts exactly
    const allBtns = Array.from(document.querySelectorAll('button'));
    
    // Find buttons showing bid amounts (these are the bid value selectors)
    const bidBtns = allBtns.filter(b => {
      const t = b.innerText.trim();
      return /^[\d,]+$/.test(t) && parseInt(t.replace(/,/g,'')) >= 1000 && b.offsetParent !== null;
    });
    
    return {
      totalBidBtns: bidBtns.length,
      values: bidBtns.map(b => b.innerText.trim()).slice(0, 20)
    };
  });
  
  console.log('Bid amount buttons:', JSON.stringify(bidChangeResult));
  
  // The UI seems to show bid values as clickable presets
  // Let me check the full page HTML for any overlay/dialog
  const bodyText = await adsPage.evaluate(() => document.body.innerText);
  
  // Find "닫기" button - if it's there, we're in edit mode
  const inEditMode = bodyText.includes('닫기') && bodyText.includes('ON') && bodyText.includes('OFF') && bodyText.includes('삭제');
  console.log('In edit mode:', inEditMode);
  
  // Check if there's any bid-related modal content
  const hasBidChangeUI = bodyText.includes('입찰가를') || bodyText.includes('일괄') || bodyText.includes('변경할');
  console.log('Has bid change UI text:', hasBidChangeUI);
  
  // Find text around "3,500" after the edit mode activation
  const sectionAroundAIBid = bodyText.slice(bodyText.indexOf('AI영상제작'), bodyText.indexOf('AI영상제작') + 500);
  console.log('\nAI영상제작 section:', sectionAroundAIBid);
  
  // Check the 강의영상제작 section
  const lectureIdx = bodyText.indexOf('강의영상제작');
  if (lectureIdx >= 0) {
    const section = bodyText.slice(lectureIdx, lectureIdx + 500);
    console.log('\n강의영상제작 section:', section);
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
