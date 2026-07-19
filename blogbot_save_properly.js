// 저장: 발행 버튼 → 팝업 확인 순서로
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  // Find ONE editor page and work with it
  let targetPage = null;
  let targetFrame = null;

  for (const p of ctx.pages()) {
    const frames = p.frames();
    for (const f of frames) {
      if (f.name() === 'mainFrame') {
        try {
          const url = f.url();
          if (url.includes('postupdate')) {
            targetPage = p;
            targetFrame = f;
            break;
          }
        } catch(e) {}
      }
    }
    if (targetFrame) break;
  }

  if (!targetFrame) { console.log('Editor not found'); await b.close(); return; }

  console.log('Editor found');

  // Set dialog handler
  targetPage.on('dialog', async d => {
    console.log(`다이얼로그: ${d.type()} - ${d.message().substring(0, 80)}`);
    await d.accept();
  });

  // Step 1: Click "발행" 버튼 (this should open the publish popup)
  console.log('\n[1] 발행 버튼 클릭 (팝업 열기)...');
  await targetFrame.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent.trim() === '발행' && btn.offsetParent !== null && !btn.closest('.layer_popup')) {
        btn.scrollIntoView({ block: 'center' });
        btn.click();
        console.log('clicked');
        return;
      }
    }
  });
  await targetPage.waitForTimeout(2000);

  // Step 2: Wait for publish popup and click the confirm "발행" button inside it
  console.log('[2] 팝업 확인 및 내부 발행 버튼 클릭...');
  let popupFound = false;
  for (let i = 0; i < 10; i++) {
    const popupResult = await targetFrame.evaluate(() => {
      const popup = document.querySelector('.layer_popup__i0QOY.is_show__TMSLq');
      if (popup) {
        const btns = popup.querySelectorAll('button');
        for (const btn of btns) {
          const text = btn.textContent.trim();
          if (text === '발행') {
            btn.click();
            return { found: true, clicked: true, text };
          }
        }
        return { found: true, clicked: false, buttons: Array.from(btns).map(b => b.textContent.trim()) };
      }
      return { found: false };
    });

    if (popupResult.found) {
      popupFound = true;
      console.log(`   팝업 발견: ${JSON.stringify(popupResult)}`);
      if (popupResult.clicked) {
        console.log('   ✅ 팝업 내 발행 버튼 클릭됨');
        break;
      }
      if (i === 9) {
        console.log('   ⚠️ 팝업 내 발행 버튼 없음. 닫기 시도...');
        // Close popup and retry
        await targetFrame.evaluate(() => {
          const popup = document.querySelector('.layer_popup__i0QOY');
          if (popup) popup.remove();
        });
      }
    }
    await targetPage.waitForTimeout(1000);
  }

  if (!popupFound) {
    console.log('   ⚠️ 팝업이 나타나지 않음');
  }

  // Step 3: Wait for save to complete
  console.log('\n[3] 저장 완료 대기...');
  for (let i = 0; i < 30; i++) {
    await targetPage.waitForTimeout(1000);
    try {
      const currUrl = targetFrame.url();
      if (!currUrl.includes('postupdate')) {
        console.log(`   ✅ 저장 완료! (${i+1}초 소요)`);
        console.log(`   URL: ${currUrl.substring(0, 100)}`);
        break;
      }
      if (i % 5 === 4) console.log(`   ...${i+1}초`);
    } catch(e) {
      console.log(`   ${i+1}초: ${e.message}`);
    }
  }

  // Step 4: Verify public post
  console.log('\n=== 포스트 확인 ===');
  const vp = await ctx.newPage();
  await vp.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'networkidle', timeout: 20000 });
  await vp.waitForTimeout(4000);

  const mfEl = await vp.$('iframe[name="mainFrame"]');
  if (mfEl) {
    const mfc = await mfEl.contentFrame();
    if (mfc) {
      const postInfo = await mfc.evaluate(() => {
        const content = document.querySelector('.se-main-container') || document.body;
        if (!content) return { error: 'no content' };
        const allImgs = content.querySelectorAll('img');
        const contentImgs = Array.from(allImgs).filter(img => {
          const src = img.src || '';
          const cls = img.className || '';
          return (src.includes('files') && !src.includes('icon')) || cls.includes('se-image') || cls.includes('image-resource');
        });
        const textLen = (content.textContent || '').length;
        return { totalImgTags: allImgs.length, contentImages: contentImgs.length, textLength: textLen };
      });
      console.log(JSON.stringify(postInfo, null, 2));
    }
  }

  await vp.close();
  await b.close();
})().catch(e => console.log('E:', e.message));
