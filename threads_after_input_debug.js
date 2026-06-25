const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  await page.goto('https://www.threads.com/@happyreels_pro/post/DYbyCy3ExQq', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);

  // 댓글 입력창 클릭
  await page.mouse.click(683, 933 + 20);
  await sleep(800);

  // 텍스트 입력
  await page.keyboard.type('좋은 인사이트네요 👍', { delay: 30 });
  await sleep(1500);

  // 입력 후 버튼 전체 스캔
  const btns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, [role="button"], [type="submit"]'))
      .map(b => {
        const rect = b.getBoundingClientRect();
        if (rect.width === 0) return null;
        return {
          tag: b.tagName,
          text: (b.innerText || '').trim().substring(0, 40),
          aria: b.getAttribute('aria-label') || '',
          type: b.getAttribute('type') || '',
          disabled: b.disabled,
          ariaDisabled: b.getAttribute('aria-disabled'),
          y: Math.round(rect.y),
          x: Math.round(rect.x),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        };
      })
      .filter(Boolean);
  });

  console.log('입력 후 모든 버튼:');
  btns.forEach(b => console.log(`  [y=${b.y}] "${b.text}" aria="${b.aria}" type="${b.type}" disabled=${b.disabled} ariaDisabled=${b.ariaDisabled}`));

  // SVG 버튼들도 확인
  const svgBtns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button svg, [role="button"] svg'))
      .map(svg => {
        const parent = svg.closest('button') || svg.closest('[role="button"]');
        if (!parent) return null;
        const rect = parent.getBoundingClientRect();
        if (rect.width === 0) return null;
        return {
          aria: parent.getAttribute('aria-label') || '',
          title: svg.querySelector('title')?.textContent || '',
          y: Math.round(rect.y),
          x: Math.round(rect.x)
        };
      })
      .filter(Boolean)
      .filter(b => b.aria || b.title);
  });
  console.log('\nSVG 아이콘 버튼:');
  svgBtns.forEach(b => console.log(`  [y=${b.y}] aria="${b.aria}" title="${b.title}"`));

  // Esc로 닫기
  await page.keyboard.press('Escape');
  await b.close();
})().catch(e => console.error('Fatal:', e.message.split('\n')[0]));
