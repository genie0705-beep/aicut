const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  
  const page = await ctx.newPage();
  await page.goto('https://search.naver.com/search.naver?query=에이컷', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  const data = await page.evaluate(() => {
    const result = {};
    
    // 전체 텍스트
    result.fullText = document.body.innerText.substring(0, 1500);
    
    // aicut 관련 텍스트 찾기
    result.hasAicut = document.body.innerText.includes('aicut') || 
                      document.body.innerText.includes('에이컷') ||
                      document.body.innerText.includes('AICUT');
    
    // 검색 결과 링크 찾기
    const links = document.querySelectorAll('a');
    const aicutLinks = [];
    for (const a of links) {
      const href = a.getAttribute('href') || '';
      if (href.includes('aicut') || (a.innerText || '').includes('에이컷')) {
        aicutLinks.push({
          text: (a.innerText || '').substring(0, 60),
          href: href.substring(0, 80)
        });
      }
    }
    result.aicutLinks = aicutLinks;
    
    // URL
    result.url = window.location.href;
    result.title = document.title;
    
    return result;
  });
  
  console.log('=== 네이버 검색: "에이컷" ===');
  console.log('에이컷 관련 결과 있음:', data.hasAicut);
  console.log('발견된 AICUT 링크:', JSON.stringify(data.aicutLinks));
  console.log('\n=== 검색 결과 텍스트 (1500자) ===');
  console.log(data.fullText);
  
  await page.close();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
