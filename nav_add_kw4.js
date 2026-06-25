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
  
  // Fill textarea
  const textarea = adPage.locator('textarea');
  if (await textarea.count() > 0) {
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
    
    await textarea.first().fill(newKeywords.join('\n'));
    console.log('Keywords entered: 20');
    await adPage.waitForTimeout(1000);
    
    // Click "저장하고 계속하기" (Save and Continue)
    await adPage.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent.trim() === '저장하고 계속하기' && btn.offsetParent !== null) {
          btn.click();
          return 'Clicked save';
        }
      }
      return 'Not found';
    });
    
    console.log('Clicked save');
    await adPage.waitForTimeout(3000);
    
    // Close any post-save modal
    await adPage.evaluate(() => {
      document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.trim() === '닫기' && btn.offsetParent !== null) btn.click();
      });
    });
    await adPage.waitForTimeout(1000);
    
    // Check result
    const text = await adPage.evaluate(() => document.body.innerText);
    const kwMatch = text.match(/키워드\s*(\d+)\s*개\s*결과/);
    if (kwMatch) {
      console.log('Keyword total:', kwMatch[1]);
    }
    
    // Verify page 1 for new keywords
    console.log('\nChecking for new keywords on page 1:');
    const lines = text.split('\n');
    const targetKeywords = ['병원', '변호사', '세무사', '부동산', '분양', '교육', '강의', '이러닝', '보험', '법률', '의료', '아파트', '성형', '치과', '한의원', '피부과'];
    const found = lines.filter(l => targetKeywords.some(t => l.includes(t)));
    found.forEach(k => console.log(`  ${k.trim()}`));
    if (found.length === 0) console.log('  (not on page 1, might be on later pages)');
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
