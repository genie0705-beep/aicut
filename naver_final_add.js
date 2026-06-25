const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const TITLES = ['영상편집 전담팀 에이컷', '숏폼 릴스 48시간 납품', '기업 유튜브 편집 대행'];
const DESCS  = ['전담 에디터 고정 배정. 소스만 주시면 48시간 납품합니다.', '프리랜서 그만 찾으세요. 전담팀 수정 무제한.'];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 우측 AI 패널 상단 스크롤 (제목 아이디어 보기)
  const panelScrolled = await page.evaluate(() => {
    const panels = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.x > 730 && r.width > 200 && el.scrollHeight > el.clientHeight;
    });
    if (panels.length > 0) { panels[0].scrollTop = 0; return panels.length; }
    return 0;
  });
  console.log('패널 스크롤:', panelScrolled);
  await sleep(500);
  await page.screenshot({ path: 'naver_panel_top.png' });

  // 제목 "전체 추가" 클릭 (스크린샷 기준 오른쪽 패널 상단)
  // 설명 "전체 추가" 위치도 확인
  const clickTargets = await page.evaluate(() => {
    const allEls = Array.from(document.querySelectorAll('*'));
    return allEls.filter(el => {
      const t = el.innerText?.trim();
      return t && t.includes('전체 추가') && el.getBoundingClientRect().x > 730;
    }).map(el => {
      const r = el.getBoundingClientRect();
      return { text: el.innerText.trim(), x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), tag: el.tagName };
    }).slice(0, 4);
  });
  console.log('전체 추가 위치:', JSON.stringify(clickTargets));

  // 클릭 시도
  for (const t of clickTargets.filter(c => c.y > 0 && c.y < 900)) {
    await page.mouse.click(t.x, t.y);
    console.log(`클릭: (${t.x}, ${t.y}) - ${t.text}`);
    await sleep(1500);
  }

  await page.screenshot({ path: 'naver_after_allbtn.png' });

  // 왼쪽 패널 스크롤 후 입력창 확인
  await page.evaluate(() => {
    const modals = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.x < 730 && r.width > 400 && el.scrollHeight > el.clientHeight;
    });
    if (modals.length > 0) modals[modals.length-1].scrollTop = 800;
  });
  await sleep(500);
  await page.screenshot({ path: 'naver_left_scroll.png' });

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
