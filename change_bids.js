const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('ads.naver.com/manage'));
  if (!page) page = await ctx.newPage();

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', {
    waitUntil: 'domcontentloaded', timeout: 20000
  });
  await sleep(6000);

  // 가장 높은 입찰가가 필요한 키워드들 (2,500원)
  const HIGH_BID = ['영상편집', '영상제작', '동영상편집', '동영상제작', '유튜브영상편집', '유튜브편집'];
  const MED_BID = ['숏폼영상제작', '숏폼마케팅', 'SNS영상편집', '광고영상편집', '릴스제작', '릴스편집', '인스타그램릴스'];

  let totalChanged = 0;

  for (let pg = 1; pg <= 10; pg++) {
    await sleep(3000);
    
    // 페이지 스크롤 후 데이터 로딩
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      setTimeout(() => window.scrollTo(0, 0), 500);
    });
    await sleep(2000);

    // 현재 페이지 키워드와 체크박스 매핑
    const pageKws = await page.evaluate(() => {
      const checks = document.querySelectorAll('.ad-cms-checkbox-input');
      const result = [];
      checks.forEach((cb, idx) => {
        const parent = cb.closest('[class*="row"], [class*="Row"], tr');
        let keyword = '';
        if (parent) {
          const kwEl = parent.querySelector('[class*="keyword"]');
          if (kwEl) keyword = kwEl.innerText.replace(/\n/g, ' ').trim();
        }
        result.push({ checkboxIdx: idx, keyword, checked: cb.checked });
      });
      return result;
    });

    // OFF된 키워드 제외하고, KEEP 키워드만 대상으로 입찰가 설정
    for (const kw of pageKws) {
      if (!kw.keyword || kw.keyword === 'SNS') continue;
      
      let newBid = 0;
      const name = kw.keyword;
      
      // 입찰가 결정
      if (HIGH_BID.some(h => name.includes(h) || name === h)) {
        newBid = 2500;
      } else if (MED_BID.some(m => name.includes(m) || name === m)) {
        newBid = 2000;
      } else {
        newBid = 1500;  // 기본 KEEP 키워드
      }

      // 체크박스 선택
      if (kw.checkboxIdx >= 0) {
        const cb = page.locator('.ad-cms-checkbox-input').nth(kw.checkboxIdx);
        const isChecked = await cb.isChecked();
        if (!isChecked) {
          await cb.check();
        }
      }
    }

    // 선택된 키워드 수 확인
    const selectedCount = await page.evaluate(() => {
      const checks = document.querySelectorAll('.ad-cms-checkbox-input:checked');
      return checks.length;
    });
    console.log(`페이지 ${pg}: ${selectedCount}개 키워드 선택됨`);

    // "입찰가 변경" 버튼 클릭
    if (selectedCount > 0) {
      await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          if (btn.innerText.trim() === '입찰가 변경') {
            btn.click();
            return;
          }
        }
      });
      await sleep(2000);

      // 모달 확인
      const modal = await page.evaluate(() => {
        const text = document.body.innerText;
        const idx = text.indexOf('입찰가 변경');
        if (idx >= 0) {
          return text.substring(idx, Math.min(idx + 300, text.length));
        }
        return 'modal not shown';
      });
      console.log(`  입찰가 변경 모달:`, modal.substring(0, 200));
      
      // 모달 닫기 (Esc)
      await page.keyboard.press('Escape');
      await sleep(1000);

      // 체크박스 해제
      for (const kw of pageKws) {
        if (kw.checkboxIdx >= 0 && kw.keyword) {
          const cb = page.locator('.ad-cms-checkbox-input').nth(kw.checkboxIdx);
          if (await cb.isChecked()) {
            await cb.uncheck();
          }
        }
      }
    }

    // 다음 페이지 이동
    if (pg < 10) {
      await page.evaluate(() => window.scrollTo(0, 700));
      await sleep(500);
      
      const nextPg = pg + 1;
      const clicked = await page.evaluate((n) => {
        const allEls = document.querySelectorAll('button, a, span, div');
        for (const el of allEls) {
          if (el.innerText.trim() === String(n) && el.offsetParent !== null) {
            el.click();
            return true;
          }
        }
        return false;
      }, nextPg);
      
      console.log(`  → ${nextPg}페이지 이동: ${clicked}`);
      if (!clicked) break;
    }
  }

  console.log(`\n✅ 입찰가 변경 처리 완료`);
  await b.close();
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
