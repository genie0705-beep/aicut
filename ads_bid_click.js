const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  let p = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('ads.naver.com')) { p = pg; break; }
  }
  if (!p) { await b.close(); return; }
  await p.bringToFront();
  
  await p.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/campaigns/cmp-a001-01-000000010565267', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await p.waitForTimeout(3000);
  
  // 입찰가 1,500 버튼 클릭
  const result = await p.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.innerText.trim() === '1,500' && btn.className.includes('BidAmt')) {
        btn.click();
        return 'clicked bid button: ' + btn.className.substring(0, 40);
      }
    }
    return 'not found';
  });
  
  console.log(result);
  await p.waitForTimeout(2000);
  
  // 입력 필드가 나타났는지 확인
  const inputs = await p.evaluate(() => {
    const fields = document.querySelectorAll('input');
    return Array.from(fields).filter(f => f.offsetParent !== null).map(f => ({
      placeholder: f.placeholder || '',
      value: f.value,
      type: f.type
    }));
  });
  console.log('보이는 input:', JSON.stringify(inputs));
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));
