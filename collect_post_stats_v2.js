const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 📊 게시글 성과 데이터 수집 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 1. PostList에서 게시글 title + logNo 수집
  console.log('1. 게시글 목록 수집...');
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut&categoryNo=0', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await sleep(5000);

  const posts = await page.evaluate(() => {
    const text = document.body.innerText;
    const lines = text.split('\n').filter(l => l.trim());
    const result = [];
    
    // title 다음에 logNo가 있는 link 찾기
    const links = document.querySelectorAll('a');
    const seen = new Set();
    
    for (const a of links) {
      const href = a.href || '';
      const logMatch = href.match(/\/aicut\/(\d+)/);
      if (logMatch) {
        const logNo = logMatch[1];
        if (!seen.has(logNo)) {
          seen.add(logNo);
          result.push({ logNo });
        }
      }
    }

    return result;
  });

  console.log(`   총 ${posts.length}개 게시글 발견`);
  posts.slice(0, 50).forEach((p, i) => console.log(`    ${i+1}. logNo: ${p.logNo}`));

  if (posts.length === 0) {
    console.log('   ❌ 게시글 링크 없음');
    b.close();
    return;
  }

  // 2. 각 게시글 방문해서 조회수 수집
  console.log('\n2. 게시글별 데이터 수집...');
  const results = [];

  for (let i = 0; i < Math.min(posts.length, 48); i++) {
    const post = posts[i];
    const url = `https://blog.naver.com/aicut/${post.logNo}`;
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await sleep(4000);

      // iframe 확인
      const frame = page.frames().find(f => f.url().includes('PostView') || (f.url().includes(post.logNo)));
      
      let pageText = '';
      if (frame) {
        pageText = await frame.evaluate(() => document.body.innerText).catch(() => '');
      } else {
        pageText = await page.evaluate(() => document.body.innerText).catch(() => '');
      }

      // 조회수 찾기 - 다양한 패턴
      const views = pageText.match(/조회수[^0-9]*([0-9,]+)/) || 
                    pageText.match(/조회[^0-9]*([0-9,]+)회/) ||
                    pageText.match(/([0-9,]+)회[^]*?조회/);

      // 공감수 찾기
      const sympathy = pageText.match(/공감[^0-9]*(\d+)/) ||
                       pageText.match(/(\d+)명이[^]*?공감/) ||
                       pageText.match(/좋아요[^0-9]*(\d+)/);

      // 댓글수
      const comments = pageText.match(/댓글[^0-9]*(\d+)/);

      // 제목 찾기
      const title = pageText.match(/<title>([^<]+)/) || ['?'];
      const titleClean = typeof title[1] === 'string' ? title[1].substring(0, 60).replace(/<[^>]+>/g, '') : '?';

      results.push({
        logNo: post.logNo,
        title: titleClean,
        views: views ? views[1] : '0',
        sympathy: sympathy ? sympathy[1] : '0',
        comments: comments ? comments[1] : '0',
      });

      process.stdout.write(`  [${i+1}/${posts.length}] ✅ 조회:${views ? views[1] : '0'} | ${titleClean.substring(0, 40)}\n`);

    } catch(e) {
      results.push({ logNo: post.logNo, title: '?', views: '0', sympathy: '0', comments: '0' });
      process.stdout.write(`  [${i+1}/${posts.length}] ❌ ${e.message.substring(0, 40)}\n`);
    }
  }

  // 3. 결과 정리
  console.log('\n\n━━━ 📊 게시글 성과 순위 (조회수 기준) ━━━');
  const sorted = results
    .filter(r => r.views !== '0' && r.views !== '?')
    .sort((a, b) => parseInt(b.views.replace(/,/g,'')) - parseInt(a.views.replace(/,/g,'')));

  if (sorted.length === 0) {
    console.log('   조회수 데이터를 수집할 수 없습니다.');
    console.log('   샘플 텍스트:', results[0] ? JSON.stringify(results[0]) : '없음');
  } else {
    sorted.forEach((r, i) => {
      console.log(`  ${i+1}. [👁${r.views} ❤${r.sympathy} 💬${r.comments}] ${r.title}`);
    });
  }

  console.log(`\n   총 ${results.length}개 중 ${sorted.length}개 데이터 확보`);
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));
