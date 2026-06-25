const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('miricanvas.com') && p.url().includes('design'));

  await sleep(1000);

  // 텍스트 버튼 클릭 (왼쪽 사이드바)
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const textBtn = btns.find(b => b.innerText.trim() === '텍스트');
    if (textBtn) { textBtn.click(); return true; }
    return false;
  });
  console.log('텍스트 버튼 클릭:', clicked);
  await sleep(2000);

  // 텍스트 패널 내 요소 파악
  const panelDetail = await page.evaluate(() => {
    // 왼쪽 패널 상세 탐색
    const panel = document.querySelector('[class*="panel"], [class*="sidebar"], [class*="left"]');
    const allBtns = Array.from(document.querySelectorAll('button, [role="button"]'))
      .map(el => ({
        text: (el.innerText || '').trim().substring(0, 50),
        cls: el.className.substring(0, 60),
        visible: el.offsetParent !== null
      }))
      .filter(el => el.text && el.visible)
      .slice(0, 30);
    return { panelExists: !!panel, btns: allBtns };
  });
  
  console.log('텍스트 패널 버튼들:');
  panelDetail.btns.forEach(b => {
    if (b.text.includes('제목') || b.text.includes('텍스') || b.text.includes('본문') || b.text.includes('추가') || b.text.includes('글자')) {
      console.log('  >', b.text, '|', b.cls.substring(0, 40));
    }
  });
  console.log('전체:', panelDetail.btns.map(b => b.text).join(' / '));

  await b.close();
})().catch(e => console.error('Error:', e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));
