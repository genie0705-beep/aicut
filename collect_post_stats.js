const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 📊 게시글별 조회수/공감수/댓글수 수집 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 1. PostList 페이지에서 JSON 데이터 추출
  console.log('1. 게시글 목록 수집...');
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await sleep(5000);

  const postFrame = page.frames().find(f => f.url().includes('PostList'));
  if (!postFrame) { console.log('PostList 프레임 없음'); b.close(); return; }

  // JSON 데이터와 post 목록 추출
  const postMeta = await postFrame.evaluate(() => {
    const result = { titles: [], logNos: [] };
    
    // JSON 데이터 파싱
    const text = document.body.innerText;
    const jsonMatch = text.match(/\[{"title":"[^"]+","source":"[^"]+","logNo":\d+.*?}\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        result.parsedPosts = parsed.map(p => ({ title: p.title, logNo: p.logNo, source: p.source }));
      } catch(e) {}
    }

    // 모든 post title + logNo 수집
    const links = document.querySelectorAll('a[href*="/aicut/"]');
    const seen = new Set();
    for (const a of links) {
      const href = a.href || '';
      const text = a.textContent.trim();
      const logMatch = href.match(/\/aicut\/(\d+)/);
      if (logMatch && text.length > 5 && !seen.has(text)) {
        seen.add(text);
        result.titles.push(text.substring(0, 80));
        result.logNos.push(logMatch[1]);
      }
    }
    
    return result;
  });

  let posts = [];
  if (postMeta.parsedPosts && postMeta.parsedPosts.length > 0) {
    posts = postMeta.parsedPosts;
    console.log(`   JSON 파싱: ${posts.length}개 게시글`);
    posts.forEach(p => console.log(`    ${p.title.substring(0, 60)} (${p.logNo})`));
  } else {
    console.log('   JSON 파싱 실패, 링크에서 수집');
    for (let i = 0; i < postMeta.titles.length; i++) {
      posts.push({ title: postMeta.titles[i], logNo: postMeta.logNos[i] });
    }
    console.log(`   수집: ${posts.length}개`);
  }

  // 2. 각 게시글 페이지 방문해서 조회수/공감수/댓글수 수집
  console.log('\n2. 게시글별 통계 수집 중...');
  const results = [];

  for (let i = 0; i < Math.min(posts.length, 48); i++) {
    const p = posts[i];
    const url = `https://blog.naver.com/aicut/${p.logNo}`;
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await sleep(3000);

      // mainFrame iframe 안으로 접근
      const mainFrame = page.frames().find(f => f.url().includes('PostView') || f.url().includes('aicut') && f.url().includes(p.logNo));
      let statsText = '';
      
      if (mainFrame) {
        statsText = await mainFrame.evaluate(() => document.body.innerText);
      } else {
        statsText = await page.evaluate(() => document.body.innerText);
      }

      // 공감수
      const sympathyMatch = statsText.match(/공감[^0-9]*(\d+)/) || statsText.match(/(\d+)명[^]*?공감/);
      
      // 조회수 (on Naver blog)
      const viewMatch = statsText.match(/조회[^0-9]*(\d[0-9,]*)회/) || statsText.match(/조회수[^0-9]*(\d[0-9,]*)/);
      
      // 댓글수
      const commentMatch = statsText.match(/댓글[^0-9]*(\d+)/);
      
      // 본문에서 공감 버튼 수
      const likeBtnMatch = statsText.match(/좋아요[^0-9]*(\d+)/);
      
      const result = {
        title: p.title.substring(0, 60),
        views: viewMatch ? viewMatch[1] : '?',
        sympathy: sympathyMatch ? sympathyMatch[1] : '?',
        comments: commentMatch ? commentMatch[1] : '?',
        likes: likeBtnMatch ? likeBtnMatch[1] : '?',
      };
      
      results.push(result);
      console.log(`  [${i+1}/${posts.length}] 조회:${result.views} 공감:${result.sympathy} 댓글:${result.comments} | ${result.title}`);
      
    } catch(e) {
      console.log(`  [${i+1}/${posts.length}] ❌ ${p.title.substring(0, 40)} - ${e.message.substring(0, 40)}`);
      results.push({ title: p.title.substring(0, 60), views: 'ERR', sympathy: 'ERR', comments: 'ERR' });
    }
  }

  // 3. 결과 정렬 (조회수 높은 순)
  console.log('\n\n━━━ 📊 게시글 성과 순위 (조회수 기준) ━━━');
  const sorted = results
    .filter(r => r.views !== '?' && r.views !== 'ERR')
    .sort((a, b) => parseInt(b.views.replace(/,/g,'')) - parseInt(a.views.replace(/,/g,'')));
  
  sorted.forEach((r, i) => {
    console.log(`  ${i+1}. [👁${r.views} ❤${r.sympathy} 💬${r.comments}] ${r.title}`);
  });

  b.close();
})().catch(e => console.log('FATAL:', e.message));
