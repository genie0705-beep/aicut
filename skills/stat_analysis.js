const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const statPage = pages.find(p => p.url().includes('/stat/'));
  if (!statPage) { console.log('통계 페이지 없음'); await b.close(); return; }

  await statPage.bringToFront();
  await statPage.waitForTimeout(3000);

  const data = await statPage.evaluate(() => {
    const body = document.body.textContent || '';
    const lines = body.split('\n').filter(l => l.trim().length > 0);

    // 오늘/어제/전체 방문자
    const today = body.match(/오늘\s*[:;]?\s*([\d,]+)/i);
    const yesterday = body.match(/어제\s*[:;]?\s*([\d,]+)/i);
    const total = body.match(/전체\s*[:;]?\s*([\d,]+)/i);

    // 주간/일일 데이터
    const weekly = [];
    // 6월 날짜 패턴 검색
    const dateRegex = /(6[./]\d{1,2}|06[./]\d{1,2}|2026[./]06[./]\d{1,2})/g;
    let m;
    while ((m = dateRegex.exec(body)) !== null) {
      const start = Math.max(0, m.index - 30);
      const end = Math.min(body.length, m.index + 60);
      weekly.push(body.substring(start, end).replace(/\s+/g, ' ').trim());
    }

    // 방문자/방문수 숫자 패턴
    const numbers = [];
    const numRegex = /([\d,]+)\s*(명|회|개)/g;
    while ((m = numRegex.exec(body)) !== null) {
      const snippet = body.substring(Math.max(0, m.index - 20), m.index + 10).replace(/\s+/g, ' ').trim();
      numbers.push(snippet + m[0]);
    }

    // 주요 섹션 추출
    const sections = [];
    const sectionKeywords = ['방문자', '조회수', '유입', '유입경로', '검색', 'SNS', '게시글', '방문'];
    sectionKeywords.forEach(kw => {
      const idx = body.indexOf(kw);
      if (idx > -1) {
        const section = body.substring(Math.max(0, idx - 10), idx + 120).replace(/\s+/g, ' ').trim();
        sections.push(section);
      }
    });

    return {
      today: today ? today[1] : '데이터 없음',
      yesterday: yesterday ? yesterday[1] : '데이터 없음',
      total: total ? total[1] : '데이터 없음',
      weekly: [...new Set(weekly)].slice(0, 15),
      numbers: [...new Set(numbers)].slice(0, 15),
      sections: sections.slice(0, 10),
      bodyLength: body.length + '자'
    };
  });

  console.log('=== 네이버 블로그 통계 대시보드 ===\n');
  console.log('📌 방문자:');
  console.log('  오늘:', data.today);
  console.log('  어제:', data.yesterday);
  console.log('  전체:', data.total);

  if (data.weekly.length > 0) {
    console.log('\n📅 일일 데이터:');
    data.weekly.forEach(d => console.log('  ' + d));
  }

  if (data.numbers.length > 0) {
    console.log('\n🔢 주요 수치:');
    data.numbers.forEach(n => console.log('  ' + n));
  }

  if (data.sections.length > 0) {
    console.log('\n📊 주요 섹션:');
    data.sections.forEach(s => console.log('  ' + s));
  }

  // 최고 트래픽 날짜 찾기
  console.log('\n=== 최고 트래픽 날짜 분석 ===');
  // 숫자 + 날짜 조합에서 최대값 찾기
  const numbers = data.weekly.concat(data.numbers);
  const dailyNums = numbers.filter(n => /\d+[,]?\d+/.test(n));
  console.log('  전체 데이터 포인트:', dailyNums.length + '개');

  await b.close();
}
main().catch(e => console.error('에러:', e.message));
