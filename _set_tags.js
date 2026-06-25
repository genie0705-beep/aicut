const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  let page;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { process.exit(1); }
  
  await page.bringToFront();
  await page.waitForTimeout(1000);
  
  // 발행 패널이 이미 열려있는지 확인
  const tagInput = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if (inp.placeholder === '태그 입력 (최대 30개)') {
        const r = inp.getBoundingClientRect();
        return { x: r.x + r.width/2, y: r.y + r.height/2, w: r.width };
      }
    }
    return null;
  });
  
  if (tagInput) {
    console.log('✅ 태그 입력창 발견:', tagInput.x, tagInput.y);
    
    const tags = '#영상편집외주 #프리랜서편집 #영상편집대행 #에이컷 #AICUT #전담에디터 #48시간납품 #영상편집 #숏폼제작 #릴스편집 #영상제작 #콘텐츠마케팅 #영상마케팅 #SNS영상 #마케팅영상 #브랜드영상 #편집외주 #영상편집비용 #영상편집서비스 #영상편집월정액 #클린트 #수정요청 #브랜드가이드 #전담매니저 #숏폼마케팅 #유튜브편집 #쇼츠제작 #인스타릴스 #영상편집전문 #콘텐츠제작';
    
    // Click and type
    await page.mouse.click(tagInput.x, tagInput.y);
    await page.waitForTimeout(500);
    await page.keyboard.type(tags, { delay: 3 });
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    
    console.log('✅ 태그 입력 완료');
    
    // Close publish panel (click 닫기 or outside)
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if ((btn.innerText || '').includes('닫기')) { btn.click(); return; }
      }
    });
    await page.waitForTimeout(1000);
    
    // Save
    await page.evaluate(() => document.querySelector('.save_btn__bzc5B')?.click());
    await page.waitForTimeout(3000);
    console.log('✅ 저장 완료');
    
    // Verify
    const verify = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      for (const inp of inputs) {
        if (inp.placeholder === '태그 입력 (최대 30개)') {
          const count = inp.value.split('#').length - 1;
          return { count, preview: inp.value.substring(0, 80), found: true };
        }
      }
      return { found: false };
    });
    console.log('Verify:', JSON.stringify(verify));
  } else {
    console.log('❌ 태그 입력창 없음 - 발행 패널 열기');
    
    // Click 발행 button first
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if ((btn.innerText || '').trim() === '발행') { btn.click(); return; }
      }
    });
    await page.waitForTimeout(3000);
    
    // Try again
    const tagInput2 = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      for (const inp of inputs) {
        if (inp.placeholder === '태그 입력 (최대 30개)') {
          const r = inp.getBoundingClientRect();
          return { x: r.x + r.width/2, y: r.y + r.height/2 };
        }
      }
      return null;
    });
    
    if (tagInput2) {
      console.log('✅ 발행 패널 태그 입력창 발견');
      const tags = '#영상편집외주 #프리랜서편집 #영상편집대행 #에이컷 #AICUT #전담에디터 #48시간납품 #영상편집 #숏폼제작 #릴스편집 #영상제작 #콘텐츠마케팅 #영상마케팅 #SNS영상 #마케팅영상 #브랜드영상 #편집외주 #영상편집비용 #영상편집서비스 #영상편집월정액 #클린트 #수정요청 #브랜드가이드 #전담매니저 #숏폼마케팅 #유튜브편집 #쇼츠제작 #인스타릴스 #영상편집전문 #콘텐츠제작';
      await page.mouse.click(tagInput2.x, tagInput2.y);
      await page.waitForTimeout(500);
      await page.keyboard.type(tags, { delay: 3 });
      await page.waitForTimeout(1000);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1500);
      console.log('✅ 태그 입력 완료');
      
      // Close panel & save
      await page.evaluate(() => {
        document.querySelectorAll('button').forEach(b => { if ((b.innerText||'').includes('닫기')) b.click(); });
      });
      await page.waitForTimeout(1000);
      await page.evaluate(() => document.querySelector('.save_btn__bzc5B')?.click());
      await page.waitForTimeout(3000);
      console.log('✅ 저장 완료');
    }
  }
  
  await page.screenshot({ path: 'tags_final.png' });
  await b.close();
})();
