const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 📊 블로그 게시글 순위/성과 분석 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('admin.blog.naver.com')) {
      page = p;
      break;
    }
  }
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://admin.blog.naver.com/aicut/stat/today', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await sleep(5000);
  }
  await page.bringToFront();
  await sleep(3000);

  // 1. 게시글 관리 페이지
  console.log('1. 게시글 관리...');
  await page.goto('https://admin.blog.naver.com/aicut/post/list', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(4000);

  // 전체 게시글 리스트 확인
  const postList = await page.evaluate(() => {
    const text = document.body.innerText;
    const result = {};

    // 게시글 목록 영역 찾기
    const lines = text.split('\n').filter(l => l.trim());
    result.lines = lines.slice(0, 80);

    // 숫자 데이터
    const numbers = text.match(/\d+/g) || [];
    result.numbers = numbers.slice(0, 10);

    return result;
  });

  console.log('   [Post list]');
  postList.lines.forEach((l, i) => console.log(`    ${i}: ${l.substring(0, 120)}`));

  // 2. 통계 - 게시글 순위
  console.log('\n2. 통계 게시글 순위...');
  // Naver blog stat post ranking
  const statUrls = [
    'https://admin.blog.naver.com/aicut/stat/today',
    'https://blog.stat.naver.com/blog/daily/ranking?blogId=aicut',
    'https://blog.stat.naver.com/blog/daily/post?blogId=aicut',
  ];

  for (const u of statUrls) {
    if (u.includes('admin.blog')) continue; // already on stat/today
    await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await sleep(3000);
  }

  // 현재 통계 프레임 데이터
  const statFrame = page.frames().find(f => f.url().includes('blog.stat.naver.com'));
  if (statFrame) {
    console.log('\n   [Stat Frame]');
    const ft = await statFrame.evaluate(() => document.body.innerText);
    ft.split('\n').filter(l => l.trim()).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 120)}`));

    // 게시글 순위 데이터가 있는지 더 자세히 확인
    const rankData = await statFrame.evaluate(() => {
      // 모든 visible text를 가진 요소 스캔
      const all = document.querySelectorAll('*');
      const rankItems = [];
      for (const el of all) {
        const t = el.textContent.trim();
        if (t && (t.startsWith('1.') || t.startsWith('2.') || t.startsWith('3.') || 
            t.includes('조회수') || el.className.includes('rank') || el.className.includes('title'))) {
          rankItems.push({
            tag: el.tagName,
            text: t.substring(0, 80),
            cls: el.className.substring(0, 40)
          });
        }
      }
      return rankItems.slice(0, 30);
    });

    if (rankData.length) {
      console.log('\n   [Rank elements]');
      rankData.forEach(r => console.log(`    <${r.tag}> .${r.cls} → ${r.text}`));
    } else {
      console.log('   ❌ 순위 데이터 없음');
    }
  }

  // 3. 블로그 전체 게시글 리스트 (프론트엔드에서 더보기)
  console.log('\n3. 블로그 전체 게시글 (public)...');
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
  await sleep(3000);

  const blogFrame = page.frames().find(f => f.url().includes('PostList'));
  if (blogFrame) {
    const ft = await blogFrame.evaluate(() => document.body.innerText);
    const lines = ft.split('\n').filter(l => l.trim());
    
    // 제목과 날짜만 추출
    console.log('   [All visible posts]');
    lines.forEach((l, i) => {
      if (/2026|영상|부동산|피부과|보험|커머스|라이브|편집|숏폼|마케팅|프리랜서|교육|병원/.test(l) || /^\d/.test(l)) {
        console.log(`    ${l.substring(0, 100)}`);
      }
    });
  }

  b.close();
})().catch(e => console.error('FATAL:', e.message));
