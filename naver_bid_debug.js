const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));

  // 영상편집 키워드 행 찾기
  const rowInfo = await page.evaluate(`
    (() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll('td'));
        if (!cells[2]) continue;
        const kwText = cells[2].innerText?.trim().split('\\n')[0].trim();
        if (kwText === '영상편집') {
          // 모든 셀의 내용과 클릭 가능 요소 확인
          return {
            kwText,
            cellCount: cells.length,
            cell4: cells[4]?.innerText?.trim(),
            cell4Html: cells[4]?.innerHTML?.substring(0, 200),
            rowHtml: row.innerHTML?.substring(0, 500)
          };
        }
      }
      return null;
    })()
  `);
  console.log('영상편집 행:', JSON.stringify(rowInfo, null, 2));

  // 입찰가 셀 클릭
  await page.evaluate(`
    (() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll('td'));
        if (!cells[2]) continue;
        const kwText = cells[2].innerText?.trim().split('\\n')[0].trim();
        if (kwText === '영상편집') {
          cells[4].click();
          return;
        }
      }
    })()
  `);
  await new Promise(r => setTimeout(r, 1500));

  // 클릭 후 상태
  const afterClick = await page.evaluate(`
    (() => {
      const activeEl = document.activeElement;
      const allInputs = Array.from(document.querySelectorAll('input')).filter(i => i.offsetParent !== null);
      return {
        activeTag: activeEl?.tagName,
        activeType: activeEl?.type,
        activeValue: activeEl?.value,
        visibleInputs: allInputs.map(i => ({type: i.type, value: i.value, placeholder: i.placeholder})).slice(0, 5)
      };
    })()
  `);
  console.log('클릭 후:', JSON.stringify(afterClick, null, 2));

  await b.close();
})().catch(e => console.error('ERR:', e.message));
