const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0];

  // 해시태그 페이지 확인
  await page.goto('https://www.instagram.com/explore/tags/%EA%B8%88%EC%9C%B5%EB%A7%88%EC%BC%80%ED%8C%85/', {
    waitUntil: 'domcontentloaded', timeout: 15000
  });
  await new Promise(r => setTimeout(r, 3000));

  // 게시물 링크 확인
  const posts = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="/p/"]'));
    return links.slice(0, 3).map(a => a.href);
  });
  console.log('Posts:', posts);

  if (posts.length > 0) {
    await page.goto(posts[0], { waitUntil: 'domcontentloaded', timeout: 12000 });
    await new Promise(r => setTimeout(r, 2000));

    // 모든 a 태그 href 확인
    const allLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href^="/"]'))
        .map(a => ({ href: a.href, text: a.innerText?.trim().substring(0, 30), class: a.className?.substring(0,50) }))
        .filter(a => a.href.match(/instagram\.com\/[^/p][^/]+\/?$/) )
        .slice(0, 10);
    });
    console.log('Author candidates:', JSON.stringify(allLinks, null, 2));

    // header 영역
    const header = await page.evaluate(() => {
      const h = document.querySelector('header');
      return h ? h.innerHTML.substring(0, 500) : 'NO HEADER';
    });
    console.log('Header snippet:', header.substring(0, 300));
  }

  await browser.close();
})().catch(e => console.error('ERR:', e.message));
