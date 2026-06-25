const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 5000));

  const allKws = [];

  async function extractPage() {
    await new Promise(r => setTimeout(r, 2000));
    return await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        const keywordEl = row.querySelector('.keyword_text') || cells[2];
        const bidInput = row.querySelector('input[type="text"]');
        return {
          keyword: (keywordEl?.innerText || cells[2]?.innerText || '').trim(),
          status: (cells[3]?.innerText || '').trim(),
          bid: bidInput ? bidInput.value : (cells[4]?.innerText || '').trim(),
          impressions: (cells[7]?.innerText || '0').trim(),
          clicks: (cells[8]?.innerText || '0').trim()
        };
      }).filter(k => k.keyword && k.keyword !== '키워드' && k.keyword.length > 1);
    });
  }

  // Page 1
  const p1 = await extractPage();
  allKws.push(...p1);
  console.log('페이지 1: ' + p1.length + '개');

  for (let pNum = 2; pNum <= 20; pNum++) {
    const clicked = await page.evaluate((targetPage) => {
      const allEls = Array.from(document.querySelectorAll('button, li, a, span'));
      const el = allEls.find(e => {
        const t = e.innerText?.trim();
        return t === String(targetPage) && e.offsetParent !== null;
      });
      if (el) { el.click(); return true; }
      return false;
    }, pNum);

    if (!clicked) {
      const nextClicked = await page.evaluate(() => {
        const allEls = Array.from(document.querySelectorAll('button, li, a'));
        const nextEl = allEls.find(e => e.innerText?.trim() === '다음' || e.getAttribute('aria-label') === '다음');
        if (nextEl && !nextEl.disabled) { nextEl.click(); return true; }
        return false;
      });
      if (!nextClicked) { console.log('페이지 ' + pNum + ' 없음, 종료'); break; }
    }

    const rows = await extractPage();
    if (rows.length === 0) { console.log('페이지 ' + pNum + ' 데이터 없음, 종료'); break; }
    allKws.push(...rows);
    console.log('페이지 ' + pNum + ': ' + rows.length + '개');
  }

  console.log('\n=== 전체 키워드 목록 (' + allKws.length + '개) ===');
  allKws.forEach((k, i) => {
    console.log((i+1) + '. ' + k.keyword + ' | ' + k.status + ' | 입찰가:' + k.bid + ' | 노출:' + k.impressions + ' | 클릭:' + k.clicks);
  });

  // Find keywords that need bid adjustment (those with [기본] = using default, or too low)
  console.log('\n=== 기본 입찰가 사용중 ([기본]) ===');
  allKws.filter(k => k.bid.includes('기본')).forEach(k => {
    console.log(k.keyword + ' | ' + k.status + ' | 입찰가:' + k.bid);
  });

  console.log('\n=== 클릭 0 / 노출 0 (개선 필요) ===');
  allKws.filter(k => k.impressions === '0' && k.clicks === '0' && k.status.includes('가능')).forEach(k => {
    console.log(k.keyword + ' | ' + k.status + ' | 입찰가:' + k.bid);
  });

  await b.close();
})().catch(e => console.log('ERR:', e.message));
