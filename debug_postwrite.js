const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  console.log('=== PostWrite 페이지 분석 ===');
  await page.goto('https://blog.naver.com/PostWrite.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await sleep(6000);

  console.log('URL:', page.url().substring(0, 100));
  console.log('Frames:', page.frames().length);
  page.frames().forEach((f, i) => {
    const u = f.url();
    if (u !== 'about:blank') console.log(`  [${i}] ${u.substring(0, 120)}`);
  });

  // 모든 iframe 찾기
  const iframes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('iframe')).map(f => ({
      id: f.id,
      name: f.name,
      src: (f.src || '').substring(0, 120),
      cls: f.className
    }));
  });
  
  console.log('\niframes on page:', iframes.length);
  iframes.forEach(f => console.log(`  id="${f.id}" name="${f.name}" src="${f.src}"`));

  // SmartEditor 전역 객체 확인
  const seInfo = await page.evaluate(() => {
    const result = {};
    result.hasSmartEditor = typeof SmartEditor !== 'undefined';
    result.hasSE = typeof SE !== 'undefined';
    result.hasjindo = typeof jindo !== 'undefined';
    result.windowKeys = Object.keys(window).filter(k => k.toLowerCase().includes('editor') || k.toLowerCase().includes('smart')).slice(0, 10);
    // body id, class
    result.bodyId = document.body.id;
    result.bodyClass = document.body.className;
    return result;
  });
  console.log('\nSmartEditor info:', JSON.stringify(seInfo, null, 2));

  // body text 미리보기
  const text = await page.evaluate(() => document.body.innerText);
  console.log('\nBody text preview:');
  text.split('\n').filter(l => l.trim()).slice(0, 20).forEach((l, i) => console.log(`  ${i}: ${l.substring(0, 100)}`));

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
