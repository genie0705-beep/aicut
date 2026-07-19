const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ga4 = b.contexts()[0].pages().find(p => p.url().includes('analytics.google.com'));
  if (!ga4) { console.log('GA4 없음'); await b.close(); return; }

  await ga4.bringToFront();
  await ga4.waitForTimeout(2000);

  // GA4에서 더 상세한 데이터 추출
  const r = await ga4.evaluate(() => {
    const body = document.body.textContent || '';
    const lines = body.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // 숫자 데이터 찾기 (조회수, 사용자 등)
    const numbers = lines.filter(l => /^[\d,]+$/.test(l.replace(/\s/g, '')) && l.length < 15);
    
    // 주요 KPI 라벨 + 값
    const kpis = ['사용자', '세션', '페이지뷰', '세션당', '참여율', '이벤트 수'];
    const kpiData = [];
    kpis.forEach(k => {
      const idx = body.indexOf(k);
      if (idx > -1) {
        const before = body.substring(Math.max(0, idx - 40), idx).replace(/\s+/g, ' ').trim();
        const after = body.substring(idx, idx + 50).replace(/\s+/g, ' ').trim();
        kpiData.push(before + ' → ' + after);
      }
    });

    // 페이지 제목/경로 데이터
    const pagePaths = lines.filter(l => 
      (l.includes('/aicut/') || l.includes('224329')) && l.length < 120
    ).slice(0, 20);

    return {
      kpis: kpiData.slice(0, 10),
      numbers: [...new Set(numbers)].slice(0, 10),
      pages: pagePaths,
      // 유입 채널
      channels: lines.filter(l => 
        l.includes('organic') || l.includes('direct') || l.includes('social') || l.includes('referral')
      ).slice(0, 10)
    };
  });

  console.log('=== GA4 KPI ===');
  r.kpis.forEach(k => console.log('  ' + k));
  
  if (r.numbers.length > 0) {
    console.log('\n=== 숫자 데이터 ===');
    r.numbers.forEach(n => console.log('  ' + n));
  }
  
  if (r.pages.length > 0) {
    console.log('\n=== 페이지 경로 ===');
    r.pages.forEach(p => console.log('  ' + p));
  }
  
  if (r.channels.length > 0) {
    console.log('\n=== 유입 채널 ===');
    r.channels.forEach(c => console.log('  ' + c));
  }

  await b.close();
}
main().catch(e => console.error('에러:', e.message));
