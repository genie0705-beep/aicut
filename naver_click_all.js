const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 우측 패널 스크롤 올리기
  await page.evaluate(() => {
    const panels = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.x > 730 && r.width > 200 && el.scrollHeight > el.clientHeight;
    });
    if (panels.length > 0) panels[0].scrollTop = 0;
  });
  await sleep(500);

  // 설명 "전체 추가" 클릭 (스크린샷 기준 x=960, y=197)
  await page.mouse.click(960, 197);
  console.log('설명 전체 추가 클릭');
  await sleep(1500);

  await page.screenshot({ path: 'naver_desc_added.png' });

  // 우측 패널 위로 스크롤해서 제목 전체 추가도 클릭
  await page.evaluate(() => {
    const panels = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.x > 730 && r.width > 200 && el.scrollHeight > el.clientHeight;
    });
    if (panels.length > 0) panels[0].scrollTop = 0;
  });
  await sleep(300);

  // 제목 전체 추가 (스크롤 위 → 제목 섹션 찾기)
  const titleSection = await page.evaluate(() => {
    const allEls = Array.from(document.querySelectorAll('*'));
    const titleHeader = allEls.find(el => el.innerText?.trim().startsWith('제목 아이디어'));
    if (titleHeader) {
      const r = titleHeader.getBoundingClientRect();
      return { x: Math.round(r.right - 60), y: Math.round(r.top + r.height/2) };
    }
    return null;
  });
  console.log('제목 섹션 전체 추가 위치:', titleSection);

  if (titleSection && titleSection.y > 0 && titleSection.y < 900) {
    await page.mouse.click(titleSection.x, titleSection.y);
    console.log(`제목 전체 추가 클릭: (${titleSection.x}, ${titleSection.y})`);
    await sleep(1500);
  } else {
    // 우측 패널 스크롤 올려서 재시도
    await page.evaluate(() => {
      const panels = Array.from(document.querySelectorAll('*')).filter(el => {
        const r = el.getBoundingClientRect();
        return r.x > 730 && r.width > 200 && el.scrollHeight > el.clientHeight;
      });
      if (panels.length > 0) panels[0].scrollTop = 0;
    });
    await sleep(300);
    await page.screenshot({ path: 'naver_title_section.png' });
  }

  // 왼쪽 패널 스크롤해서 추가된 제목/설명 확인
  await page.evaluate(() => {
    const modals = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.x < 730 && r.width > 400 && el.scrollHeight > el.clientHeight && el.clientHeight > 200;
    });
    if (modals.length > 0) modals[modals.length-1].scrollTop = 1000;
  });
  await sleep(500);
  await page.screenshot({ path: 'naver_left_filled.png' });

  // 저장 버튼 활성화 확인
  const saveBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText?.trim() === '저장');
    if (btn) return { text: btn.innerText.trim(), disabled: btn.disabled };
    return null;
  });
  console.log('저장 버튼:', saveBtn);

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
