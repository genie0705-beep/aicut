const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 4000));

  const text = await page.evaluate(() => document.body.innerText);

  console.log('=== 블로그 발행 확인 ===\n');

  const hasEdu = text.includes('온라인 강의') || text.includes('교육 콘텐츠');
  const hasShopping = text.includes('쇼핑몰') || text.includes('이커머스');

  console.log('온라인 강의 포스팅:', hasEdu ? '✅ 발행됨' : '❌ 없음');
  console.log('쇼핑몰 포스팅:', hasShopping ? '✅ 발행됨' : '❌ 없음');

  const match = text.match(/전체보기\s*(\d+)개/);
  console.log('전체 포스팅 수:', match ? match[1] + '개' : '확인 불가');

  // 최신 포스팅 찾기
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('AICUT') && lines[i].includes('・')) {
      const title = lines[i - 1] || '';
      const date = lines[i];
      console.log('최신 포스팅:', title.substring(0, 50), '|', date.substring(0, 30));
      break;
    }
  }

  await page.close();
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
