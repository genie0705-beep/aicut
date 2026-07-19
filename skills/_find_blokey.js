// blokey 탭 찾기 + 키워드 분석
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  console.log('=== 전체 탭 탐색 ===');
  for (const p of pages) {
    const url = p.url();
    const title = await p.title().catch(() => '?');
    if (url.includes('blokey') || url.includes('bloKey') || title.toLowerCase().includes('blokey')) {
      console.log(`✅ blokey 발견: ${url.slice(0, 100)}`);
      console.log(`   title: ${title}`);
      console.log(`   body: ${(await p.evaluate(() => (document.body.innerText || '').slice(0, 1000)).catch(() => '?'))}`);
      await p.screenshot({ path: 'debug_blokey.png', fullPage: true });
    }
  }
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));
