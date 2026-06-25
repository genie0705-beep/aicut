const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', {
    waitUntil: 'domcontentloaded', timeout: 20000
  }).catch(() => {});
  await new Promise(r => setTimeout(r, 5000));

  // body 전체 텍스트에서 포스팅 패턴 추출
  const allText = await page.evaluate(() => document.body.innerText);
  
  // "카테고리\n제목\nAICUT 공식 ・ 날짜" 패턴 찾기
  const lines = allText.split('\n').map(l => l.trim()).filter(Boolean);
  
  const posts = [];
  let currentCat = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 카테고리 확인 (영상 마케팅, 고객사례 도입이야기)
    if ((line === '영상 마케팅' || line === '고객사례 도입이야기') && lines[i+1] && !lines[i+1].includes('AICUT')) {
      currentCat = line;
      continue;
    }
    
    // 날짜 패턴: "2026. 6. 10. 19:03" 또는 "2026. 6. 2. 10:42"
    const dateMatch = line.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*\d{2}:\d{2}/);
    if (dateMatch && i > 0) {
      const date = `${dateMatch[1]}.${dateMatch[2]}.${dateMatch[3]}`;
      // 바로 위 라인이 제목 (AICUT 공식 ・ 포함)
      let title = '';
      let catForPost = lines[i-2] || '';
      
      // AICUT 공식 ・ 이 있는 라인 찾기
      for (let j = i - 1; j >= 0 && j >= i - 3; j--) {
        if (lines[j].includes('AICUT') && lines[j].includes('・')) {
          title = lines[j-1] || '';
          break;
        }
        // 바로 위 라인이 제목일 가능성
        if (j === i - 1 && !lines[j].includes('AICUT') && !lines[j].includes('URL') && !lines[j].includes('통계') && !lines[j].includes('본문')) {
          title = lines[j];
        }
      }
      
      if (title) {
        posts.push({ title: title.substring(0, 80), date, category: currentCat });
      }
    }
  }

  // 중복 제거
  const unique = [];
  const seen = new Set();
  posts.forEach(p => {
    if (!seen.has(p.title)) {
      seen.add(p.title);
      unique.push(p);
    }
  });

  // 날짜순 정렬
  unique.sort((a, b) => b.date.localeCompare(a.date));

  console.log(`\n=== 블로그 전체 포스팅 목록: ${unique.length}개 ===`);
  console.log('='.repeat(70));
  unique.forEach((p, i) => {
    console.log(` ${String(i+1).padStart(2)}. [${p.date}] ${p.category ? `[${p.category}]` : ''} ${p.title}`);
  });

  // 월별 통계
  console.log('\n=== 월별 발행 현황 ===');
  const monthly = {};
  unique.forEach(p => {
    const m = p.date.substring(0, 7);
    monthly[m] = (monthly[m] || 0) + 1;
  });
  Object.entries(monthly).sort().forEach(([m, c]) => {
    console.log(` ${m}: ${c}개`);
  });

  // 카테고리별 통계
  console.log('\n=== 카테고리별 ===');
  const byCat = {};
  unique.forEach(p => {
    const cat = p.category || '미분류';
    byCat[cat] = (byCat[cat] || 0) + 1;
  });
  Object.entries(byCat).sort((a,b) => b[1]-a[1]).forEach(([c, n]) => {
    console.log(` ${c}: ${n}개`);
  });

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
