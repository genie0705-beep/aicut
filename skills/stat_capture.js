const { chromium } = require('playwright');
const path = require('path');
const WS = path.join(__dirname, '..');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const sp = pages.find(p => p.url().includes('/stat/'));
  if (!sp) { console.log('통계 페이지 없음'); await b.close(); return; }

  await sp.bringToFront();
  await sp.waitForTimeout(2000);

  // 스크린샷
  await sp.screenshot({ path: path.join(WS, '_blog_stats.png'), fullPage: true });
  console.log('✅ 스크린샷 저장');

  // 차트 데이터 추출 시도
  const chartData = await sp.evaluate(() => {
    // canvas 차트 데이터
    const canvases = document.querySelectorAll('canvas');
    
    // JSON 데이터가 숨겨져 있는지 확인
    const scripts = document.querySelectorAll('script');
    let jsonData = null;
    for (const s of scripts) {
      const text = s.textContent || '';
      if (text.includes('series') || text.includes('categories') || text.includes('일일방문자') || text.includes('visitor')) {
        jsonData = text.substring(0, 500);
        break;
      }
    }

    // 테이블 형태 데이터
    const tables = document.querySelectorAll('table');
    const tableData = Array.from(tables).slice(0, 3).map(t => {
      const rows = t.querySelectorAll('tr');
      return Array.from(rows).slice(0, 10).map(r => {
        const cells = r.querySelectorAll('th, td');
        return Array.from(cells).map(c => (c.textContent || '').trim()).join(' | ');
      });
    });

    // span/div 숫자 데이터
    const numbers = [];
    document.querySelectorAll('span, div, strong, em').forEach(el => {
      const t = (el.textContent || '').trim();
      if (/^[\d,]+$/.test(t) && t.length < 15) numbers.push(t);
    });

    return {
      canvases: canvases.length,
      hasJsonData: !!jsonData,
      jsonPreview: jsonData ? jsonData.substring(0, 300) : null,
      tables: tableData,
      numbers: [...new Set(numbers)].slice(0, 20)
    };
  });

  if (chartData.hasJsonData) {
    console.log('\n📊 차트 JSON 데이터 발견:');
    console.log('  ' + chartData.jsonPreview);
  }

  if (chartData.tables.length > 0) {
    console.log('\n📋 테이블 데이터:');
    chartData.tables.forEach((t, i) => {
      console.log('  테이블 ' + (i+1) + ':');
      t.forEach(r => console.log('    ' + r));
    });
  }

  if (chartData.numbers.length > 0) {
    console.log('\n🔢 추출된 숫자:');
    chartData.numbers.forEach(n => console.log('  ' + n));
  }

  console.log('\n캔버스 차트 수:', chartData.canvases);
  if (chartData.canvases > 0) {
    console.log('(차트 데이터는 시각적 요소로 렌더링 — 이미지로 확인 필요)');
    console.log('스크린샷: ' + path.join(WS, '_blog_stats.png'));
  }

  await b.close();
}
main().catch(e => console.error('에러:', e.message));
