const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  try { await page.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e) {}
  await new Promise(r => setTimeout(r, 3000));

  const box = await page.$('[contenteditable="true"]');
  if (!box) { console.log('no box'); await b.close(); return; }

  await box.click();
  await new Promise(r => setTimeout(r, 300));
  await page.keyboard.type('테스트 게시글입니다 #에이컷 #영상제작', { delay: 20 });
  await new Promise(r => setTimeout(r, 500));

  console.log('입력 완료. Ctrl+Enter 시도...');
  await page.keyboard.press('Control+Enter');
  await new Promise(r => setTimeout(r, 3000));
  console.log('URL:', page.url());

  // 다시 확인
  const profile = await page.evaluate(() => document.body.innerText.substring(200, 600));
  console.log('페이지:', profile);

  await b.close();
})().catch(e => console.error('ERR:', e.message));
