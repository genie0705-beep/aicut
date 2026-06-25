const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('postwrite'));
  if (!page) { console.log('탭 없음'); await b.close(); process.exit(0); }

  await new Promise(r => setTimeout(r, 1000));

  // 에디터 내용 읽기
  const currentText = await page.evaluate(() => {
    const ce = document.querySelector('[contenteditable]');
    if (!ce) return '';
    return ce.innerText || '';
  });

  console.log('=== 현재 에디터 내용 ===');
  console.log(currentText);
  console.log('\n=== 줄 수:', currentText.split('\n').length, '===', '글자수:', currentText.length);

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
