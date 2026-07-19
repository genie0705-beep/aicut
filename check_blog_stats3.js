const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0] || await ctx.newPage();

  console.log('========== 블로그 관리자 통계 분석 ==========\n');

  // 블로그 포스트 목록 페이지로 이동 (통계/관리 버튼 있음)
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', {
    waitUntil: 'domcontentloaded', timeout: 15000
  });
  await page.waitForTimeout(3000);

  // 현재 URL에 nid.naver.com(로그인페이지)인지 확인
  const url = page.url();
  console.log(`현재 URL: ${url}`);

  if (url.includes('nid.naver.com')) {
    console.log('❌ 네이버 로그인 필요 — 브라우저에서 수동 로그인 후 재시도 필요');
    await browser.close();
    return;
  }

  // '통계' 버튼 찾아서 클릭
  const statBtn = await page.evaluate(() => {
    // 모든 요소에서 '통계' 텍스트 찾기
    const all = document.querySelectorAll('a, button, span, div');
    for (const el of all) {
      if (el.innerText.trim() === '통계') {
        const rect = el.getBoundingClientRect();
        return { tag: el.tagName, text: el.innerText, x: rect.x, y: rect.y, href: el.href || '' };
      }
    }
    return null;
  });

  if (statBtn) {
    console.log(`통계 버튼 찾음: ${JSON.stringify(statBtn)}`);
    if (statBtn.href) {
      await page.goto(statBtn.href, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } else {
      await page.click(`text=통계`);
    }
    await page.waitForTimeout(4000);
    console.log(`통계 페이지 URL: ${page.url()}`);
  } else {
    console.log('통계 버튼 못 찾음 — 직접 URL 시도');
  }

  // 블로그 관리 대시보드 시도
  const dashboardUrls = [
    'https://blog.naver.com/PostView.naver?blogId=aicut&logNo=224348766674',
  ];
  
  for (const u of dashboardUrls) {
    try {
      await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);
      console.log(`\n[${u}]`);
      
      if (page.url().includes('nid.naver.com')) {
        console.log('  로그인 필요');
        continue;
      }
      
      // 조회수, 공감, 댓글 등 정보 추출
      const info = await page.evaluate(() => {
        const text = document.body.innerText;
        const lines = text.split('\n').filter(l => 
          l.includes('조회') || l.includes('공감') || l.includes('댓글') || l.includes('스크랩')
        );
        return { statistics: lines.slice(0, 10), textPreview: text.substring(0, 500) };
      });
      
      console.log('  통계:', info.statistics);
      console.log('  미리보기:', info.textPreview.substring(0, 300));
      
    } catch(e) {
      console.log(`  오류: ${e.message}`);
    }
  }

  // 제헌절 포스트 직접 확인
  console.log('\n[제헌절 포스트 상세]');
  try {
    await page.goto('https://blog.naver.com/aicut/224348766674', {
      waitUntil: 'domcontentloaded', timeout: 15000
    });
    await page.waitForTimeout(3000);
    
    const postStats = await page.evaluate(() => {
      const text = document.body.innerText;
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      // 통계 정보
      const stats = lines.filter(l => 
        l.includes('조회') || l.includes('공감') || l.includes('댓글') || 
        l.includes('스크랩') || l.includes('이웃')
      );
      // 제목
      const title = lines.find(l => l.includes('제헌절') || l.includes('공휴일') || l.includes('행사'));
      return { title, stats: stats.slice(0, 10), linesCount: lines.length };
    });
    
    console.log(`  제목: ${postStats.title || '(미확인)'}`);
    console.log(`  통계: ${postStats.stats.join(' | ') || '(미확인)'}`);
    console.log(`  전체 라인수: ${postStats.linesCount}`);
    
  } catch(e) {
    console.log(`  오류: ${e.message}`);
  }

  console.log('\n========== 분석 완료 ==========');
  
  try { await browser.close(); } catch(e) {}
})();
