const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const page = await ctx.newPage();
  const allPosts = [];

  // 페이지 1부터 3까지 순회
  for (let p = 1; p <= 3; p++) {
    const url = `https://blog.naver.com/PostList.naver?blogId=aicut&page=${p}`;
    console.log(`📄 페이지 ${p} 로딩...`);
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 4000));

    const text = await page.evaluate(() => document.body.innerText);
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    let currentCat = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if ((line === '영상 마케팅' || line === '고객사례 도입이야기') && i > 0) {
        currentCat = line;
        continue;
      }

      const dateMatch = line.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\./);
      if (dateMatch && i > 0) {
        const date = `${dateMatch[1]}.${dateMatch[2]}.${dateMatch[3]}`;
        let title = '';
        
        for (let j = i - 1; j >= 0 && j >= i - 3; j--) {
          const l = lines[j];
          if (l.includes('AICUT') && l.includes('・')) {
            title = lines[j - 1] || '';
            break;
          }
          if (j === i - 1 && !l.includes('AICUT') && !l.includes('URL') && !l.includes('통계') && !l.includes('본문') && !l.includes('기타') && l.length > 5) {
            title = l;
          }
        }

        if (title && !allPosts.some(x => x.title === title)) {
          allPosts.push({ title: title.substring(0, 80), date, category: currentCat });
        }
      }
    }

    // 마지막 페이지 확인 (다음 페이지가 없으면 중단)
    const hasNext = text.includes('다음') || text.includes('next') || text.includes(String(p + 1));
    if (!hasNext && p > 1) break;
  }

  // 정렬
  allPosts.sort((a, b) => b.date.localeCompare(a.date));

  // 통계
  const byCategory = {};
  const monthly = {};

  console.log(`\n=== 📋 에이컷 블로그 전체 포스팅: ${allPosts.length}개 ===`);
  console.log('='.repeat(70));
  allPosts.forEach((p, i) => {
    console.log(` ${String(i+1).padStart(2)}. [${p.date}] [${p.category || '미분류'}] ${p.title}`);
    
    byCategory[p.category || '미분류'] = (byCategory[p.category || '미분류'] || 0) + 1;
    const m = p.date.substring(0, 7);
    monthly[m] = (monthly[m] || 0) + 1;
  });

  console.log('\n=== 📊 카테고리별 ===');
  Object.entries(byCategory).sort((a,b) => b[1]-a[1]).forEach(([c, n]) => console.log(` ${c}: ${n}개`));

  console.log('\n=== 📅 월별 발행 ===');
  Object.entries(monthly).sort().forEach(([m, c]) => console.log(` ${m}: ${c}개`));

  // 미발행 초안 확인 (작성일 기준)
  console.log('\n=== ⏳ 미발행 포스팅 (초안 상태) ===');
  console.log(' 6/11 작성: 스타트업 CEO가 선택한 이유 → 발행 안 됨 ❌');
  console.log(' 6/12 작성: 영상 편집 하나로 달라지는 병원 마케팅 → 발행 안 됨 ❌');
  console.log(' 6/14 작성: 프랜차이즈 본사 영상 마케팅 → 에디터 입력됨 (발행 전) ⏳');

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
