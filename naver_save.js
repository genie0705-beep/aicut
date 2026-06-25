const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const DESCS = [
  '전담 에디터 고정 배정. 소스만 주시면 48시간 납품합니다.',
  '프리랜서 그만 찾으세요. 전담팀 수정 무제한.'
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 모달 스크롤 다운
  await page.evaluate(() => {
    const modals = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.x < 730 && r.width > 400 && el.scrollHeight > el.clientHeight && el.clientHeight > 200;
    });
    if (modals.length > 0) modals[modals.length-1].scrollTop += 600;
  });
  await sleep(500);

  // 설명 입력
  for (let i = 0; i < DESCS.length; i++) {
    const ph = `설명 ${i+1}`;
    const el = await page.$(`input[placeholder="${ph}"], textarea[placeholder="${ph}"]`);
    if (el) {
      const rect = await el.evaluate(e => {
        const r = e.getBoundingClientRect();
        return { y: r.y, visible: r.y > 0 && r.y < window.innerHeight };
      });

      if (!rect.visible) {
        // 더 스크롤
        await page.evaluate(() => {
          const modals = Array.from(document.querySelectorAll('*')).filter(el => {
            const r = el.getBoundingClientRect();
            return r.x < 730 && r.width > 400 && el.scrollHeight > el.clientHeight && el.clientHeight > 200;
          });
          if (modals.length > 0) modals[modals.length-1].scrollTop += 400;
        });
        await sleep(300);
      }

      await el.scrollIntoViewIfNeeded();
      await sleep(300);
      await el.click();
      await sleep(200);
      await el.type(DESCS[i], { delay: 10 });
      console.log(`설명 ${i+1} 입력: ${DESCS[i].substring(0,25)}...`);
      await sleep(300);
    } else {
      console.log(`설명 ${i+1} 입력창 없음`);
    }
  }

  await sleep(500);
  await page.screenshot({ path: 'naver_desc_filled.png' });

  // 저장 버튼 상태 확인 및 클릭
  const saveState = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === '저장');
    return btn ? { disabled: btn.disabled } : null;
  });
  console.log('저장 버튼 상태:', saveState);

  if (saveState && !saveState.disabled) {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === '저장');
      if (btn) btn.click();
    });
    console.log('✅ 저장 클릭!');
    await sleep(4000);
    await page.screenshot({ path: 'naver_creative_done.png' });
  } else {
    console.log('저장 버튼 비활성 — 필수 입력 누락 확인 필요');
    // 현재 폼 상태 확인
    const formState = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input[placeholder], textarea[placeholder]'))
        .filter(el => el.placeholder.includes('제목') || el.placeholder.includes('설명'))
        .map(el => ({ ph: el.placeholder, val: el.value, maxLen: el.maxLength }));
    });
    console.log('폼 상태:', JSON.stringify(formState));
  }

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
