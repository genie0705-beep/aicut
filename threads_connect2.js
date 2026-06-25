const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  try { await page.goto('https://www.threads.com/login', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e) {}
  await new Promise(r => setTimeout(r, 3000));

  // 버튼/링크 전체 목록
  const els = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a, [role="button"]')).map(el => ({
      tag: el.tagName,
      text: el.innerText?.trim().substring(0, 40),
      href: el.href || '',
      role: el.getAttribute('role')
    })).filter(el => el.text || el.href);
  });
  console.log('클릭 가능 요소:', JSON.stringify(els.slice(0, 15), null, 2));

  // div로 감싸진 버튼 시도 - "Instagram으로 계속하기" + aicut.official 포함 영역
  const clicked = await page.evaluate(() => {
    // 텍스트로 찾기
    const all = Array.from(document.querySelectorAll('*'));
    for (const el of all) {
      if (el.children.length === 0 && el.innerText?.includes('Instagram으로 계속하기')) {
        let parent = el;
        for (let i = 0; i < 5; i++) {
          if (!parent.parentElement) break;
          parent = parent.parentElement;
          if (parent.tagName === 'BUTTON' || parent.getAttribute('role') === 'button') {
            parent.click();
            return 'clicked: ' + parent.tagName;
          }
        }
        el.click();
        return 'clicked el directly';
      }
    }
    return 'not found';
  });
  console.log('결과:', clicked);
  await new Promise(r => setTimeout(r, 5000));
  console.log('URL 이후:', page.url());

  await b.close();
})().catch(e => console.error('ERR:', e.message));
