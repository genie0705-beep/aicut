const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  
  // Find Canva tab
  let p = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('canva.com') && pg.url().includes('canva.com/')) { p = pg; break; }
  }
  if (!p) { console.log('no canva page'); await b.close(); return; }
  await p.bringToFront();
  await p.waitForTimeout(2000);

  // Go to create new design
  await p.goto('https://www.canva.com/design/create', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await p.waitForTimeout(5000);

  console.log('URL:', p.url());
  const pageInfo = await p.evaluate(() => {
    const body = document.body.innerText.substring(0, 1500);
    // Find custom size option
    const customSizeEls = Array.from(document.querySelectorAll('*')).filter(el => {
      const t = el.innerText || '';
      return t.includes('사용자 지정') || t.includes('custom') || t.includes('Custom');
    }).slice(0, 5).map(el => ({ tag: el.tagName, text: el.innerText.substring(0, 40) }));
    
    return { body: body, customSizeEls };
  });
  
  console.log('=== 디자인 생성 페이지 ===');
  console.log(pageInfo.body);
  console.log('\n사용자 지정 관련:', JSON.stringify(pageInfo.customSizeEls));
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));
