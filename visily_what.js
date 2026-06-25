const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  let pages = ctx.pages();
  let page = null;
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].url().includes('visily.ai')) { page = pages[i]; break; }
  }
  if (!page) { console.log('Visily not found'); await b.close(); return; }

  await page.bringToFront();
  await new Promise(r => setTimeout(r, 2000));

  // Escape to close popups
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 1000));

  // Get the board's canvas elements - look for any rendered content
  const result = await page.evaluate(() => {
    const texts = [];
    // Try to find board content via data attributes or aria labels
    const all = document.querySelectorAll('[aria-label], [data-element-id], [data-testid]');
    all.forEach(el => {
      const aria = el.getAttribute('aria-label');
      const dataId = el.getAttribute('data-element-id');
      const testId = el.getAttribute('data-testid');
      const inner = el.innerText || '';
      
      // Look for relevant labels
      if ((aria && aria.includes('table')) || (aria && aria.includes('column')) ||
          (aria && aria.includes('TB_')) || (aria && aria.includes('ERD')) ||
          (testId && testId.includes('shape')) && inner.trim()) {
        texts.push({ aria, testId, text: inner.trim().substring(0, 100) });
      }
      
      // Also get any text that has table-like content
      if (inner.includes('TB_') || inner.includes('PRIMARY') || inner.includes('FOREIGN') ||
          inner.includes('VARCHAR') || inner.includes('INTEGER')) {
        texts.push({ source: 'innerText', text: inner.trim().substring(0, 150) });
      }
    });
    
    return { found: texts.length, items: texts.slice(0, 40) };
  });

  console.log('Total elements found: ' + result.found);
  result.items.forEach((item, i) => {
    console.log((i+1) + '. ' + (item.aria || item.testId || '') + ' -> ' + item.text);
  });

  if (result.found === 0) {
    // The board content is likely in a WebGL/canvas that I can't read
    console.log('\n(보드 내용이 캔버스 내부에만 렌더링되어 읽을 수 없음)');
    console.log('Visily는 HTML canvas 방식으로 렌더링하기 때문에');
    console.log('텍스트로 내용을 추출할 수 없습니다.');
  }

  // Screenshot
  await page.screenshot({ path: 'visily_board_full.png' });
  console.log('\nScreenshot: visily_board_full.png');

  await b.close();
})().catch(e => console.log('ERR:', e.message));
