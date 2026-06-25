const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  try {
    await page.goto('https://www.threads.com/@happyreels_pro/post/DYbyCy3ExQq', { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch(e) {}
  await sleep(4000);

  // contenteditable, placeholder, input 등 입력 요소 찾기
  const inputs = await page.evaluate(() => {
    const results = [];
    // contenteditable
    document.querySelectorAll('[contenteditable]').forEach(el => {
      const rect = el.getBoundingClientRect();
      results.push({
        type: 'contenteditable',
        value: el.getAttribute('contenteditable'),
        placeholder: el.getAttribute('data-placeholder') || el.getAttribute('placeholder') || '',
        ariaLabel: el.getAttribute('aria-label') || '',
        ariaPlaceholder: el.getAttribute('aria-placeholder') || '',
        text: el.innerText?.trim().substring(0, 30),
        y: Math.round(rect.y),
        visible: rect.width > 0
      });
    });
    // textarea, input
    document.querySelectorAll('textarea, input[type="text"]').forEach(el => {
      const rect = el.getBoundingClientRect();
      results.push({
        type: el.tagName,
        placeholder: el.placeholder,
        y: Math.round(rect.y),
        visible: rect.width > 0
      });
    });
    return results;
  });

  console.log('입력 요소:');
  inputs.forEach(i => console.log(JSON.stringify(i)));

  // y=749 근처 버튼 클릭 (좋아요/댓글 아이콘 행)
  console.log('\n댓글 아이콘 (y=815) 클릭 시도...');
  // 두번째 아이콘이 댓글일 가능성 - 815행 두번째
  const commentBtnCoord = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const row = btns.filter(b => {
      const rect = b.getBoundingClientRect();
      return rect.y > 800 && rect.y < 840 && rect.width > 0;
    });
    return row.map(b => {
      const rect = b.getBoundingClientRect();
      return { x: Math.round(rect.x + rect.width/2), y: Math.round(rect.y + rect.height/2), text: b.innerText?.trim() };
    });
  });
  console.log('815행 버튼들:', JSON.stringify(commentBtnCoord));

  await b.close();
})().catch(e => console.error('Fatal:', e.message.split('\n')[0]));
