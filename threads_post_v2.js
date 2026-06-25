const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  try { await page.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e) {}
  await new Promise(r => setTimeout(r, 4000));

  // 새로운 스레드 버튼 클릭 후 입력창 활성화
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const btn = btns.find(b => b.innerText?.trim() === '새로운 스레드');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // 이 시점에서의 모든 요소 확인
  const allEditable = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[contenteditable]')).map(e => ({
      ph: e.getAttribute('aria-placeholder') || '',
      ce: e.getAttribute('contenteditable'),
      visible: e.offsetParent !== null,
      text: e.innerText?.substring(0, 30)
    }))
  );
  console.log('editable:', JSON.stringify(allEditable, null, 2));

  const box = await page.$('[contenteditable="true"]');
  console.log('box:', !!box);

  if (box) {
    await box.click();
    await new Promise(r => setTimeout(r, 300));
    await page.keyboard.type('테스트 글입니다 #에이컷', { delay: 20 });
    await new Promise(r => setTimeout(r, 500));

    // Ctrl+Enter
    await page.keyboard.press('Control+Enter');
    await new Promise(r => setTimeout(r, 3000));

    // 프로필로 이동해 게시글 확인
    try { await page.goto('https://www.threads.com/@aicut.official', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e) {}
    await new Promise(r => setTimeout(r, 3000));
    const posts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-pressable-container], article')).map(a => a.innerText?.substring(0, 80)).filter(Boolean)
    );
    console.log('게시글 수:', posts.length);
    posts.forEach((p, i) => console.log(`[${i+1}]`, p.replace(/\n/g, ' ')));
  }

  await b.close();
})().catch(e => console.error('ERR:', e.message));
