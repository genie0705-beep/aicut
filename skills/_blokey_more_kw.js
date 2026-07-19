// blokey — 황금키워드 전체 리스트 + 키워드 분석
const { chromium } = require('playwright');
const fs = require('fs');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('blokey')) { page = p; break; }
  }
  if (!page) {
    page = await ctx.newPage();
  }

  // 황금키워드 전체 리스트 — main 영역의 테이블 데이터 추출
  console.log('황금키워드 전체 테이블 추출...');
  await page.goto('https://blokey.co.kr/golden', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(4000);
  
  const tableData = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return 'no main';
    
    // 모든 td, th 내용 추출
    const rows = main.querySelectorAll('tr');
    const result = [];
    for (const row of rows) {
      const cells = row.querySelectorAll('td, th');
      const rowData = [];
      for (const cell of cells) {
        rowData.push(cell.innerText.trim());
      }
      if (rowData.length > 0) result.push(rowData.join(' | '));
    }
    return result.join('\n');
  });
  console.log('테이블 데이터:', tableData.slice(0, 3000));
  
  // 페이지네이션
  for (let pageNum = 2; pageNum <= 3; pageNum++) {
    try {
      const buttons = await page.$$('button');
      let found = false;
      for (const btn of buttons) {
        const text = await btn.innerText();
        if (text.trim() === String(pageNum)) {
          await btn.click();
          await page.waitForTimeout(2000);
          const moreData = await page.evaluate(() => {
            const main = document.querySelector('main');
            if (!main) return '';
            const rows = main.querySelectorAll('tr');
            const result = [];
            for (const row of rows) {
              const cells = row.querySelectorAll('td, th');
              const rowData = [];
              for (const cell of cells) {
                rowData.push(cell.innerText.trim());
              }
              if (rowData.length > 0) result.push(rowData.join(' | '));
            }
            return result.join('\n');
          });
          console.log(`\n페이지 ${pageNum}:`, moreData.slice(0, 2000));
          found = true;
          break;
        }
      }
      if (!found) break;
    } catch(e) {
      console.log(`페이지 ${pageNum} 오류:`, e.message);
      break;
    }
  }

  // 연관 키워드 생성 페이지
  console.log('\n연관 키워드 생성 페이지...');
  await page.goto('https://blokey.co.kr/keyword-gen', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  const kwGenText = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? main.innerText.slice(0, 3000) : 'no main';
  });
  console.log('연관 키워드 생성:', kwGenText);

  // 트렌드 주제 페이지 — 더 자세히
  console.log('\n트렌드 주제 전체...');
  await page.goto('https://blokey.co.kr/trend-topics', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  const topicData = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? main.innerText.slice(0, 5000) : 'no main';
  });
  console.log('트렌드 주제 전체:', topicData);

  await b.close();
  console.log('\n✅ 완료');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
