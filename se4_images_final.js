const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];

  // 기존 에디터 페이지 찾기 (없으면 새로 열기)
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('Redirect=Write')) { page = p; break; }
  }
  if (!page) {
    page = await ctx.newPage();
    page.on('dialog', async d => d.dismiss());
    await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
  }

  // SE4 iframe
  let ef = null;
  for (const f of page.frames()) {
    try { if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) { ef = f; break; } } catch(e) {}
  }
  if (!ef) { console.log('❌ SmartEditor 없음'); return; }
  console.log('✅ SE4 발견\n');

  // 이미지 5장 업로드
  const images = ['aicut_blog_main.png', 'aicut_blog_card1.png', 'aicut_blog_card2.png', 'aicut_blog_card3.png', 'aicut_blog_cta.png'];

  for (let i = 0; i < images.length; i++) {
    const imgFile = images[i];
    const buf = fs.readFileSync(path.join(__dirname, imgFile));
    const b64 = buf.toString('base64');
    
    console.log(`${i+1}. ${imgFile} (${Math.round(buf.length/1024)}KB)...`);

    // filechooser 시도 1: 사진 버튼 클릭 (보이는 버튼 직접 선택)
    try {
      const buttons = await ef.$$('button');
      let photoBtn = null;
      for (const btn of buttons) {
        const text = await btn.innerText();
        if (text.trim() === '사진' || text.startsWith('사진\n')) {
          const box = await btn.boundingBox();
          if (box && box.x > 0) { photoBtn = btn; break; }
        }
      }
      
      if (photoBtn) {
        const [fc] = await Promise.all([
          page.waitForEvent('filechooser', { timeout: 10000 }),
          photoBtn.click()
        ]);
        await fc.setFiles([path.join(__dirname, imgFile)]);
        console.log('   ✅ filechooser 성공');
        await page.waitForTimeout(6000);
        continue;
      }
    } catch(e) {
      console.log(`   filechooser 실패: ${e.message}`);
    }

    // filechooser 시도 2: context 레벨
    try {
      const buttons = await ef.$$('button');
      let photoBtn = null;
      for (const btn of buttons) {
        const text = await btn.innerText();
        if (text.trim() === '사진' || text.startsWith('사진\n')) {
          const box = await btn.boundingBox();
          if (box && box.x > 0) { photoBtn = btn; break; }
        }
      }
      
      if (photoBtn) {
        const [fc] = await Promise.all([
          ctx.waitForEvent('filechooser', { timeout: 10000 }),
          photoBtn.click()
        ]);
        await fc.setFiles([path.join(__dirname, imgFile)]);
        console.log('   ✅ context filechooser 성공');
        await page.waitForTimeout(6000);
        continue;
      }
    } catch(e) {
      console.log(`   context filechooser 실패: ${e.message}`);
    }

    // 최종 fallback: page.evaluate로 파일 input 생성하여 업로드
    console.log('   → data URL 방식 시도...');
    const result = await ef.evaluate(({ bucket, fileName }) => {
      return new Promise((resolve) => {
        try {
          // SE4의 이미지 추가 API 호출
          const ed = SmartEditor._editors['blogpc001'];
          if (ed._commandService && typeof ed._commandService.execCommand === 'function') {
            // SE4 명령으로 이미지 추가 시도
            ed._commandService.execCommand('image', { 
              imageUrl: bucket,
              altText: fileName
            });
            resolve({ method: 'commandService', ok: true });
          } else {
            resolve({ method: 'none', ok: false, msg: 'no commandService' });
          }
        } catch(e) {
          resolve({ method: 'error', ok: false, msg: e.message });
        }
      });
    }, { bucket: b64, fileName: imgFile });
    console.log(`   ${JSON.stringify(result)}`);
    await page.waitForTimeout(3000);
  }

  // 저장
  console.log('\n저장...');
  await ef.evaluate(() => {
    for (const btn of document.querySelectorAll('button')) {
      if (btn.innerText.trim() === '저장') { btn.click(); break; }
    }
  });

  console.log('\n✅ 완료! 브라우저 확인 바랍니다.');
})();
