const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  // 보고서 페이지로 이동
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));

  // 다운로드 버튼 클릭
  const downloadClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const btn = btns.find(b => b.innerText?.trim() === '다운로드');
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('다운로드 버튼:', downloadClicked);
  await new Promise(r => setTimeout(r, 3000));

  const text = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('다운로드 후:', text.substring(0, 300));

  // 대신 '상세 데이터' 탭 확인
  const detailClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"], a'));
    const btn = btns.find(b => b.innerText?.includes('상세 데이터'));
    if (btn) { btn.click(); return btn.innerText?.trim(); }
    return null;
  });
  console.log('상세 데이터:', detailClicked);
  await new Promise(r => setTimeout(r, 3000));
  console.log('URL:', page.url());

  // 10개씩 → 페이지 이동 방식 체크
  const pagination = await page.evaluate(() => {
    const allBtns = Array.from(document.querySelectorAll('button'));
    const pageNums = allBtns.filter(b => {
      const t = b.innerText?.trim();
      return /^[0-9]+$/.test(t) && parseInt(t) < 100;
    }).map(b => b.innerText.trim());
    return { pageNums, total: pageNums.length };
  });
  console.log('페이지 버튼:', pagination);

  await b.close();
})().catch(e => console.error('ERR:', e.message));
