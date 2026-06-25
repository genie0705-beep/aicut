const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 입찰가 조정 계획
// 1. 광고영상편집: 1,500 → 2,000원 (CTR 7.69% 최고 성과)
// 2. [기본] 700원 키워드 중 광고연관지수/클릭기대지수 있는 것: 1,200원으로 상향
// 3. 노출 0이고 지수도 없는 키워드: 그대로 유지 (효율 없음)

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 키워드 탭 확인
  const tabState = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const kw = btns.find(b => b.innerText?.trim() === '키워드');
    if (kw) kw.click();
    return '키워드 탭';
  });
  await sleep(2000);

  // 전체 선택 체크박스 클릭 (헤더)
  // 먼저 "입찰가 변경" 버튼 찾기
  const hasBidBtn = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.includes('입찰가 변경'));
    return btn ? '있음' : '없음';
  });
  console.log('입찰가 변경 버튼:', hasBidBtn);

  // 개별 키워드 입찰가 수정 — 광고영상편집 찾아서 직접 클릭
  const rows = await page.evaluate(() => {
    const trs = Array.from(document.querySelectorAll('tr'));
    return trs.map((tr, idx) => {
      const cells = Array.from(tr.querySelectorAll('td'));
      const text = cells.map(c => c.innerText?.trim()).join(' | ');
      return { idx, text: text.substring(0, 100) };
    }).filter(r => r.text && r.text.includes('노출가능')).slice(0, 10);
  });
  console.log('키워드 rows:', JSON.stringify(rows));

  // 광고영상편집 행 찾아서 입찰가 셀 클릭
  const targetRow = await page.evaluate(() => {
    const trs = Array.from(document.querySelectorAll('tr'));
    for (const tr of trs) {
      const cells = Array.from(tr.querySelectorAll('td'));
      const kwCell = cells[0] || cells[1];
      if (kwCell?.innerText?.includes('광고영상편집')) {
        // 입찰가 셀 (3번째 td)
        const bidCell = cells[2] || cells[3];
        if (bidCell) {
          const r = bidCell.getBoundingClientRect();
          return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), text: bidCell.innerText?.trim() };
        }
      }
    }
    return null;
  });
  console.log('광고영상편집 입찰가 셀:', targetRow);

  await page.screenshot({ path: 'naver_kw_rows.png' });
  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
