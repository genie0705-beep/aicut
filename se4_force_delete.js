const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // 에디터 탭 찾기 (새로고침을 위해 기존 탭 재사용)
  let wp = pages.find(p => p.url().includes('Redirect=Write'));
  if (!wp) {
    wp = await b.contexts()[0].newPage();
    await wp.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await sleep(5000);
  }
  
  await wp.bringToFront();
  await sleep(2000);
  
  // ===== 방법1: force 클릭 + evaluate 조합 =====
  console.log('1. 26 버튼 force 클릭');
  
  const se = wp.frames().find(f => f.url().includes('PostWriteForm'));
  if (!se) { console.log('NO IFRAME'); await b.close(); return; }
  
  // dialog 리스너
  se.on('dialog', async dialog => { await dialog.accept(); });
  
  // force 클릭
  const btn26 = await se.$('button[aria-label*="임시저장"]');
  if (btn26) {
    await btn26.click({ force: true, timeout: 10000 });
    console.log('   클릭됨');
  } else {
    // fallback: text로 찾기
    const btns = await se.$$('button');
    for (const btn of btns) {
      const t = await btn.innerText();
      if (t.trim() === '26') {
        await btn.click({ force: true, timeout: 10000 });
        console.log('   text로 클릭');
        break;
      }
    }
  }
  await sleep(3000);
  
  // ===== 방법2: 팝업 내에서 삭제 버튼 force 클릭 반복 =====
  console.log('\n2. 삭제 버튼들 force 클릭');
  
  let deleted = 0;
  for (let i = 0; i < 30; i++) {
    // 삭제 버튼 찾아서 force 클릭
    const delBtns = await se.$$('button.delete_button__kdXNv');
    let clicked = false;
    
    for (const btn of delBtns) {
      const visible = await btn.evaluate(el => el.offsetParent !== null);
      if (visible) {
        await btn.click({ force: true, timeout: 5000 }).catch(() => {});
        clicked = true;
        break;
      }
    }
    
    if (!clicked) {
      // evaluate로 시도
      const result = await se.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          if (btn.className.includes('delete') && btn.offsetParent !== null) {
            btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            return 'clicked';
          }
        }
        return 'none';
      });
      if (result === 'none') break;
      clicked = true;
    }
    
    if (clicked) {
      deleted++;
      await sleep(2000);
      console.log('   ' + deleted + '개 삭제');
    } else {
      break;
    }
  }
  
  console.log('\n=== 결과 ===');
  if (deleted > 0) {
    console.log(deleted + '개 삭제 완료!');
  } else {
    console.log('0개 삭제됨 → 방법 변경 필요');
    
    // ===== 방법3: page.evaluate로 팝업 내용 분석 =====
    console.log('\n3. 팝업 상태 디버깅');
    const popupState = await se.evaluate(() => {
      const body = document.body.innerText;
      const lines = body.split('\n').filter(l => l.trim());
      
      // 레이어 팝업 찾기
      const layers = document.querySelectorAll('[class*=layer], [class*=popup], [class*=Layer]');
      const results = [];
      layers.forEach(l => {
        results.push({
          cls: l.className.substring(0, 40),
          display: window.getComputedStyle(l).display,
          visible: l.offsetParent !== null,
          text: l.innerText.substring(0, 100).replace(/\n/g, ' ')
        });
      });
      
      return {
        has26btn: body.includes('26'),
        layerCount: layers.length,
        layers: results,
        bodySample: lines.slice(60, 100)
      };
    });
    
    console.log(JSON.stringify(popupState, null, 2));
  }
  
  await b.close();
})();
