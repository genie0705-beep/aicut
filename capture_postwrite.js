const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();

  // 모든 탭 스크린샷
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    // 에디터 탭 위주로 캡처
    if (p.url().includes('postwrite')) {
      console.log(`[${i}] postwrite 탭 캡처중...`);
      // 뷰포트 내에서 에디터 영역 스크린샷
      await p.screenshot({ path: `tab_${i}_postwrite.png`, fullPage: false });
      
      // 에디터 DOM 상태 분석 (실제 렌더링된 내용)
      const renderInfo = await p.evaluate(() => {
        const info = {};
        
        // 비주얼하게 보이는 텍스트
        const bodyText = document.body.innerText;
        info.bodyTextLength = bodyText.length;
        info.bodyTextPreview = bodyText.substring(0, 100);
        
        // contenteditable 정보
        const ce = document.querySelector('[contenteditable]');
        if (ce) {
          info.ceLength = (ce.innerText || '').length;
          info.ceText = (ce.innerText || '').substring(0, 50);
          info.ceHTML = (ce.innerHTML || '').substring(0, 100);
          info.ceDisplay = window.getComputedStyle(ce).display;
          info.ceVisibility = window.getComputedStyle(ce).visibility;
          info.ceOpacity = window.getComputedStyle(ce).opacity;
          info.ceZIndex = window.getComputedStyle(ce).zIndex;
          info.ceRect = (() => {
            const r = ce.getBoundingClientRect();
            return { w: r.width, h: r.height, x: r.x, y: r.y };
          })();
          
          // 부모 체인 확인
          const parents = [];
          let el = ce.parentElement;
          for (let d = 0; d < 10; d++) {
            if (!el) break;
            const cs = window.getComputedStyle(el);
            parents.push({
              tag: el.tagName,
              cls: (typeof el.className === 'string' ? el.className.substring(0, 30) : ''),
              display: cs.display,
              overflow: cs.overflow,
              visibility: cs.visibility,
              opacity: cs.opacity,
              w: Math.round(el.getBoundingClientRect().width),
              h: Math.round(el.getBoundingClientRect().height)
            });
            el = el.parentElement;
          }
          info.parentChain = parents;
        }
        
        // SE_editor 영역
        const se = document.querySelector('.se-body, .blog_editor, #SE_editor, [class*="editor"]');
        if (se) {
          const r = se.getBoundingClientRect();
          info.seRect = { w: r.width, h: r.height, x: r.x, y: r.y };
          info.seInnerText = (se.innerText || '').substring(0, 100);
        }
        
        return info;
      });
      
      console.log('=== 포스트라이트 에디터 렌더링 상태 ===');
      console.log(JSON.stringify(renderInfo, null, 2));
    }
  }

  console.log('\n✅ 스크린샷 저장 완료');
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
