const { chromium } = require('playwright');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // Check ALL pages/tabs open in Chrome
  const pages = ctx.pages();
  console.log(`열린 탭: ${pages.length}`);
  
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const url = p.url();
    if (url.includes('PostUpdateForm') || url.includes('PostEdit')) {
      console.log(`\n탭 [${i}]: ${url.substring(0, 100)}`);
      
      // Check all visible buttons/links with "저장" text
      for (const f of p.frames()) {
        try {
          const btns = await f.evaluate(() => {
            return Array.from(document.querySelectorAll('button, a, span'))
              .filter(el => el.offsetParent !== null)
              .map(el => ({ tag: el.tagName, text: (el.textContent || '').trim(), cls: el.className?.substring(0, 50) }))
              .filter(el => ['저장', '임시저장', '완료', '발행'].includes(el.text));
          });
          if (btns.length > 0) {
            console.log(`  Frame ${f.url().substring(0, 50)}:`, JSON.stringify(btns));
          }
        } catch(e) {}
      }
    }
  }

  // Save buttons might be in the iframe toolbar
  // Let's focus on the PostUpdateForm page
  const editPage = pages.find(p => p.url().includes('PostUpdate'));
  if (editPage) {
    const editFrame = editPage.frames().find(f => f.url().includes('PostUpdateForm'));
    if (editFrame) {
      // In SE4 editor, check if there's a "저장" in the NAVER blog header
      const saveResult = await editPage.evaluate(() => {
        // 버튼 아닌 요소들도 확인
        const results = [];
        document.querySelectorAll('*').forEach(el => {
          if (el.children.length === 0 && el.offsetParent !== null) {
            const t = (el.textContent || '').trim();
            if (['저장', '임시저장', '완료'].includes(t)) {
              results.push({
                tag: el.tagName,
                text: t,
                parentTag: el.parentElement?.tagName,
                parentCls: el.parentElement?.className?.substring(0, 40),
                grandparentCls: el.parentElement?.parentElement?.className?.substring(0, 40),
              });
            }
          }
        });
        return results;
      });
      
      console.log('\n메인 페이지 저장 텍스트:', JSON.stringify(saveResult));
      
      // Try clicking 저장 text if found
      if (saveResult.length > 0) {
        for (const s of saveResult) {
          try {
            const handle = await editPage.$(`text="${s.text}"`);
            if (handle) {
              await handle.click();
              console.log(`✅ "${s.text}" 클릭됨`);
              await sleep(3000);
              break;
            }
          } catch(e) {
            console.log(`  클릭 실패: ${e.message}`);
          }
        }
      }
      
      // If no 저장, try looking at the editor header
      const header = await editPage.evaluate(() => {
        const header = document.querySelector('header, .header, [class*="header"], [class*="top"]');
        if (!header) return 'no header';
        return header.innerText?.substring(0, 300);
      });
      console.log('\n헤더 텍스트:', header);
    }
  }
})();
