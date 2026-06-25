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
  
  const text = await adPage.evaluate(() => document.body.innerText);
  
  // Get total keyword count
  const kwMatch = text.match(/키워드\s*(\d+)\s*개\s*결과/);
  if (kwMatch) {
    console.log('=== TOTAL KEYWORDS:', kwMatch[1], '===');
  } else {
    console.log('Keyword count not found');
  }
  
  // Check pages 1 through 3 for new keywords
  const newKws = ['병원영상제작', '성형외과영상편집', '치과광고영상', '한의원영상마케팅', '피부과영상제작', 
    '의료기관홍보영상', '변호사영상마케팅', '변호사유튜브영상', '세무사영상제작', '보험설계사영상',
    '법률사무소홍보영상', '전문직영상마케팅', '부동산영상제작', '부동산매물영상', '분양영상제작',
    '아파트홍보영상', '교육영상편집', '강의영상제작', '온라인강의영상편집', '이러닝영상제작'];
  
  console.log('\n=== Checking pages 1-3 for new keywords ===');
  for (let pageNum = 1; pageNum <= 3; pageNum++) {
    if (pageNum > 1) {
      const navResult = await adPage.evaluate((num) => {
        const allEls = document.querySelectorAll('a, button, span, li');
        for (const el of allEls) {
          if (el.textContent.trim() === String(num) && el.offsetParent !== null) {
            el.click();
            return true;
          }
        }
        return false;
      }, pageNum);
      if (!navResult) break;
      await adPage.waitForTimeout(2000);
    }
    
    const pageText = await adPage.evaluate(() => document.body.innerText);
    const found = newKws.filter(kw => pageText.includes(kw));
    const bidCheck = pageText.split('\n').filter(l => l.includes('1,500'));
    
    if (found.length > 0) {
      console.log(`Page ${pageNum}:`);
      found.forEach(k => console.log(`  ✅ ${k}`));
    }
  }
  
  // Final summary
  const allPagesText = await adPage.evaluate(() => document.body.innerText);
  const totalFound = newKws.filter(kw => allPagesText.includes(kw));
  console.log(`\n=== Summary: ${totalFound.length}/${newKws.length} new keywords found across all pages ===`);
  const notFound = newKws.filter(kw => !allPagesText.includes(kw));
  if (notFound.length > 0) {
    console.log('Not found (may be on pages 4+):', notFound.join(', '));
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
