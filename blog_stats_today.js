const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  console.log('=== 네이버 블로그 통계 분석 (2026.07.17) ===\n');

  // 통계 페이지 접속
  await page.goto('https://admin.blog.naver.com/aicut/stat/today', {
    waitUntil: 'domcontentloaded', timeout: 20000
  });
  await page.waitForTimeout(8000);

  if (page.url().includes('nid.naver.com')) {
    console.log('❌ 로그인 필요 — 브라우저에서 로그인 후 재시도');
    return;
  }
  console.log('✅ 통계 페이지 접속 성공\n');

  // iframe에서 통계 데이터 수집
  const frames = page.frames();
  let statFrame = null;
  
  // 데이터가 있는 iframe 찾기
  for (const f of frames) {
    try {
      const text = await f.evaluate(() => document.body?.innerText || '');
      if (text.includes('조회수') && text.includes('일간 현황')) {
        statFrame = f;
        break;
      }
    } catch(e) {}
  }

  if (!statFrame) {
    console.log('⚠️ 통계 iframe을 못 찾았습니다. 페이지 텍스트 출력:');
    const text = await page.evaluate(() => document.body.innerText.substring(0, 1000));
    console.log(text);
    return;
  }

  const statText = await statFrame.evaluate(() => document.body.innerText);
  const lines = statText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  console.log('--- 오늘의 블로그 통계 ---\n');

  // 오늘 날짜
  const dateLine = lines.find(l => l.includes('2026.07.17') || l.includes('07:'));
  console.log(`📅 기준: ${dateLine || '2026.07.17'}`);

  // 실시간 통계
  const statKeys = ['조회수', '동영상 재생수', '공감수', '댓글수', '이웃증감수', '방문 횟수', '순방문자수'];
  const stats = {};
  for (let i = 0; i < lines.length; i++) {
    for (const key of statKeys) {
      if (lines[i] === key && i + 1 < lines.length) {
        const val = lines[i+1];
        if (/^[\d,.]+$/.test(val) || val === 'NEW') {
          stats[key] = val;
        }
      }
    }
  }
  
  console.log('\n📊 실시간 현황:');
  for (const [k, v] of Object.entries(stats)) {
    console.log(`   ${k}: ${v}`);
  }

  // 게시물별 조회수 순위
  console.log('\n🏆 게시물별 조회수 순위:');
  const rankStart = lines.findIndex(l => l.includes('게시물 조회수 순위'));
  if (rankStart >= 0) {
    let rankLines = lines.slice(rankStart + 2); // skip header
    
    for (let i = 0; i < 10 && i < rankLines.length; i++) {
      const l = rankLines[i];
      // 순위 패턴: "순위  제목  조회수" 
      // 실제: "1  제헌절...  17"
      if (/^\d+\s/.test(l) || /^\d+$/.test(l)) {
        const rank = l.match(/^(\d+)/);
        if (rank) {
          const title = rankLines[i+1];
          const views = rankLines[i+2];
          if (title && views && /^[\d,.]+$/.test(views)) {
            console.log(`   ${rank[1]}위: ${title} — ${views}회`);
            i += 2;
          }
        }
      }
    }
  } else {
    // Try to find table-like data
    const rankTable = lines.filter(l => /^\d+\s/.test(l));
    rankTable.forEach(l => {
      const parts = l.split(/\s{2,}/);
      if (parts.length >= 2) {
        console.log(`   ${parts[0].trim()}위: ${parts.slice(1).join(' ')}`);
      }
    });
    
    // If still nothing, show raw data around 게시물 section
    const rawRankLines = lines.filter(l => 
      l.includes('제헌절') || l.includes('피부과') || l.includes('초복') || l.includes('프랜차이즈') || l.includes('숏폼')
    );
    if (rawRankLines.length > 0) {
      rawRankLines.forEach(l => console.log(`   ${l}`));
    }
  }

  // 유입경로 분석
  console.log('\n🔍 유입경로:');
  const refererStart = lines.findIndex(l => l.includes('유입경로'));
  if (refererStart >= 0) {
    for (let i = refererStart + 1; i < Math.min(refererStart + 15, lines.length); i++) {
      const l = lines[i];
      if (l.includes('%') || l.includes('네이버') || l.includes('검색')) {
        console.log(`   ${l}`);
      }
    }
  }

  // 검색어
  console.log('\n🔎 네이버 검색 유입 키워드:');
  const searchStart = lines.findIndex(l => l.includes('네이버 검색 상세 유입 경로'));
  if (searchStart >= 0) {
    for (let i = searchStart + 1; i < Math.min(searchStart + 15, lines.length); i++) {
      const l = lines[i];
      if (l) {
        const parts = l.split(/\s+/);
        if (parts.length >= 2) {
          const keyword = parts[0];
          const pct = parts[parts.length - 1];
          if (pct.includes('%')) {
            console.log(`   ${keyword} (${pct})`);
          } else {
            console.log(`   ${l}`);
          }
        } else {
          console.log(`   ${l}`);
        }
      }
    }
  }

  // 기간별 트렌드 (3일~17일)
  console.log('\n📈 기간별 비교 (최근):');
  const trendLines = lines.filter(l => /^\d+일$/.test(l) || /^일$/.test(l) || l.match(/^\d+\.\d+\.\d+$/));
  if (trendLines.length > 0) {
    trendLines.slice(-7).forEach(l => console.log(`   ${l}`));
  }

  console.log('\n=== 분석 완료 ===');
})();
