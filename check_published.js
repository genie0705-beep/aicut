const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  // 블로그 메인 페이지에서 최신 글 확인
  await page.goto('https://blog.naver.com/aicut', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  // 최신 포스트 URL 찾기
  const links = await page.evaluate(() => {
    // 네이버 블로그의 최신 글 링크 찾기
    const allLinks = Array.from(document.querySelectorAll('a[href*="223"]'));
    return allLinks.slice(0, 5).map(a => ({
      href: a.href,
      text: (a.innerText || a.title || '').trim().substring(0, 50),
    }));
  });
  
  console.log('블로그 링크들:', JSON.stringify(links, null, 2));
  
  // 페이지 타이틀
  const title = await page.title();
  console.log('페이지 타이틀:', title);
  
  // 첫 번째 포스트 링크 클릭
  const postLinks = await page.evaluate(() => {
    // 네이버 블로그 포스트 링크 패턴
    const anchors = Array.from(document.querySelectorAll('a'));
    return anchors
      .filter(a => a.href && a.href.includes('/aicut/') && a.href.includes('223'))
      .slice(0, 3)
      .map(a => ({ href: a.href, text: (a.innerText || '').substring(0, 60) }));
  });
  
  console.log('포스트 링크:', JSON.stringify(postLinks, null, 2));
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));
