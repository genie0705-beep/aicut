const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  p.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  // Go to post page
  await p.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'networkidle', timeout: 15000 });
  await p.waitForTimeout(5000);

  console.log('URL:', p.url());

  // Check frames
  const frames = p.frames();
  console.log('Frames:', frames.length);
  for (const f of frames) {
    try {
      console.log('  [' + f.name() + ']', (f.url() || '').substring(0, 120));
    } catch(e) {}
  }

  // Find edit buttons - check main page first
  const editInfo = await p.evaluate(() => {
    const results = [];
    const allEls = document.querySelectorAll('a, button, span, div, li');
    for (const el of allEls) {
      const text = (el.textContent || '').trim();
      if ((text === '수정' || text.includes('글 수정') || text.includes('수정하기')) && el.offsetParent !== null) {
        results.push({
          tag: el.tagName,
          text: text,
          id: el.id || '',
          className: (el.className || '').substring(0, 60),
          href: el.href || el.getAttribute('href') || '',
          onclick: (el.getAttribute('onclick') || '').substring(0, 100)
        });
      }
    }
    return results;
  });
  console.log('수정 elements:', JSON.stringify(editInfo, null, 2));

  // Check for any link with Edit in href
  const editLinks = await p.evaluate(() => {
    const links = document.querySelectorAll('a');
    const result = [];
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      if (href.includes('Edit') || href.includes('edit') || href.includes('UPDATE')) {
        result.push({
          text: (link.textContent || '').trim().substring(0, 40),
          href: href.substring(0, 120),
          visible: link.offsetParent !== null
        });
      }
    }
    return result;
  });
  console.log('Edit links:', JSON.stringify(editLinks, null, 2));

  // Also check if there's a "관리" (manage) menu or blog tool buttons
  const tools = await p.evaluate(() => {
    const result = [];
    const allEls = document.querySelectorAll('a, button, span');
    for (const el of allEls) {
      const text = (el.textContent || '').trim();
      if (text.includes('관리') || text.includes('내메뉴') || text.includes('블로그관리') || text.includes('메뉴')) {
        if (el.offsetParent !== null) {
          result.push({ tag: el.tagName, text: text, id: el.id, cls: (el.className || '').substring(0, 50) });
        }
      }
    }
    return result;
  });
  console.log('관리 elements:', JSON.stringify(tools, null, 2));

  await p.close();
  b.disconnect();
})().catch(e => console.log('E:', e.message));
