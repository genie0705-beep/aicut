const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pgs = b.contexts()[0].pages();
  let page;
  for (const p of pgs) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { process.exit(1); }
  
  await page.bringToFront();
  await page.waitForTimeout(1500);
  
  // 제목 확인 (유지되는지)
  const title = await page.evaluate(() => document.querySelector('.se-documentTitle')?.innerText?.trim()?.substring(0,20) || '');
  console.log('제목:', title || '❌');
  
  // 텍스트 본문 확인  
  const text = await page.evaluate(() => document.querySelector('.se-content')?.innerText?.length || 0);
  console.log('본문:', text + '자');
  
  // 이미지 5장 등록 (순서대로)
  const images = [
    'aicut_blog_ai_thumb.png',
    'aicut_blog_ai_01.png',
    'aicut_blog_ai_02.png',
    'aicut_blog_ai_03.png',
    'aicut_blog_ai_cta.png'
  ];
  
  for (let i = 0; i < images.length; i++) {
    const imgPath = path.join(WORKSPACE, images[i]);
    process.stdout.write(`이미지 ${i+1}/5: ${images[i]}... `);
    
    // 커서를 본문 끝으로 이동
    const endPos = await page.evaluate(() => {
      const content = document.querySelector('.se-content');
      if (content) { const r = content.getBoundingClientRect(); return { x: r.x + 100, y: r.y + r.height - 30 }; }
      return null;
    });
    if (endPos) {
      await page.mouse.click(endPos.x, endPos.y);
      await page.waitForTimeout(300);
      await page.keyboard.press('End');
      await page.waitForTimeout(300);
      // 줄바꿈 2번
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
    
    // filechooser 대기 + 사진 버튼 클릭
    const fcPromise = page.waitForEvent('filechooser', { timeout: 10000 });
    await page.mouse.click(36, 74);
    const fc = await fcPromise.catch(() => null);
    
    if (fc) {
      await fc.setFiles([imgPath]);
      await page.waitForTimeout(2000);
      console.log('✅');
    } else {
      console.log('❌');
    }
  }
  
  // width:100%
  await page.evaluate(() => {
    document.querySelectorAll('.se-image-resource').forEach(img => { img.style.width = '100%'; });
  });
  
  // 센터 정렬
  await page.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => { p.style.textAlign = 'center'; });
  });
  
  // 저장
  await page.evaluate(() => document.querySelector('.save_btn__bzc5B')?.click());
  await page.waitForTimeout(3000);
  
  const finalImgs = await page.evaluate(() => document.querySelectorAll('.se-components-wrap img').length);
  console.log('\n최종 이미지:', finalImgs + '장');
  console.log('✅ 저장 완료');
  
  await page.screenshot({ path: 'img_recovered.png' });
  await b.close();
})();
