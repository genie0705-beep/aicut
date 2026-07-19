const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = browser.contexts()[0].pages();
  const page = pages[0] || await browser.contexts()[0].newPage();

  console.log('========== 네이버 블로그 통계 분석 ==========\n');

  // 1. 블로그 메인 방문자 확인
  console.log('[1] 블로그 메인 방문자/통계');
  try {
    await page.goto('https://blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // 전체 텍스트에서 방문자/통계 정보 추출
    const info = await page.evaluate(() => {
      const text = document.body.innerText;
      // 방문자, 오늘, 어제, 누적 관련 텍스트
      const lines = text.split('\n').filter(l => 
        l.includes('방문') || l.includes('오늘') || l.includes('어제') || 
        l.includes('누적') || l.includes('통계') || l.includes('조회')
      ).filter(l => l.trim().length > 0);
      return lines.slice(0, 20);
    });
    
    if (info.length > 0) {
      info.forEach(l => console.log(`  ${l.trim()}`));
    } else {
      console.log('  (방문자 정보 미발견 — 관리 페이지 필요)');
    }
  } catch(e) {
    console.log(`  오류: ${e.message}`);
  }

  // 2. 게시물별 정보 확인
  console.log('\n[2] 최근 게시물 현황');
  try {
    await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut&categoryNo=&parentCategoryNo=&sortDate=true', 
      { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // 네이버 블로그의 게시물 제목 + 날짜 추출
    const postInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      // 게시물 제목 찾기 (보통 날짜와 함께 표시)
      const posts = [];
      let currentTitle = '';
      let currentDate = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // 날짜 패턴: "2026.07.16" or "7시간" or "8시간" or "3일"
        if (line.match(/^\d{4}\.\d{2}\.\d{2}/) || line.match(/^\d+시간/) || line.match(/^\d+일/)) {
          currentDate = line;
        } else if (line.length > 15 && !line.includes('블로그씨') && !line.includes('From.') && !line.includes('전체보기')) {
          currentTitle = line;
          if (currentDate) {
            posts.push({ date: currentDate, title: currentTitle });
            currentDate = '';
          }
        }
      }
      return posts.slice(0, 10);
    });
    
    if (postInfo.length > 0) {
      postInfo.forEach((p, i) => console.log(`  ${i+1}. [${p.date}] ${p.title.substring(0, 100)}`));
    } else {
      console.log('  (게시물 정보 파싱 실패 — raw text)');
      const raw = await page.evaluate(() => document.body.innerText.substring(0, 1500));
      console.log(raw);
    }
  } catch(e) {
    console.log(`  오류: ${e.message}`);
  }

  // 3. 관리자 통계 (최신 통계 데이터)
  console.log('\n[3] 블로그 관리자 통계 시도');
  try {
    // 새 탭으로 관리자 통계 시도
    const statPage = await browser.contexts()[0].newPage();
    await statPage.goto('https://blog.naver.com/BlogStatistics.naver?blogId=aicut&menu=visit', 
      { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    
    const url = statPage.url();
    console.log(`  URL: ${url}`);
    
    if (url.includes('nid.naver.com')) {
      console.log('  ⚠️ 로그인 필요 — 관리자 통계 접근 불가');
    } else {
      const stats = await statPage.evaluate(() => {
        return document.body.innerText.substring(0, 2000);
      });
      console.log(`  ${stats.substring(0, 1000)}`);
    }
    await statPage.close();
  } catch(e) {
    console.log(`  오류: ${e.message}`);
  }

  // 4. 현재 블로그 메인에서 인기글/최근글 더보기
  console.log('\n[4] 블로그 메인 — 추가 정보');
  try {
    await page.goto('https://blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    
    const extra = await page.evaluate(() => {
      const text = document.body.innerText;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      // 블로그 우측 영역 정보 추출
      const rightInfo = lines.filter(l => 
        l.includes('카테고리') || l.includes('태그') || l.includes('이웃') ||
        l.includes('방명록') || l.includes('공지') || l.includes('프로필') ||
        l.includes('에이컷') || l.includes('AICUT')
      ).slice(0, 10);
      return rightInfo;
    });
    
    if (extra.length > 0) {
      console.log('  블로그 사이드 정보:');
      extra.forEach(l => console.log(`    ${l}`));
    }
    
    // 블로그 메인 제목/설명
    const blogTitle = await page.evaluate(() => {
      const h = document.querySelector('h1, .blog-title, .blog-name, [class*="title"]');
      return h ? h.innerText.trim() : '';
    });
    if (blogTitle) console.log(`  블로그 제목: ${blogTitle}`);
    
  } catch(e) {
    console.log(`  오류: ${e.message}`);
  }

  console.log('\n========== 분석 완료 ==========');
  
  // disconnect only
  const cdp = browser._connection;
  if (cdp && cdp.close) cdp.close();
})();
