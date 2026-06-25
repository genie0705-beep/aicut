const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('Write'));
  if (!page) page = pages.find(p => p.url().includes('postwrite'));
  if (!page) { console.log('탭 없음'); await b.close(); process.exit(0); }

  await new Promise(r => setTimeout(r, 1000));

  // body 텍스트에서 발행 위치 찾기
  const text = await page.evaluate(() => document.body.innerText);
  const idx = text.indexOf('발행');
  console.log('발행 텍스트 위치:', idx);
  if (idx >= 0) {
    console.log('주변:', text.substring(Math.max(0, idx-10), idx+30));
  }

  // 모든 요소에서 '발행' 텍스트 찾기 (mainFrame 포함)
  const frames = page.frames();
  let found = false;
  
  for (const f of frames) {
    const btn = await f.evaluate(() => {
      const all = document.querySelectorAll('*');
      for (const el of all) {
        const t = (el.innerText || '').trim();
        if (t === '발행' || t === '발행하기') {
          const r = el.getBoundingClientRect();
          if (r.width > 0) {
            return { x: r.x + r.width/2, y: r.y + r.height/2, text: t, tag: el.tagName, frame: true };
          }
        }
      }
      return null;
    }).catch(() => null);
    
    if (btn) {
      console.log('발행 버튼 발견:', JSON.stringify(btn));
      // page.mouse.click 사용 (frame의 위치는 page 기준)
      await page.mouse.click(btn.x, btn.y);
      await new Promise(r => setTimeout(r, 3000));
      console.log('클릭 완료');
      found = true;
      
      // 모달 확인
      const afterText = await page.evaluate(() => document.body.innerText.substring(0, 500));
      console.log('발행 후:', afterText.substring(0, 200));
      break;
    }
  }

  if (!found) {
    console.log('어디서도 발행 버튼을 찾지 못함');
    // Ctrl+Enter 시도 (네이버 블로그 발행 단축키)
    console.log('Ctrl+Enter 시도...');
    await page.keyboard.press('Control+Enter');
    await new Promise(r => setTimeout(r, 3000));
    console.log('단축키 전송 완료');
  }

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
