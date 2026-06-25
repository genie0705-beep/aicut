const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  const pages = ctx.pages();
  let p = null;
  for (const pg of pages) {
    if (pg.url().includes('ads.naver.com') || pg.url().includes('searchad')) { p = pg; break; }
  }
  if (!p) {
    p = await ctx.newPage();
    await p.goto('https://ads.naver.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  }
  await p.bringToFront();

  // searchad.naver.com 으로 이동 (전환추적)
  const urls = [
    'https://searchad.naver.com/manage/conversion-tracking',
    'https://searchad.naver.com/manage/tools/conversion-tracking',
    'https://ads.naver.com/manage/ad-accounts/334739/tools/conversion-tracking',
    'https://searchad.naver.com'
  ];
  
  let success = false;
  for (const url of urls) {
    try {
      await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await p.waitForTimeout(3000);
      const text = await p.evaluate(() => document.body.innerText);
      if (text.includes('전환') || text.includes('conversion') || text.includes('tracking') || !text.includes('페이지를 찾을 수 없습니다')) {
        console.log('✅ 접속 성공:', url);
        console.log('=== 페이지 내용 ===');
        console.log(text.substring(0, 2000));
        success = true;
        break;
      }
    } catch(e) {}
  }
  
  if (!success) {
    // searchad 메인에서 전환추적 메뉴 찾기
    await p.goto('https://searchad.naver.com', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await p.waitForTimeout(3000);
    
    console.log('=== searchad 메인 ===');
    const body = await p.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const convLinks = links.filter(a => a.href && (a.href.includes('conversion') || a.href.includes('전환') || a.innerText.includes('전환'))).map(a => ({
        text: a.innerText.trim().substring(0, 30),
        href: a.href.substring(0, 100)
      }));
      return {
        url: window.location.href.substring(0, 100),
        body: document.body.innerText.substring(0, 1000),
        links: convLinks
      };
    });
    console.log('URL:', body.url);
    console.log('본문:', body.body.substring(0, 500));
    console.log('\n전환 관련 링크:', JSON.stringify(body.links));
  }

  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));
