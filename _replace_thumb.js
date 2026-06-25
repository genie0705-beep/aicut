const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pgs = b.contexts()[0].pages();
  let pg;
  for (const p of pgs) { if (p.url().includes('PostWriteForm')) { pg = p; break; } }
  if (!pg) { process.exit(1); }
  
  await pg.bringToFront();
  await pg.waitForTimeout(1000);
  
  // 현재 이미지 확인
  const before = await pg.evaluate(() => document.querySelectorAll('.se-components-wrap img').length);
  console.log('현재 이미지:', before + '장');
  
  // 썸네일(첫번째) 이미지 컴포넌트를 찾아서 삭제
  await pg.evaluate(() => {
    const wrap = document.querySelector('.se-components-wrap');
    if (!wrap) return;
    // 모든 se-component 중에서 첫 번째 이미지가 포함된 것 찾기
    const imgs = wrap.querySelectorAll('img');
    if (imgs.length === 0) return;
    let el = imgs[0];
    while (el && el.parentElement && !el.parentElement.classList.contains('se-component')) {
      el = el.parentElement;
    }
    const comp = el.parentElement; // se-component
    if (comp) comp.remove();
  });
  await pg.waitForTimeout(500);
  
  // 나머지 이미지 확인
  const afterDel = await pg.evaluate(() => document.querySelectorAll('.se-components-wrap img').length);
  console.log('삭제 후:', afterDel + '장');
  
  // 커서를 맨 뒤로 이동 (새 이미지는 맨 뒤에 추가됨 → drag로 순서 조정 필요)
  // 대신, 첫 번째 이미지 위치에 커서를 두려면?
  await pg.mouse.click(400, 250);
  await pg.waitForTimeout(300);
  
  // filechooser 대기
  const fcPromise = pg.waitForEvent('filechooser', { timeout: 10000 });
  await pg.mouse.click(36, 74);
  await pg.waitForTimeout(1000);
  const fc = await fcPromise.catch(() => null);
  
  if (fc) {
    await fc.setFiles(['C:\\Users\\paul\\.openclaw\\workspace\\aicut_blog_ai_thumb.png']);
    await pg.waitForTimeout(2000);
    console.log('✅ 700x700 thumb 등록');
  }
  
  // width:100% 적용
  await pg.evaluate(() => {
    document.querySelectorAll('.se-image-resource').forEach(img => { img.style.width = '100%'; });
  });
  
  // 최종 확인
  const final = await pg.evaluate(() => document.querySelectorAll('.se-components-wrap img').length);
  console.log('최종 이미지:', final + '장');
  
  await pg.evaluate(() => document.querySelector('.save_btn__bzc5B')?.click());
  await pg.waitForTimeout(3000);
  console.log('✅ 저장');
  
  await pg.screenshot({ path: 'thumb_replaced.png' });
  await b.close();
})();
