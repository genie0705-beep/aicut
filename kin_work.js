const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  
  // Find the 지식iN tab
  const pages = ctx.pages();
  let kinPage = null;
  for (const p of pages) {
    if (p.url().includes('kin.naver.com') && !p.url().includes('search')) {
      kinPage = p;
      break;
    }
  }
  
  if (!kinPage) {
    kinPage = await ctx.newPage();
    await kinPage.goto('https://kin.naver.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  }
  
  await kinPage.bringToFront();
  await kinPage.waitForTimeout(2000);
  
  // 검색어: 영상편집, 숏폼, 릴스 관련
  const searchTerms = ['영상편집 업체 추천', '숏폼 영상 제작', '인스타 릴스 편집', '영상편집 아웃소싱'];
  const searchTerm = searchTerms[0];
  
  // Find search input and type
  const input = await kinPage.$('input.search_input, input#nx_query, input[name=query]');
  if (input) {
    await input.click();
    await kinPage.waitForTimeout(300);
    await input.fill(searchTerm);
    await kinPage.waitForTimeout(500);
    await kinPage.keyboard.press('Enter');
    await kinPage.waitForTimeout(5000);
  }
  
  console.log('현재 URL:', kinPage.url().substring(0, 150));
  
  // 결과 확인
  const body = await kinPage.evaluate(() => document.body.innerText.substring(0, 8000));
  console.log(body);
  
  await b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 300)));
