const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  
  await p.goto('https://blog.naver.com/PostWrite.naver?blogNaverId=aicut&categoryNo=2', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await p.waitForTimeout(8000);
  
  await p.screenshot({ path: 'debug_se4.png', fullPage: true });
  console.log('✅ 스크린샷 저장: debug_se4.png');
  
  // body text (first 500 chars)
  const bodyText = await p.evaluate(() => {
    return (document.body.innerText || '').slice(0, 800);
  });
  console.log('📄 body text:', bodyText);
  
  // HTML 구조 (일부)
  const html = await p.evaluate(() => {
    return document.body.innerHTML.slice(0, 2000);
  });
  console.log('📄 body HTML (first 2k):', html);
  
  await b.close();
}

main().catch(e => console.error('❌', e.message));
