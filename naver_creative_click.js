const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 제목 "전체 추가" 클릭 (스크린샷 기준 약 x=946, y=189)
  await page.mouse.click(946, 189);
  console.log('제목 전체 추가 클릭');
  await sleep(1500);

  // 설명 "전체 추가" 클릭 (약 x=946, y=437)
  await page.mouse.click(946, 437);
  console.log('설명 전체 추가 클릭');
  await sleep(1500);

  await page.screenshot({ path: 'naver_creative_after.png' });

  // 모달 왼쪽 패널 스크롤해서 입력된 제목/설명 확인
  const formState = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="text"], textarea'))
      .map(el => ({ ph: el.placeholder, val: el.value, maxLen: el.maxLength }))
      .filter(el => el.val || el.maxLen > 0)
      .slice(0, 15);
    return inputs;
  });
  console.log('입력된 내용:', JSON.stringify(formState, null, 2));

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
