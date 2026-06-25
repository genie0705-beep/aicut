const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  const page = await ctx.newPage();
  
  // 전체 포스팅 목록
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 4000));
  
  const mf = page.frame({ name: 'mainFrame' });
  if (!mf) {
    console.log('mainFrame 없음 - 직접 페이지 분석');
    const text = await page.evaluate(() => document.body.innerText.substring(0, 3000));
    console.log(text);
    await b.close();
    process.exit(0);
  }
  
  // 카테고리별 포스팅 수집
  const result = await mf.evaluate(() => {
    const posts = [];
    // 각 포스팅 블록
    const items = document.querySelectorAll('.post-item, .postList, tr, li, .post, [class*="post"]');
    
    // a[href*="logNo"] 기준
    document.querySelectorAll('a[href*="logNo"]').forEach(a => {
      const title = a.innerText?.trim() || '';
      if (title.length > 5) {
        const parent = a.closest('div, li, td, section, tr') || a.parentElement;
        let date = '';
        let views = '';
        if (parent) {
          const text = parent.innerText || '';
          const dm = text.match(/(\d{4}\.\s*\d{1,2}\.\s*\d{1,2})/);
          if (dm) date = dm[1];
          const vm = text.match(/조회\s*(\d+)/);
          if (vm) views = vm[1];
        }
        const href = a.getAttribute('href') || '';
        const logNo = href.match(/logNo=(\d+)/)?.[1] || '';
        posts.push({ title: title.substring(0, 60), date, views, logNo });
      }
    });
    return posts;
  });
  
  console.log('=== 전체 포스팅 목록 ===');
  result.forEach((p, i) => {
    console.log(` ${i+1}. [${p.date || '날짜없음'}] ${p.title} ${p.views ? '(조회 '+p.views+')' : ''}`);
  });
  
  // 포스팅 상세 확인 (제일 최신 포스팅)
  if (result.length > 0) {
    console.log('\n=== 최신 포스팅 로그 ===');
    result.slice(0, 10).forEach(p => console.log(` ${p.date} | ${p.title}`));
  }
  
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
