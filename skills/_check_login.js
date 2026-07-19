const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  
  // 현재 열린 탭 모두 확인
  const pages = ctx.pages();
  console.log('현재 탭 수:', pages.length);
  
  // 새 탭에서 블로그 열기
  await p.goto('https://blog.naver.com/aicut', {
    waitUntil: 'domcontentloaded',
    timeout: 20000
  });
  await p.waitForTimeout(5000);
  
  console.log('현재 URL:', p.url());
  console.log('title:', await p.title());
  
  // 페이지 콘텐츠 확인
  const content = await p.evaluate(() => {
    return {
      url: location.href,
      bodyChildren: document.body.children.length,
      bodyHTML_sample: document.body.innerHTML.slice(0, 500),
      scripts: Array.from(document.scripts).map(s => s.src.slice(0,100) || 'inline').slice(0,10),
    };
  });
  console.log(JSON.stringify(content, null, 2));
  
  await b.close();
}

main().catch(e => console.error('❌', e.message));
