const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  const saPage = pages.find(p => p.url().includes('searchadvisor.naver.com'));
  if (!saPage) { console.log('탭 없음'); await browser.close(); return; }

  await saPage.bringToFront();
  await saPage.goto('https://searchadvisor.naver.com/console/site/option?site=https://aicut.co.kr', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await saPage.waitForTimeout(3000);
  
  console.log('=== 도구 설정 (사이트맵) ===');
  const text = await saPage.evaluate(() => document.body.innerText);
  console.log(text.substring(0, 4000));

  // 사이트맵 등록 버튼 등 찾기
  const allLinks = await saPage.evaluate(() => {
    const links = [];
    document.querySelectorAll('a, button, input, textarea').forEach(el => {
      const tag = el.tagName;
      const text = el.innerText?.trim() || el.value || el.placeholder || '';
      const id = el.id;
      const name = el.getAttribute('name') || '';
      const type = el.getAttribute('type') || '';
      if (text || id || name) {
        links.push({ tag, text: text.substring(0, 80), id, name, type });
      }
    });
    return links;
  });
  console.log('\n=== 입력/버튼 요소 ===');
  allLinks.forEach(l => {
    if (l.tag === 'INPUT' || l.tag === 'TEXTAREA' || l.tag === 'BUTTON' || l.text.includes('맵') || l.text.includes('등록')) {
      console.log(JSON.stringify(l));
    }
  });

  await browser.close();
})();
