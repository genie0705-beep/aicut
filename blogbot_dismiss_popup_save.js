const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  for (const p of ctx.pages()) {
    const frames = p.frames();
    for (const f of frames) {
      if (f.name() === 'mainFrame') {
        try {
          const url = f.url();
          console.log('mainFrame URL:', url.substring(0, 100));

          if (!url.includes('postupdate')) {
            console.log('✅ 이미 저장됨');
            break;
          }

          // Check for popup layer
          const popupInfo = await f.evaluate(() => {
            const popup = document.querySelector('.layer_popup__i0QOY, [class*="layer_popup"], [class*="popup"]');
            if (popup) {
              // Find buttons inside popup
              const buttons = popup.querySelectorAll('button');
              const btnTexts = Array.from(buttons).map(b => b.textContent.trim());
              const isVisible = popup.classList.contains('is_show__TMSLq') || popup.style.display !== 'none';
              return {
                visible: isVisible,
                className: popup.className,
                buttons: btnTexts,
                html: popup.innerHTML.substring(0, 200)
              };
            }
            const otherPopups = document.querySelectorAll('[class*="popup"], [class*="modal"], [class*="dialog"], [class*="layer"]');
            const popups = Array.from(otherPopups).filter(el => el.offsetParent !== null).map(el => ({
              cls: el.className.substring(0, 60),
              text: (el.textContent || '').trim().substring(0, 80)
            }));
            return { popups: popups.slice(0, 5) };
          });
          console.log('팝업 정보:', JSON.stringify(popupInfo, null, 2));

          // The popup is already the publish confirmation dialog
          // Click the "발행" button INSIDE the popup to confirm
          if (popupInfo.visible) {
            console.log('✅ 발행 설정 팝업 발견. 팝업 내 발행 버튼 클릭...');
            
            await f.evaluate(() => {
              const popup = document.querySelector('.layer_popup__i0QOY, [class*="layer_popup"]');
              if (popup) {
                const btns = popup.querySelectorAll('button');
                // Click the 발행 button inside the popup (confirmation)
                for (const btn of btns) {
                  const text = btn.textContent.trim();
                  if (text === '발행' && btn.offsetParent !== null) {
                    // Make sure this is inside the popup (not the toolbar)
                    btn.scrollIntoView({ block: 'center' });
                    btn.click();
                    console.log('✅ 팝업 내 발행 버튼 클릭됨');
                    return;
                  }
                }
              }
            });
            await p.waitForTimeout(2000);
          } else {
            // No popup, click toolbar 발행 directly
            console.log('\n발행 버튼 클릭...');
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
          }

          // Wait for save
          console.log('⏳ 저장 대기...');
          for (let i = 0; i < 20; i++) {
            await p.waitForTimeout(1000);
            try {
              const currUrl = f.url();
              console.log(`  ${i+1}초: ${currUrl.substring(0, 80)}`);
              if (!currUrl.includes('postupdate')) {
                console.log('✅ 저장 완료!');
                break;
              }
            } catch(e) {
              console.log(`  ${i+1}초: ${e.message}`);
            }
          }

        } catch(e) {
          console.log('오류:', e.message);
        }
      }
    }
  }

  // Verify public post
  console.log('\n=== 포스트 확인 ===');
  const vp = await ctx.newPage();
  await vp.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'networkidle', timeout: 20000 });
  await vp.waitForTimeout(4000);

  const mfEl = await vp.$('iframe[name="mainFrame"]');
  if (mfEl) {
    const mfc = await mfEl.contentFrame();
    if (mfc) {
      const postInfo = await mfc.evaluate(() => {
        const content = document.querySelector('.se-main-container') || document.querySelector('.post-view') || document.body;
        if (!content) return { error: 'no content' };
        // Count content images (not layout/UI images)
        const allImgs = content.querySelectorAll('img');
        const contentImgs = Array.from(allImgs).filter(img => {
          const src = img.src || '';
          const cls = img.className || '';
          return src.includes('files') || cls.includes('se-image') || cls.includes('image-resource') || img.width > 100;
        });
        return {
          totalImgTags: allImgs.length,
          contentImages: contentImgs.length,
          textLen: (content.textContent || '').length
        };
      });
      console.log(JSON.stringify(postInfo, null, 2));
    }
  }

  await vp.close();
  await b.close();
})().catch(e => console.log('E:', e.message));
