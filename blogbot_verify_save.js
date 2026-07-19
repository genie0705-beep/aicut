const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  // Find editor page
  for (const p of ctx.pages()) {
    const frames = p.frames();
    for (const f of frames) {
      if (f.name() === 'mainFrame') {
        try {
          const url = f.url();
          console.log('mainFrame URL:', url.substring(0, 100));

          if (url.includes('postupdate')) {
            console.log('⚠️ 아직 에디터 페이지. 저장 재시도...');

            // Set dialog handler to accept
            p.on('dialog', async d => {
              console.log(`  다이얼로그: ${d.type()} - ${d.message().substring(0, 80)}`);
              await d.accept();
            });

            // Click "발행" button via Playwright's native click
            const publishBtn = await f.$('button.publish_btn__m9KHH');
            if (publishBtn) {
              await publishBtn.click();
              console.log('  ✅ 발행 버튼 Playwright 클릭');
            } else {
              await f.evaluate(() => {
                const btns = document.querySelectorAll('button');
                for (const btn of btns) {
                  if (btn.textContent.trim() === '발행' && btn.offsetParent !== null) {
                    btn.scrollIntoView({ block: 'center' });
                    btn.click();
                    return;
                  }
                }
              });
              console.log('  ✅ 발행 버튼 evaluate 클릭');
            }

            // Wait for navigation
            for (let i = 0; i < 20; i++) {
              await p.waitForTimeout(1000);
              try {
                const currUrl = f.url();
                console.log(`  ${i+1}초: ${currUrl.substring(0, 100)}`);
                if (!currUrl.includes('postupdate')) {
                  console.log('  ✅ 저장 완료!');
                  break;
                }
              } catch(e) {
                console.log(`  ${i+1}초: 접근 오류`);
              }
            }

            // Try Ctrl+Enter as another save method
            console.log('\n  ⏩ Ctrl+Enter 시도...');
            await p.keyboard.press('Control+Enter');
            await p.waitForTimeout(5000);
            console.log(`  Ctrl+Enter 후: ${f.url().substring(0, 100)}`);
          } else {
            console.log('✅ 이미 저장됨');
          }
        } catch(e) {
          console.log('오류:', e.message);
        }
      }
    }
  }

  // Verify public post
  console.log('\n=== 공개 포스트 확인 ===');
  const vp = await ctx.newPage();
  await vp.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'networkidle', timeout: 20000 });
  await vp.waitForTimeout(3000);

  const mfEl = await vp.$('iframe[name="mainFrame"]');
  if (mfEl) {
    const mfc = await mfEl.contentFrame();
    if (mfc) {
      const postInfo = await mfc.evaluate(() => {
        const content = document.querySelector('.se-main-container') || document.querySelector('.post-content') || document.querySelector('#post-content') || document.body;
        if (!content) return { error: 'no content area' };
        const imgs = content.querySelectorAll('img');
        const imgDetails = Array.from(imgs).slice(0, 10).map(img => ({
          src: (img.src || '').substring(0, 80),
          alt: (img.alt || '').substring(0, 30),
          width: img.width,
          height: img.height,
        }));
        const textLen = (content.textContent || '').length;
        return { images: imgs.length, imgDetails, textLength: textLen };
      });
      console.log(JSON.stringify(postInfo, null, 2));
    }
  }

  await vp.close();
  await b.close();
})().catch(e => console.log('E:', e.message));
