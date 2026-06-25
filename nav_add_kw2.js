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
    const buttons = document.querySelectorAll('button, span, a');
    for (const btn of buttons) {
      if (btn.textContent.trim() === '새 키워드' && btn.offsetParent !== null) {
        btn.click();
        return;
      }
    }
  });
  console.log('Clicked new keyword');
  await adPage.waitForTimeout(2000);
  
  // Keywords to add - target industry keywords
  const newKeywords = [
    '병원영상제작',
    '성형외과영상편집',
    '치과광고영상',
    '한의원영상마케팅',
    '피부과영상제작',
    '의료기관홍보영상',
    '변호사영상마케팅',
    '변호사유튜브영상',
    '세무사영상제작',
    '보험설계사영상',
    '법률사무소홍보영상',
    '전문직영상마케팅',
    '부동산영상제작',
    '부동산매물영상',
    '분양영상제작',
    '아파트홍보영상',
    '교육영상편집',
    '강의영상제작',
    '온라인강의영상편집',
    '이러닝영상제작'
  ];
  
  // Find textarea with placeholder
  const textarea = adPage.locator('textarea');
  console.log('Textarea count:', await textarea.count());
  
  if (await textarea.count() > 0) {
    const kwText = newKeywords.join('\n');
    await textarea.first().click();
    await adPage.waitForTimeout(300);
    await textarea.first().fill(kwText);
    console.log('Keywords entered');
    await adPage.waitForTimeout(1000);
    
    // Check if there's a save/confirm button
    const text = await adPage.evaluate(() => document.body.innerText);
    
    // Look for save/confirm/적용 buttons
    const saveBtn = adPage.locator('button:has-text("저장"), button:has-text("확인"), button:has-text("적용"), button:has-text("추가")');
    console.log('Save buttons:', await saveBtn.count());
    
    // Try clicking save via evaluate
    const saved = await adPage.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const t = btn.textContent.trim();
        if ((t === '저장' || t === '확인' || t === '적용' || t === '추가') && btn.offsetParent !== null) {
          btn.click();
          return 'Clicked: ' + t;
        }
      }
      return 'Not found';
    });
    
    console.log('Save result:', saved);
    await adPage.waitForTimeout(3000);
    
    // Check result
    const resultText = await adPage.evaluate(() => document.body.innerText);
    if (resultText.includes('성공') || resultText.includes('완료') || resultText.includes('추가') || resultText.includes('적용')) {
      console.log('Keywords added successfully!');
    }
    
    // Get current keyword count
    const kwCountMatch = resultText.match(/키워드\s*(\d+)\s*개\s*결과/);
    if (kwCountMatch) {
      console.log('New keyword total:', kwCountMatch[1]);
    }
    
    // Take a screenshot
    await adPage.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\keywords_added.png' });
    console.log('Screenshot saved');
  } else {
    console.log('No textarea found');
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
