const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[4];

  await page.goto('https://adsmanager.facebook.com/adsmanager/manage/campaigns', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(4000);

  // 계정 전환 드롭다운 클릭
  const switched = await page.evaluate(() => {
    // 계정 이름/번호 근처 드롭다운
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const btn = btns.find(b => {
      const t = b.innerText || '';
      return t.includes('604720592929987') || t.includes('계정 전환') || t.includes('광고 계정');
    });
    if (btn) { btn.click(); return btn.innerText?.substring(0, 50); }
    return false;
  });
  console.log('드롭다운 클릭:', switched);
  await sleep(2000);

  // 드롭다운 후 계정 목록
  const accounts = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('[role="option"], [role="menuitem"], li'));
    return items.map(i => i.innerText?.trim().substring(0, 80)).filter(t => t && t.length > 3).slice(0, 20);
  });
  console.log('\n계정 목록:');
  accounts.forEach(a => console.log(' ', a));

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
