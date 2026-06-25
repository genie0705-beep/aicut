const { chromium } = require('playwright');
const path = require('path');
const IMG_DIR = path.join(__dirname, 'blog_images');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adPage = pages.find(p => p.url().includes('ads.naver.com'));
  await adPage.setViewportSize({ width: 1400, height: 900 });

  let totalOn = 0;

  // 2~10페이지 처리
  for (let targetPg = 2; targetPg <= 10; targetPg++) {
    console.log(`\n[PAGE ${targetPg}]`);

    // 하단까지 스크롤
    await adPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(500);

    // 페이지 버튼 클릭 (페이지네이션)
    const pgClicked = await adPage.evaluate((pg) => {
      // ad-cms-pagination 내의 숫자 버튼
      const paginations = document.querySelectorAll('[class*="pagination"] button, [class*="pagination"] a');
      for (const btn of paginations) {
        if (btn.textContent.trim() === String(pg)) {
          btn.click();
          return true;
        }
      }
      // 일반 버튼으로도 시도
      const allBtns = Array.from(document.querySelectorAll('button'));
      const pgBtn = allBtns.filter(b => b.textContent.trim() === String(pg) && b.getBoundingClientRect().y > 500);
      if (pgBtn.length > 0) {
        pgBtn[pgBtn.length-1].click();
        return true;
      }
      return false;
    }, targetPg);

    if (!pgClicked) {
      console.log(`  No page ${targetPg} button`);
      break;
    }
    await sleep(1500);

    // 상단으로 스크롤해서 키워드 테이블 보이게
    await adPage.mouse.wheel(0, 600);
    await sleep(400);

    // OFF 키워드 선택
    const offCount = await adPage.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr'));
      let count = 0;
      rows.forEach(row => {
        if (row.textContent.includes('키워드 OFF')) {
          const cb = row.querySelector('input[type="checkbox"]');
          if (cb && !cb.checked) {
            cb.click();
            count++;
          }
        }
      });
      return count;
    });
    console.log(`  OFF: ${offCount}개`);

    if (offCount > 0) {
      await sleep(400);
      // ON 버튼 클릭
      const onClicked = await adPage.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const onBtn = btns.find(b => b.textContent.trim() === 'ON');
        if (onBtn) { onBtn.click(); return true; }
        return false;
      });
      if (onClicked) {
        await sleep(1500);
        totalOn += offCount;
        console.log(`  ✅ ${offCount}개 ON 처리`);
      }
    }
  }

  console.log(`\n✅ 추가 ON 처리: ${totalOn}개`);
  await adPage.screenshot({ path: path.join(IMG_DIR, 'all_on_complete.png') });
  await browser.close();
})().catch(e => console.error(e.message));
