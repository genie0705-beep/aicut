const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const page = await ctx.newPage();

  // 블로그 메인 (mainFrame 존재)
  await page.goto('https://blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 5000));

  const mf = page.frame({ name: 'mainFrame' });
  if (!mf) {
    console.log('mainFrame 없음');
    await b.close();
    process.exit(0);
  }
  console.log('mainFrame 접근 완료');

  // "전체보기" 버튼 클릭 시도 (목록뷰로 전환)
  const clicked = await mf.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, span, div'));
    for (const el of links) {
      const t = el.innerText?.trim() || '';
      if (t.includes('전체보기') || t.includes('목록')) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          el.click();
          return { text: t, x: r.x, y: r.y };
        }
      }
    }
    return null;
  });
  console.log('전체보기 클릭:', clicked ? '✅' : '❌ 없음');
  await new Promise(r => setTimeout(r, 3000));

  // 스크롤 다운으로 전체 포스팅 로드
  for (let i = 0; i < 5; i++) {
    await mf.evaluate(() => window.scrollBy(0, 2000));
    await new Promise(r => setTimeout(r, 1500));
  }
  await new Promise(r => setTimeout(r, 2000));

  // 포스팅 목록 수집
  const posts = await mf.evaluate(() => {
    const items = [];
    const links = document.querySelectorAll('a[href*="logNo"]');
    
    links.forEach(a => {
      const title = a.innerText?.trim() || '';
      const href = a.getAttribute('href') || '';
      const logNo = href.match(/logNo=(\d+)/)?.[1] || '';
      
      if (title.length > 5 && logNo) {
        if (!items.some(x => x.logNo === logNo)) {
          // 주변 텍스트에서 정보 추출
          const parentText = a.closest('div, li, td, section')?.innerText || a.parentElement?.innerText || '';
          const dateMatch = parentText.match(/(\d{4})[.\s]*(\d{1,2})[.\s]*(\d{1,2})/);
          const date = dateMatch ? `${dateMatch[1]}.${dateMatch[2]}.${dateMatch[3]}` : '';
          const viewMatch = parentText.match(/조회\s*([\d,]+)/);
          const views = viewMatch ? viewMatch[1] : '';
          
          items.push({ 
            title: title.substring(0, 80), 
            date, 
            views,
            logNo 
          });
        }
      }
    });
    return items;
  });

  // 날짜순 정렬
  posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  console.log(`\n=== 블로그 포스팅 전체 목록: ${posts.length}개 ===`);
  console.log('='.repeat(70));
  posts.forEach((p, i) => {
    const d = p.date ? p.date : '날짜없음';
    const v = p.views ? ` 조회${p.views}` : '';
    console.log(` ${String(i+1).padStart(2)}. [${d}] ${p.title}${v}`);
  });

  // 요약
  console.log('\n=== 요약 ===');
  console.log(`총 포스팅: ${posts.length}개`);
  
  const withDate = posts.filter(p => p.date);
  if (withDate.length > 0) {
    const oldest = withDate[withDate.length - 1];
    const newest = withDate[0];
    console.log(`최초 발행: ${oldest.date}`);
    console.log(`최근 발행: ${newest.date}`);
    
    // 월별 분포
    const monthly = {};
    withDate.forEach(p => {
      const m = p.date.substring(0, 7);
      monthly[m] = (monthly[m] || 0) + 1;
    });
    console.log('\n월별 발행:');
    Object.entries(monthly).sort().forEach(([m, c]) => console.log(` ${m}: ${c}개`));
  }

  // 조회수
  const withViews = posts.filter(p => p.views);
  if (withViews.length > 0) {
    const avg = withViews.reduce((s, p) => s + parseInt(p.views.replace(/,/g, ''), 10), 0) / withViews.length;
    console.log(`\n평균 조회수: ${Math.round(avg).toLocaleString()}회 (${withViews.length}개 기준)`);
  }

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
