const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // 방법1: admin.blog.naver.com 글 관리 페이지에서 처리
  let adminPage = pages.find(p => p.url().includes('admin.blog'));
  if (adminPage) {
    console.log('admin.blog 탭 발견');
    await adminPage.bringToFront();
    await sleep(2000);
    
    // '메뉴·글·동영상 관리' 링크 찾기
    const menuText = await adminPage.evaluate(() => {
      const all = document.querySelectorAll('a, button, span, div');
      for (const el of all) {
        const t = (el.innerText || '').trim();
        if (t.includes('메뉴') && t.includes('글') && t.includes('동영상')) {
          return { text: t, tag: el.tagName, href: el.getAttribute('href') || '' };
        }
      }
      return null;
    });
    console.log('메뉴·글·동영상 관리:', JSON.stringify(menuText));
    
    if (menuText && menuText.href) {
      await adminPage.goto(menuText.href, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
      await sleep(5000);
      
      const pageText = await adminPage.evaluate(() => document.body.innerText);
      console.log('페이지 내용 샘플:', pageText.substring(0, 500));
    }
  }
  
  // 방법2: 직접 URL 열기
  console.log('\n=== 방법2: 직접 URL 접속 ===');
  const newPage = await b.contexts()[0].newPage();
  await newPage.goto('https://admin.blog.naver.com/aicut/posts?status=TEMPORARY', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(5000);
  
  const text = await newPage.evaluate(() => document.body.innerText);
  const lines = text.split('\n').filter(l => l.trim());
  console.log('임시저장 페이지:');
  lines.slice(0, 50).forEach((l, i) => console.log(i + ': ' + l.substring(0, 80)));
  
  await newPage.close();
  await b.close();
})();
