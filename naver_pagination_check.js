const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));

  // 페이지당 표시 수 확인
  const pageSizeInfo = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    return selects.map(s => ({
      options: Array.from(s.options).map(o => o.text + ':' + o.value),
      current: s.value
    }));
  });
  console.log('셀렉트박스:', JSON.stringify(pageSizeInfo, null, 2));

  // 페이지네이션 영역 HTML 확인
  const paginationHtml = await page.evaluate(() => {
    // 마지막 숫자들 찾기
    const text = document.body.innerText;
    const lines = text.split('\n').filter(l => l.trim());
    // "1\n2\n3..." 패턴 찾기
    const idx = lines.findIndex(l => l.trim() === '1');
    if (idx >= 0) return lines.slice(idx, idx + 15).join(' | ');
    return 'NOT FOUND';
  });
  console.log('페이지네이션 텍스트:', paginationHtml);

  // 현재 tbody의 총 행 수 확인
  const rowCount = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
  console.log('현재 tbody 행 수:', rowCount);

  // 스크롤해서 더 로딩되는지 확인
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 2000));
  const rowCount2 = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
  console.log('스크롤 후 행 수:', rowCount2);

  // 페이지 텍스트에서 숫자 패턴 찾기 (페이지네이션)
  const bodyText = await page.evaluate(() => document.body.innerText);
  const lines = bodyText.split('\n').filter(l => l.trim());
  const lastLines = lines.slice(-30);
  console.log('페이지 하단 30줄:', lastLines.join('\n'));

  await b.close();
})().catch(e => console.error('ERR:', e.message));
