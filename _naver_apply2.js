const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  const baseUrl = 'https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566';
  await adsPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));
  
  // Check and click checkboxes for AI영상제작 and 강의영상제작
  await adsPage.evaluate(() => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    [3, 5].forEach(idx => { if (checkboxes[idx]) checkboxes[idx].click(); });
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // Click 입찰가 변경
  await adsPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const btn of btns) {
      if (btn.innerText.trim() === '입찰가 변경' && btn.offsetParent !== null) {
        btn.click(); return true;
      }
    }
    return false;
  });
  await new Promise(r => setTimeout(r, 4000));
  
  // Take a screenshot to see the UI
  // First, get ALL the visible text after the change
  const fullText = await adsPage.evaluate(() => document.body.innerText);
  
  // Find where the bid values are
  const keywordSectionStart = fullText.indexOf('AI영상제작');
  const keywordSectionEnd = fullText.indexOf('SNS영상편집');
  const keywordSection = keywordSectionStart >= 0 && keywordSectionEnd > keywordSectionStart 
    ? fullText.slice(keywordSectionStart, keywordSectionEnd + 200)
    : fullText.slice(1000, 3000);
  
  console.log('=== AI영상제작 row text ===');
  console.log(keywordSection);
  
  console.log('\n=== 강의영상제작 row text ===');
  const lectureIdx = fullText.indexOf('강의영상제작');
  if (lectureIdx >= 0) console.log(fullText.slice(lectureIdx, lectureIdx + 400));
  
  // Check for editable inputs near the bid fields
  const editableFields = await adsPage.evaluate(() => {
    // Find all input fields that might be for bid editing
    const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="number"], input:not([type="checkbox"]):not([type="radio"])'));
    return inputs.map(i => ({
      type: i.type,
      placeholder: i.placeholder,
      value: i.value,
      className: i.className?.slice(0, 40),
      parentText: i.parentElement?.innerText?.trim()?.slice(0, 50),
      rect: i.getBoundingClientRect()
    })).filter(i => i.rect.width > 0 && i.rect.height > 0);
  });
  
  console.log('\n=== Editable input fields ===');
  editableFields.forEach((f, i) => console.log(`  #${i} type=${f.type} value="${f.value}" placeholder="${f.placeholder}" parent="${f.parentText}"`));
  
  // Also check for any "저장" or "확인" or "적용" button
  const actionBtns = await adsPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).filter(b => 
      b.offsetParent !== null
    );
    return btns.map(b => b.innerText.trim()).filter(t => 
      t.length > 0 && t.length < 15
    );
  });
  
  console.log('\n=== All visible buttons ===');
  console.log(actionBtns.slice(0, 30));
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
