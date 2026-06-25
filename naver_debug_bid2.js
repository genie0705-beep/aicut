const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 5000));

  const debug = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const targets = ['영상편집', '동영상편집', '숏폼영상제작'];
    const results = [];

    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      const keywordEl = row.querySelector('.keyword_text') || cells[2];
      const keyword = (keywordEl?.innerText || cells[2]?.innerText || '').trim().replace(/\s+/g, ' ');

      if (!targets.some(t => keyword.includes(t))) return;

      // Focus on the bid column (4th column, index 4)
      const bidCell = cells[4];
      const bidHTML = bidCell?.innerHTML || '';

      results.push({
        keyword: keyword,
        bidHTML: bidHTML,
        bidText: bidCell?.innerText?.replace(/\s+/g, ' ').trim()
      });
    });

    return results;
  });

  console.log('=== 입찰가 셀 HTML ===');
  debug.forEach(d => {
    console.log('\n--- ' + d.keyword + ' ---');
    console.log('Text: ' + d.bidText);
    console.log('HTML:');
    console.log(d.bidHTML);
  });

  // Now click on the bid cell to see if it activates
  console.log('\n\n=== 클릭 후 변화 ===');
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const keywordEl = rows[0]?.querySelector('.keyword_text');
    if (!keywordEl) return 'no keyword found on first row';
    const keyword = keywordEl.innerText?.trim();
    // Find the parent row and the bid cell (index 4 or 5)
    const row = keywordEl.closest('tr');
    const cells = Array.from(row.querySelectorAll('td'));
    const bidCell = cells[4] || cells[5];
    if (bidCell) {
      bidCell.click();
      return 'Clicked bid cell for: ' + keyword;
    }
    return 'no bid cell found';
  });

  await new Promise(r => setTimeout(r, 1000));

  const afterClick = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const firstRow = rows[0];
    if (!firstRow) return 'no rows';
    const cells = Array.from(firstRow.querySelectorAll('td'));
    const bidCell = cells[4] || cells[5];
    return {
      bidHTML: bidCell?.innerHTML || '',
      bidText: bidCell?.innerText?.replace(/\s+/g, ' ').trim() || ''
    };
  });

  console.log(JSON.stringify(afterClick, null, 2));

  await b.close();
})().catch(e => console.log('ERR:', e.message));
