const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pgs = b.contexts()[0].pages();
  let pg;
  for (const p of pgs) { if (p.url().includes('PostWriteForm')) { pg = p; break; } }
  if (!pg) { process.exit(1); }
  await pg.bringToFront();
  await pg.waitForTimeout(1000);
  
  // 발행 버튼 클릭
  await pg.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '\uBC1C\uD589') {
        btn.click();
        return;
      }
    }
  });
  console.log('1. \uBC1C\uD589 \uD328\uB110 \uC5F4\uAE30');
  await pg.waitForTimeout(2000);
  
  // 발행 패널에서 발행 버튼 (하단)
  const btnInfo = await pg.evaluate(() => {
    const btns = document.querySelectorAll('button');
    const result = [];
    btns.forEach(btn => {
      const t = (btn.innerText || '').trim();
      const r = btn.getBoundingClientRect();
      if (r.width > 20 && (t === '\uBC1C\uD589' || t === '\uD655\uC778')) {
        result.push({ text: t, x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) });
      }
    });
    return result;
  });
  console.log('2. \uBC1C\uD589 \uBC84\uD2BC:', JSON.stringify(btnInfo));
  
  if (btnInfo.length > 0) {
    // 발행 패널에서 실행 버튼 클릭
    await pg.mouse.click(btnInfo[0].x, btnInfo[0].y);
    await pg.waitForTimeout(5000);
    
    const url = pg.url();
    const title = await pg.title();
    console.log('3. URL:', url.substring(0, 100));
    console.log('4. Title:', title);
    
    if (url.includes('PostView') || title.includes('\uBC14\uB85C\uAC00\uAE30') || !url.includes('PostWriteForm')) {
      console.log('\n\u2705 \uBC1C\uD589 \uC644\uB8CC!');
    } else {
      console.log('\u274C \uBC1C\uD589 \uD655\uC778 \uC2E4\uD328');
    }
  } else {
    console.log('\u274C \uBC1C\uD589 \uBC84\uD2BC \uC5C6\uC74C');
  }
  
  await pg.screenshot({ path: 'blog_publish_result.png' });
  await b.close();
})();
