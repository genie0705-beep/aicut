const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const pages = browser.contexts()[0].pages();
  const adPage = pages.find(p => p.url().includes('ads.naver.com'));
  if (!adPage) { console.log('Not found'); await browser.close(); return; }
  
  await adPage.bringToFront();
  await adPage.waitForTimeout(1000);
  
  await adPage.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'networkidle' });
  await adPage.waitForTimeout(3000);
  
  // Close any modal
  await adPage.evaluate(() => {
    document.querySelectorAll('button').forEach(btn => {
      if (btn.textContent.trim() === '닫기' && btn.offsetParent !== null) btn.click();
    });
  });
  await adPage.waitForTimeout(500);
  
  // Click "새 키워드"
  await adPage.evaluate(() => {
    const els = document.querySelectorAll('button, span, a, div');
    for (const el of els) {
      if (el.textContent.trim() === '새 키워드' && el.offsetParent !== null) {
        el.click();
        return;
      }
    }
  });
  console.log('Clicked new keyword');
  await adPage.waitForTimeout(2000);
  
  // Check what appeared - get all buttons and their positions
  const buttons = await adPage.evaluate(() => {
    const btns = document.querySelectorAll('button');
    return Array.from(btns).map(b => ({
      text: b.textContent.trim().substring(0, 30),
      visible: b.offsetParent !== null,
      y: Math.round(b.getBoundingClientRect().y),
      x: Math.round(b.getBoundingClientRect().x)
    })).filter(b => b.visible && b.text.length > 0);
  });
  
  console.log('All visible buttons:');
  buttons.forEach(b => console.log(`  y=${b.y} x=${b.x}: "${b.text}"`));
  
  // Check for the keyword entry textarea
  const textarea = adPage.locator('textarea');
  console.log('\nTextarea count:', await textarea.count());
  
  if (await textarea.count() > 0) {
    const kwText = '병원영상제작\n변호사영상마케팅\n부동산영상제작\n교육영상편집\n강의영상제작';
    await textarea.first().fill(kwText);
    console.log('Filled keywords');
    await adPage.waitForTimeout(1000);
    
    // Look for a save/confirm button near the textarea (could be "확인", "등록", "추가")
    await adPage.evaluate(() => {
      // Look for any clickable element near the textarea
      const allEls = document.querySelectorAll('button, a, span, div');
      for (const el of allEls) {
        const t = el.textContent.trim();
        // Try common button labels
        if (t === '확인' || t === '등록' || t === '추가' || t === '적용' || t === '저장' || t.includes('키워드 추가')) {
          if (el.offsetParent !== null) {
            console.log('Found matching:', t);
            el.click();
            return 'Clicked: ' + t;
          }
        }
      }
      return 'No match found';
    });
    
    await adPage.waitForTimeout(3000);
    
    const text = await adPage.evaluate(() => document.body.innerText);
    const kwMatch = text.match(/키워드\s*(\d+)\s*개\s*결과/);
    if (kwMatch) {
      console.log('Keyword total:', kwMatch[1]);
    }
    
    if (text.includes('성공') || text.includes('완료')) {
      console.log('SUCCESS');
    }
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
