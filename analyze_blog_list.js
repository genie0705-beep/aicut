const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const page = await ctx.newPage();

  // PostList 페이지 직접 열기
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut&categoryNo=0&skinType=&skinId=&from=menu', {
    waitUntil: 'domcontentloaded', timeout: 20000
  }).catch(() => {});
  await new Promise(r => setTimeout(r, 5000));

  console.log('URL:', page.url().substring(0, 120));

  // mainFrame iframe 확인
  const frames = page.frames();
  console.log('프레임 수:', frames.length);

  let mf = frames.find(f => f.name() === 'mainFrame' || f.url().includes('PostList'));
  if (!mf) {
    // 모든 프레임 출력
    frames.forEach((f, i) => console.log(` [${i}] name=${f.name()} url=${f.url().substring(0, 100)}`));
    // mainFrame 찾기: name이 비어있지만 PostList 내용이 있는 프레임
    mf = frames.find(f => f.url().includes('blog.naver.com') && f.url().includes('PostList'));
  }

  if (!mf) {
    console.log('\nPostList 프레임 못찾음 → 페이지 직접 파싱');
    const html = await page.evaluate(() => document.body.innerText);
    console.log(html.substring(0, 5000));
    await b.close();
    process.exit(0);
  }

  console.log('\nmainFrame 발견:', mf.url().substring(0, 100));

  // 포스팅 목록 수집 (스크롤 다운으로 전체 로드)
  let prevCount = 0;
  for (let i = 0; i < 5; i++) {
    const count = await mf.evaluate(() => document.querySelectorAll('a[href*="logNo"]').length);
    if (count === prevCount && i > 0) break;
    prevCount = count;
    await mf.evaluate(() => window.scrollBy(0, 1500));
    await new Promise(r => setTimeout(r, 1500));
  }
  await new Promise(r => setTimeout(r, 2000));

  // 포스팅 전체 수집
  const posts = await mf.evaluate(() => {
    const items = [];
    const links = document.querySelectorAll('a[href*="logNo"]');
    
    links.forEach(a => {
      const title = a.innerText?.trim() || '';
      const href = a.getAttribute('href') || '';
      const logNo = href.match(/logNo=(\d+)/)?.[1] || '';
      
      if (title.length > 5 && logNo) {
        // 상위 요소에서 날짜/조회수 찾기
        let el = a.parentElement;
        let date = '', views = '', comments = '', category = '';
        
        for (let d = 0; d < 8; d++) {
          if (!el) break;
          const text = el.innerText || '';
          
          if (!date) {
            const dm = text.match(/(\d{4})[.\s]*(\d{1,2})[.\s]*(\d{1,2})/);
            if (dm) date = `${dm[1]}.${dm[2]}.${dm[3]}`;
          }
          if (!views) {
            const vm = text.match(/조회\s*([\d,]+)/);
            if (vm) views = vm[1];
          }
          if (!comments) {
            const cm = text.match(/댓글\s*([\d,]+)/);
            if (cm) comments = cm[1];
          }

          // 카테고리 찾기 (상단에 category 표시)
          const catEl = el.querySelector('a[href*="categoryNo"], [class*="category"]');
          if (catEl) {
            const ct = catEl.innerText?.trim() || '';
            if (ct && ct.length < 20 && !ct.includes('카테고리')) category = ct;
          }
          
          el = el.parentElement;
        }
        
        // 중복 제거
        if (!items.some(x => x.logNo === logNo)) {
          items.push({ title: title.substring(0, 80), date, views, comments, category, logNo });
        }
      }
    });
    
    return items;
  });

  console.log(`\n=== 전체 포스팅: ${posts.length}개 ===`);
  console.log('='.repeat(60));
  
  // 날짜순 정렬 (최신순)
  posts.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    return 0;
  });

  posts.forEach((p, i) => {
    const dateStr = p.date ? p.date.padEnd(12) : '날짜없음    ';
    const viewsStr = p.views ? `조회 ${p.views}` : '';
    const catStr = p.category ? `[${p.category}]` : '';
    console.log(` ${String(i+1).padStart(2)}. ${dateStr} ${catStr} ${p.title.substring(0, 55)}`);
    if (viewsStr) console.log(`     ${viewsStr}`);
  });

  // 요약
  console.log('\n=== 요약 ===');
  console.log(`총 포스팅: ${posts.length}개`);
  
  const dated = posts.filter(p => p.date);
  console.log(`날짜 있는 포스팅: ${dated.length}개`);
  
  // 월별/주별 분포
  const byDate = {};
  dated.forEach(p => {
    const month = p.date.substring(0, 7);
    byDate[month] = (byDate[month] || 0) + 1;
  });
  console.log('\n월별 발행 수:');
  Object.entries(byDate).sort().forEach(([m, c]) => console.log(` ${m}: ${c}개`));

  const withViews = posts.filter(p => p.views);
  if (withViews.length > 0) {
    const avgViews = withViews.reduce((s, p) => s + parseInt(p.views.replace(/,/g, '') || '0'), 0) / withViews.length;
    console.log(`\n평균 조회수: ${Math.round(avgViews).toLocaleString()}회 (${withViews.length}개 기준)`);
  }

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
