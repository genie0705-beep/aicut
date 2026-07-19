const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 첫 포스트
  await page.goto('https://blog.naver.com/aicut/224333770986', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await sleep(5000);

  // PostView 프레임
  const pf = page.frames().find(f => f.url().includes('PostView'));
  if (!pf) { console.log('PostView not found'); b.close(); return; }

  // "통계" 버튼 찾아서 클릭
  const linkInfo = await pf.evaluate(() => {
    const allElements = document.querySelectorAll('a, span, button, div');
    for (const el of allElements) {
      if (el.textContent && el.textContent.trim() === '통계') {
        return {
          tag: el.tagName,
          text: el.textContent.trim(),
          href: el.href || '',
          className: el.className,
          id: el.id,
          onclick: el.getAttribute('onclick') || '',
          rect: el.getBoundingClientRect()
        };
      }
    }
    return null;
  });

  if (linkInfo) {
    console.log('=== 통계 버튼 정보 ===');
    console.log(JSON.stringify(linkInfo, null, 2));

    // 클릭
    console.log('\n클릭 시도...');
    try {
      await pf.click('text=통계');
      await sleep(3000);
      
      console.log('클릭 후 팝업/페이지 상태:');
      // 새 창/팝업 확인
      const allPages = ctx.pages();
      console.log(`  전체 페이지: ${allPages.length}`);
      for (const p of allPages) {
        console.log(`  ${p.url().substring(0, 100)}`);
      }
      
      // 모달/레이어 팝업 확인
      const popupText = await pf.evaluate(() => {
        // 숨겨진 레이어나 팝업 div 찾기
        const divs = document.querySelectorAll('div[style*="display" i], div[class*="popup"], div[class*="layer"], div[class*="modal"], div[id*="popup"], div[id*="layer"]');
        const popups = [];
        for (const d of divs) {
          if (d.textContent.trim().length > 10 && d.textContent.trim().length < 5000) {
            popups.push({
              id: d.id,
              cls: d.className.substring(0, 40),
              text: d.textContent.trim().substring(0, 200),
              visible: d.style.display !== 'none' && d.style.visibility !== 'hidden'
            });
          }
        }
        return popups.slice(0, 10);
      });

      if (popupText.length > 0) {
        console.log('\n팝업/레이어 발견:');
        popupText.forEach(p => console.log(`  [${p.id || '?'}] ${p.text.substring(0, 150)}`));
      } else {
        console.log('\n팝업/레이어 없음');
      }

      // 전체 body에서 새로운 내용 확인
      const newText = await pf.evaluate(() => document.body.innerText);
      const searchTerms = ['조회', '공감', '댓글', '방문자', '노출'];
      for (const term of searchTerms) {
        const idx = newText.indexOf(term);
        if (idx >= 0) {
          console.log(`  "${term}" 발견: ${newText.substring(Math.max(0, idx - 20), idx + 60).replace(/\n/g, ' ').trim()}`);
        }
      }

    } catch(e) {
      console.log('클릭 오류:', e.message.substring(0, 50));
    }
  } else {
    console.log('⚠️ "통계" 버튼을 찾을 수 없음');
    console.log('PostView 텍스트 샘플:');
    const t = await pf.evaluate(() => document.body.innerText.substring(0, 1000));
    console.log(t.substring(0, 500));
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
