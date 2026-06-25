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
  
  const html = await p.evaluate(() => document.documentElement.outerHTML);
  
  // Check for conversion related hrefs
  const hrefRegex = /href="[^"]*(?:conversion|tracking|전환)[^"]*"/gi;
  const matches = html.match(hrefRegex) || [];
  console.log('전환 관련 링크:');
  matches.forEach(m => console.log('  ' + m));
  
  // wcs script references
  const wcsRegex = /src="[^"]*(?:wcs|nasa)[^"]*"/gi;
  const wcsMatches = html.match(wcsRegex) || [];
  console.log('\nwcs 스크립트:');
  wcsMatches.forEach(m => console.log('  ' + m));
  
  // wa IDs
  const waRegex = /wa["']\s*[:=]\s*["'][^"']+["']/gi;
  const bodyText = await p.evaluate(() => document.body.innerText);
  const waInBody = bodyText.match(/wa["']?\s*[:=]/i);
  console.log('\nwa 관련:', waInBody || '없음');
  
  console.log('\nHTML에서 wa 찾기:');
  const waInHtml = html.match(/['\"]wa['\"]/g) || [];
  console.log('  wa 키 개수:', waInHtml.length);
  
  // Let's check the JavaScript files loaded for any config
  const scripts = await p.evaluate(() => {
    return Array.from(document.querySelectorAll('script')).map(s => s.src).filter(s => s);
  });
  console.log('\n로드된 스크립트:');
  scripts.forEach(s => console.log('  ' + s.substring(0, 80)));
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));
