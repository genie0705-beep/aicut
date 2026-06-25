const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 확장 소재 탭 클릭
  const r1 = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText?.trim() === '확장 소재');
    if (btn) { btn.click(); return '확장 소재 탭 클릭'; }
    return '없음';
  });
  console.log(r1);
  await sleep(2000);

  await page.screenshot({ path: 'naver_ext_tab.png' });

  const state = await page.evaluate(() => ({
    btns: Array.from(document.querySelectorAll('button')).map(b=>b.innerText?.trim()).filter(t=>t&&t.length<30).slice(0,20),
    text: document.body.innerText.substring(2000, 3500)
  }));
  console.log('확장 소재 탭 버튼:', state.btns);
  console.log('내용:', state.text.substring(0,500));

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
