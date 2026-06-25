const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[4];

  try {
    await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch(e) {}
  await sleep(3000);

  // 모든 링크 + 버튼 aria-label 스캔
  const elements = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('a, button, [role="button"], [role="link"]'));
    return els.map(el => {
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        text: (el.innerText || '').trim().substring(0, 20),
        aria: el.getAttribute('aria-label') || '',
        href: el.href || '',
        visible: rect.width > 0 && rect.height > 0,
        x: Math.round(rect.x),
        y: Math.round(rect.y)
      };
    }).filter(e => e.visible && (e.aria || e.text)).slice(0, 30);
  });

  console.log('네비게이션 요소:');
  elements.forEach(e => console.log(`  [y=${e.y}] ${e.tag} text="${e.text}" aria="${e.aria}" href="${e.href.substring(0,40)}"`));

  // SVG title 스캔
  const svgTitles = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('svg title'))
      .map(t => t.textContent)
      .filter(Boolean);
  });
  console.log('\nSVG 타이틀:', svgTitles);

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
