const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));

  // 페이지당 100개로 변경
  const pageSize = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    for (const sel of selects) {
      if (Array.from(sel.options).some(o => o.value === '100' || o.text.includes('100'))) {
        const opt = Array.from(sel.options).find(o => o.value === '100' || o.text.includes('100'));
        if (opt) sel.value = opt.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  });
  await new Promise(r => setTimeout(r, 3000));

  // 키워드 테이블에서 정확하게 추출
  const keywords = await page.evaluate(() => {
    const results = [];
    // 테이블의 각 행을 찾기
    const rows = document.querySelectorAll('tbody tr, [role="rowgroup"] [role="row"]');
    for (const row of rows) {
      const cells = row.querySelectorAll('td, [role="cell"]');
      if (cells.length < 3) continue;
      const cellTexts = Array.from(cells).map(c => c.innerText?.trim().replace(/\n/g, ' '));
      results.push(cellTexts);
    }
    return results;
  });

  console.log(`행 수: ${keywords.length}`);
  keywords.slice(0, 20).forEach((row, i) => {
    console.log(`[${i+1}]`, row.slice(0, 8).join(' | '));
  });

  // 대안: 페이지 전체 텍스트에서 키워드 패턴 추출
  console.log('\n--- 텍스트 기반 키워드 추출 ---');
  const fullText = await page.evaluate(() => document.body.innerText);
  const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);
  const kwLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 키워드 패턴: 한글/영문 키워드 + 다음 줄에 노출가능/일시정지 등
    if (lines[i+1] && (lines[i+1].includes('노출가능') || lines[i+1].includes('일시정지') || lines[i+1].includes('검토중'))) {
      kwLines.push({ keyword: line, status: lines[i+1] });
    }
  }
  console.log(`키워드 ${kwLines.length}개 발견`);
  kwLines.forEach((k, i) => console.log(`${i+1}. ${k.keyword} (${k.status})`));

  await b.close();
})().catch(e => console.error('ERR:', e.message));
