const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // admin 블로그 통계 - 일간에서 주간/월간으로 변경
  console.log('1. 블로그 관리자 통계 - 주간 설정...');
  await page.goto('https://admin.blog.naver.com/aicut/stat/today?period=weekly', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(5000);

  // 통계 프레임 데이터 확인
  const statFrame = page.frames().find(f => f.url().includes('blog.stat.naver.com'));
  if (statFrame) {
    const text = await statFrame.evaluate(() => document.body.innerText);
    console.log('   [Weekly Stats Frame]');
    text.split('\n').filter(l => l.trim()).forEach(l => console.log('    ' + l));
  }

  // 월간으로 변경
  console.log('\n\n2. 블로그 관리자 통계 - 월간 설정...');
  await page.goto('https://admin.blog.naver.com/aicut/stat/today?period=monthly', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(5000);

  const statFrame2 = page.frames().find(f => f.url().includes('blog.stat.naver.com'));
  if (statFrame2) {
    const text = await statFrame2.evaluate(() => document.body.innerText);
    console.log('   [Monthly Stats Frame]');
    text.split('\n').filter(l => l.trim()).forEach(l => console.log('    ' + l));
  }

  // 게시글별 통계를 위한 다른 admin 페이지 시도
  console.log('\n\n3. 게시글 분석 페이지...');
  const postStatUrls = [
    'https://admin.blog.naver.com/aicut/stat/post',
    'https://admin.blog.naver.com/aicut/stat/ranking',
    'https://admin.blog.naver.com/aicut/contents/post',
  ];

  for (const url of postStatUrls) {
    console.log(`   시도: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await sleep(3000);
    const text = await page.evaluate(() => document.body.innerText);
    if (!text.includes('페이지 주소') && !text.includes('유효하지 않은')) {
      console.log('   ✅ 접속 성공');
      text.split('\n').filter(l => l.trim()).slice(0, 20).forEach(l => console.log('    ' + l.substring(0, 100)));
      
      // 프레임 확인
      const frames = page.frames();
      for (const f of frames) {
        if (f.url() !== 'about:blank' && !f.url().includes('admin.blog.naver.com')) {
          try {
            const ft = await f.evaluate(() => document.body.innerText).catch(() => '');
            if (ft && ft.length > 20) {
              console.log(`   [Frame: ${f.url().substring(0, 80)}]`);
              ft.split('\n').filter(l => l.trim()).slice(0, 15).forEach(l => console.log('    ' + l.substring(0, 100)));
            }
          } catch(e) {}
        }
      }
    }
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
