const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const TITLES = [
  '영상편집 전담팀 에이컷',
  '숏폼 릴스 48시간 납품',
  '기업 유튜브 편집 대행'
];
const DESCS = [
  '전담 에디터 고정 배정. 소스만 주시면 48시간 납품합니다.',
  '프리랜서 그만 찾으세요. 전담팀 수정 무제한.'
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 제목 입력창 placeholder="제목 1", "제목 2", "제목 3" 찾기
  const titleInputs = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[placeholder^="제목"]'));
    return inputs.map(el => {
      const r = el.getBoundingClientRect();
      return { ph: el.placeholder, x: Math.round(r.x + 10), y: Math.round(r.y + r.height/2), visible: r.y > 0 && r.y < window.innerHeight };
    });
  });
  console.log('제목 입력창:', JSON.stringify(titleInputs));

  // 설명 입력창
  const descInputs = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[placeholder^="설명"], textarea[placeholder^="설명"]'));
    return inputs.map(el => {
      const r = el.getBoundingClientRect();
      return { ph: el.placeholder, x: Math.round(r.x + 10), y: Math.round(r.y + r.height/2), visible: r.y > 0 && r.y < window.innerHeight };
    });
  });
  console.log('설명 입력창:', JSON.stringify(descInputs));

  // 보이는 제목 입력창에 순서대로 입력
  const visibleTitleInputs = titleInputs.filter(i => i.visible).slice(0, 3);
  for (let i = 0; i < visibleTitleInputs.length && i < TITLES.length; i++) {
    const inp = visibleTitleInputs[i];
    // placeholder로 직접 찾아서 입력
    const el = await page.$(`input[placeholder="${inp.ph}"]`);
    if (el) {
      await el.click();
      await sleep(200);
      await el.type(TITLES[i], { delay: 20 });
      console.log(`제목 ${i+1} 입력: ${TITLES[i]}`);
    }
    await sleep(300);
  }

  // 설명 입력
  const visibleDescInputs = descInputs.filter(i => i.visible).slice(0, 2);
  for (let i = 0; i < visibleDescInputs.length && i < DESCS.length; i++) {
    const el = await page.$(`input[placeholder="${visibleDescInputs[i].ph}"], textarea[placeholder="${visibleDescInputs[i].ph}"]`);
    if (el) {
      await el.click();
      await sleep(200);
      await el.type(DESCS[i], { delay: 10 });
      console.log(`설명 ${i+1} 입력: ${DESCS[i].substring(0,20)}...`);
    }
    await sleep(300);
  }

  await sleep(1000);
  await page.screenshot({ path: 'naver_inputs_filled.png' });

  // 저장 버튼 상태
  const saveState = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === '저장');
    return btn ? { disabled: btn.disabled, text: btn.innerText.trim() } : null;
  });
  console.log('저장 버튼:', saveState);

  // 저장 가능하면 클릭
  if (saveState && !saveState.disabled) {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === '저장');
      if (btn) btn.click();
    });
    console.log('저장 클릭!');
    await sleep(3000);
    await page.screenshot({ path: 'naver_saved.png' });
  }

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
