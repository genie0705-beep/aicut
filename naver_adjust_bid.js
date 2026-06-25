const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 5000));

  // ─── 입찰가 조정 대상 ───
  // 경쟁 높은 키워드 → 1,800원
  const HIGH = ['영상편집', '동영상편집', '영상제작', '동영상제작', '영상편집업체', '영상편집외주', '숏폼영상제작', '숏폼영상편집', '인스타그램릴스'];
  // 중간 경쟁 → 1,600원
  const MED = ['영상편집대행', '영상편집비용', '영상편집가격', '영상마케팅', '유튜브영상편집', '유튜브편집외주', '릴스제작', '릴스편집', '숏폼제작업체', '유튜브동영상편집', '인스타그램영상편집', '인스타릴스편집'];

  let totalAdjusted = 0;

  async function processPage() {
    await new Promise(r => setTimeout(r, 2000));
    const result = await page.evaluate(({ high, med }) => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      let adjusted = 0;
      const results = [];

      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        const keywordEl = row.querySelector('.keyword_text') || cells[2];
        const keyword = (keywordEl?.innerText || cells[2]?.innerText || '').trim().replace(/\s+/g, ' ');

        const statusTxt = (cells[3]?.innerText || '').trim();
        if (statusTxt.includes('중지')) return;

        let targetBid = null;
        if (high.includes(keyword)) targetBid = '1,800';
        else if (med.includes(keyword)) targetBid = '1,600';

        if (!targetBid) return;

        const bidInput = row.querySelector('input[type="text"]');
        if (!bidInput) return;

        const currentVal = bidInput.value.replace(/[^0-9]/g, '');
        const targetVal = targetBid.replace(/[^0-9]/g, '');

        if (currentVal === targetVal) {
          results.push(keyword + ': 이미 ' + targetBid + '원');
          return;
        }

        bidInput.click();
        bidInput.focus();
        bidInput.select();
        bidInput.value = targetBid;
        bidInput.dispatchEvent(new Event('input', { bubbles: true }));
        bidInput.dispatchEvent(new Event('change', { bubbles: true }));

        adjusted++;
        results.push(keyword + ': ' + currentVal + ' → ' + targetBid + '원');
      });

      return { adjusted, results };
    }, { high: HIGH, med: MED });

    return result;
  }

  for (let pNum = 1; pNum <= 20; pNum++) {
    if (pNum > 1) {
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
    }

    const result = await processPage();
    if (result.results.length > 0) {
      console.log('=== 페이지 ' + pNum + ' ===');
      result.results.forEach(r => console.log('  ' + r));
    }
    totalAdjusted += result.adjusted;
  }

  console.log('\n✅ 총 ' + totalAdjusted + '개 키워드 입찰가 조정 완료');

  // ─── 저장 확인 ───
  // 일부 페이지는 저장 버튼이 별도로 있을 수 있음
  // Naver UI는 input 변경 시 자동 저장(auto-save) 또는 저장 버튼 필요
  // 저장 버튼 찾아서 클릭
  const saved = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const saveBtn = btns.find(b => {
      const t = b.innerText?.trim();
      return t === '저장' || t === '적용' || t === '확인' || b.className?.includes('save') || b.className?.includes('apply');
    });
    if (saveBtn) { saveBtn.click(); return true; }
    return false;
  });

  if (saved) {
    console.log('✅ 저장 버튼 클릭 완료');
    await new Promise(r => setTimeout(r, 2000));
  } else {
    console.log('ℹ️ 별도 저장 버튼 없음 (자동 저장 방식)');
  }

  await b.close();
})().catch(e => console.log('ERR:', e.message));
