const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[1];

  // PUT 요청 캡처
  const putReqs = [];
  page.on('request', req => {
    if (req.method() === 'PUT' || req.method() === 'PATCH') {
      putReqs.push({ method: req.method(), url: req.url(), body: req.postData() });
    }
  });

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/campaigns/cmp-a001-01-000000010565267/adgroups/grp-a001-01-000000065663566/keywords', { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(3000);

  // 입찰가 셀 찾아서 편집 시도
  const pageText = await page.evaluate(() => {
    // 테이블 구조 확인
    const rows = document.querySelectorAll('tr, [role="row"]');
    return Array.from(rows).slice(0, 5).map(r => r.innerText?.substring(0, 100)).join('\n');
  });
  console.log('테이블 행:', pageText);

  // 실제 입찰가 셀 더블클릭
  const dbClicked = await page.evaluate(() => {
    // 입찰가 관련 셀들 찾기
    const allCells = Array.from(document.querySelectorAll('td, [role="cell"], .bid-cell'));
    for (const cell of allCells) {
      const t = cell.innerText?.trim();
      if (t === '700' || t === '700원') {
        // 더블클릭
        cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        return '더블클릭: ' + t;
      }
    }
    // 편집 아이콘 찾기
    const editBtns = Array.from(document.querySelectorAll('[title*="편집"], [aria-label*="편집"], .edit-btn'));
    if (editBtns.length > 0) { editBtns[0].click(); return '편집 버튼: ' + editBtns[0].outerHTML.substring(0, 80); }
    return null;
  });
  console.log('더블클릭:', dbClicked);
  await sleep(1500);

  // 열린 입력창 찾기
  const inputInfo = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="number"], input[type="text"]'));
    return inputs.map(i => ({ type: i.type, value: i.value, placeholder: i.placeholder }));
  });
  console.log('입력창:', JSON.stringify(inputInfo));

  await sleep(2000);
  console.log('PUT 요청 캡처:', putReqs.length);
  putReqs.forEach(r => {
    console.log(r.method, r.url.substring(0, 100));
    console.log('Body:', r.body?.substring(0, 300));
  });

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
