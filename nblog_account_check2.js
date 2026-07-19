const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 네이버 계정/블로그 소유주 확인 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 1. naver.com 방문 - 로그인한 계정 이름 확인
  console.log('1. naver.com 로그인 상태...');
  await page.goto('https://www.naver.com', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(3000);
  const nt = await page.evaluate(() => document.body.innerText);
  console.log('   [Naver.com]');
  nt.split('\n').filter(l => l.trim()).slice(0, 30).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 100)}`));

  // 계정명 찾기
  const userLines = nt.split('\n').filter(l => l.includes('@') || l.includes('님'));
  if (userLines.length) console.log('   계정 힌트:', userLines.join(' | '));

  // 2. 서치어드바이저에 블로그 등록 확인
  console.log('\n2. 서치어드바이저 로그인 시도...');
  await page.goto('https://searchadvisor.naver.com/', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
  await sleep(3000);
  const sat = await page.evaluate(() => document.body.innerText);
  const saLoggedIn = !sat.includes('로그인') || sat.includes('로그아웃');
  console.log('   로그인:', saLoggedIn ? '✅' : '❌');
  if (saLoggedIn) {
    sat.split('\n').filter(l => l.trim()).slice(0, 30).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 100)}`));
  } else {
    console.log('   미로그인 상태');
  }

  // 3. 블로그에 "통계" 링크가 개별 포스트에 있는 것 확인
  // 통계 팝업이 뜨는지 확인
  console.log('\n3. 블로그 포스트 통계 팝업 확인...');
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut&categoryNo=0&parentCategoryNo=0', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
  await sleep(3000);
  
  const frames = page.frames();
  for (const f of frames) {
    if (f.url().includes('PostList')) {
      // "통계" 텍스트가 있는 버튼 확인
      const hasStats = await f.evaluate(() => {
        const text = document.body.innerText;
        const elems = document.querySelectorAll('a, span, button');
        const statsLinks = [];
        for (const e of elems) {
          if (e.innerText && e.innerText.trim() === '통계') {
            statsLinks.push({
              tag: e.tagName,
              text: e.innerText,
              href: e.href || '',
              onclick: e.getAttribute('onclick') || ''
            });
          }
        }
        return {
          found: statsLinks.length,
          links: statsLinks.slice(0, 5),
          textAround: text.substring(text.indexOf('통계') - 50, text.indexOf('통계') + 50)
        };
      });
      console.log('   통계 링크:', JSON.stringify(hasStats, null, 2));
      break;
    }
  }

  b.close();
})().catch(e => console.error('FATAL:', e.message));
