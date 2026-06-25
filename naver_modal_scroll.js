const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const TITLES = ['영상편집 전담팀 에이컷', '숏폼 릴스 48시간 납품', '기업 유튜브 편집 대행'];
const DESCS  = ['전담 에디터 고정 배정. 소스만 주시면 48시간 납품합니다.', '프리랜서 그만 찾으세요. 전담팀 수정 무제한.'];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 모달 내 스크롤 가능한 요소 찾아서 스크롤 다운
  await page.evaluate(() => {
    // 모달 body 요소 찾기
    const scrollables = Array.from(document.querySelectorAll('*')).filter(el => {
      const style = window.getComputedStyle(el);
      return (style.overflow === 'auto' || style.overflow === 'scroll' ||
              style.overflowY === 'auto' || style.overflowY === 'scroll') &&
             el.scrollHeight > el.clientHeight && el.clientHeight > 100;
    });
    if (scrollables.length > 0) {
      scrollables[scrollables.length - 1].scrollTop = 600;
      return scrollables.length;
    }
    return 0;
  });
  await sleep(500);

  await page.screenshot({ path: 'naver_modal_scroll.png' });

  // 화면 안에 있는 입력창 재확인
  const inputs = await page.evaluate(() => {
    const viewH = window.innerHeight;
    return Array.from(document.querySelectorAll('input,textarea'))
      .map(el => {
        const r = el.getBoundingClientRect();
        return { maxLen: el.maxLength, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), val: el.value, visible: r.y > 0 && r.y < viewH };
      })
      .filter(el => el.visible && el.w > 200)
      .slice(0, 15);
  });
  console.log('화면 내 입력창:', JSON.stringify(inputs, null, 2));

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
