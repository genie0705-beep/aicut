const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  // 블로그 메인 페이지 열기 (기존 탭 사용)
  let page = ctx.pages().find(p => p.url().includes('blog.naver.com/aicut'));
  if (!page) page = await ctx.newPage();
  
  await page.goto('https://blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 4000));
  
  const mf = page.frame({ name: 'mainFrame' });
  if (!mf) { console.log('mainFrame 없음'); await b.close(); process.exit(0); }
  
  // 블로그 정보
  const blogInfo = await mf.evaluate(() => {
    const info = {};
    info.title = document.querySelector('#blogTitle, .blogTitle, h1')?.innerText?.trim() || '';
    info.description = document.querySelector('.blogDesc, [class*="description"]')?.innerText?.trim() || '';
    
    const stats = document.querySelectorAll('.blog_stats, .blog-stat, [class*="stat"]');
    info.stats = Array.from(stats).map(s => s.innerText.trim()).filter(Boolean);
    
    return info;
  });
  console.log('=== 블로그 정보 ===');
  console.log(JSON.stringify(blogInfo, null, 2));
  
  // 카테고리 목록
  const categories = await mf.evaluate(() => {
    const cats = [];
    const links = document.querySelectorAll('a[href*="categoryNo"], a[class*="category"], li[class*="category"] a, .category a, .categories a');
    links.forEach(a => {
      const href = a.getAttribute('href') || '';
      const text = a.innerText?.trim() || '';
      if (text && href && !href.includes('javascript')) {
        cats.push({ text, href: href.substring(0, 80) });
      }
    });
    if (cats.length === 0) {
      // 대체: 모든 a 태그 중 category 텍스트 포함한 것
      document.querySelectorAll('a').forEach(a => {
        const t = a.innerText?.trim() || '';
        if (t && (t.includes('카테고리') || t.includes('카테고리 관리'))) {
          cats.push({ text: t, href: a.href.substring(0, 80) });
        }
      });
    }
    return cats;
  });
  console.log('\n=== 카테고리 ===');
  console.log(JSON.stringify(categories, null, 2));
  
  // 포스팅 목록 수집 (현재 페이지)
  const posts = await mf.evaluate(() => {
    const items = [];
    // 일반 블로그 목록
    const containers = document.querySelectorAll('.blog2_series, .post-list, .postList, [class*="post"]');
    
    // 개별 포스팅 링크
    const links = document.querySelectorAll('a[href*="logNo"], .post-link, [class*="post-title"] a');
    links.forEach(a => {
      const href = a.getAttribute('href') || '';
      const title = a.innerText?.trim() || '';
      if (href && title && title.length > 5) {
        items.push({ title, href: href.substring(0, 100), source: 'link' });
      }
    });
    
    // 날짜 정보가 있는 항목 (포스팅)
    document.querySelectorAll('.date, .post-date, [class*="date"], span[class]').forEach(el => {
      const t = el.innerText?.trim() || '';
      if (t.match(/^\d{4}[-.]\d{1,2}[-.]\d{1,2}/) || t.match(/^\d{1,2}[-.]\d{1,2}/)) {
        const parent = el.closest('div, li');
        if (parent) {
          const titleEl = parent.querySelector('a[href*="logNo"], strong, b, .title');
          const title = titleEl?.innerText?.trim() || '';
          if (title) {
            items.push({ title, date: t, source: 'dated' });
          }
        }
      }
    });
    
    return items;
  });
  
  console.log('\n=== 포스팅 목록 ===');
  if (posts.length > 0) {
    posts.forEach((p, i) => console.log(` ${i+1}. ${p.title} ${p.date ? '('+p.date+')' : ''}`));
  } else {
    console.log('현재 페이지에서 포스팅 목록을 찾지 못함');
  }
  
  // 각 포스팅 상세 정보 (클릭해서 들어가기)
  // 메인 페이지 텍스트 출력
  const pageText = await mf.evaluate(() => document.body.innerText.substring(0, 3000));
  console.log('\n=== 블로그 메인 페이지 텍스트 ===');
  console.log(pageText);
  
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
