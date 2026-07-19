const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 최근 포스트 방문
  console.log('=== 최근 포스트 방문 ===\n');
  await page.goto('https://blog.naver.com/aicut/224333770986', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await sleep(6000);

  console.log('URL:', page.url().substring(0, 80));
  console.log('Frames:', page.frames().length);
  page.frames().forEach((f, i) => {
    if (f.url() !== 'about:blank') console.log(`  [${i}] ${f.url().substring(0, 100)}`);
  });

  // 메인 iframe (PostView) 찾기
  const mainFrame = page.frames().find(f => f.url().includes('PostView') || f.url().includes('aicut') && f.url().includes('224333770986'));
  let target = mainFrame || page;

  const data = await target.evaluate(() => {
    const text = document.body.innerText;
    const result = {};

    // 특정 키워드 찾기
    const keywords = ['조회', '공감', '댓글', '좋아요', '방문', '이웃'];
    for (const kw of keywords) {
      const idx = text.indexOf(kw);
      if (idx >= 0) {
        result[kw] = text.substring(Math.max(0, idx - 30), idx + 60).replace(/\n/g, ' ').trim();
      }
    }

    // HTML에서 추출 가능한 데이터
    const allText = text.split('\n').filter(l => l.trim());
    const statLines = allText.filter(l => /[0-9]/.test(l) && (l.includes('조회') || l.includes('공감') || l.includes('댓글') || l.includes('좋아요') || l.length < 20));
    
    result.statLines = statLines.slice(0, 15);
    result.preview = text.substring(0, 1000);
    return result;
  });

  console.log('\n=== 포스트 데이터 ===');
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'string') {
      console.log(`  ${key}: ${val.substring(0, 150)}`);
    } else {
      console.log(`  ${key}:`);
      val.forEach(l => console.log(`    ${l}`));
    }
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));
