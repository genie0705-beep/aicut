const { chromium } = require('playwright');
const path = require('path');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  try {
    await page.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'load', timeout: 20000 });
    await sleep(4000);
    
    const pf = page.frames().find(f => f.url().includes('PostView'));
    if (pf) {
      await pf.evaluate(() => {
        document.querySelector('a._modifyPost')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      });
    }
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await sleep(5000);

    const editFrame = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!editFrame) { console.log('iframe not found'); return; }
    console.log('✅ 에디터 진입');

    // 사진 버튼의 정확한 선택자 확인
    // "사진" 텍스트를 가진 visible 요소들
    const allPhotoElems = await editFrame.evaluate(() => {
      const results = [];
      document.querySelectorAll('*').forEach(el => {
        if (el.children.length === 0 && el.textContent?.trim() === '사진' && el.offsetParent !== null) {
          const rect = el.getBoundingClientRect();
          results.push({
            tag: el.tagName,
            id: el.id,
            cls: el.className?.substring(0, 60),
            parentCls: el.parentElement?.className?.substring(0, 60),
            rect: `${Math.round(rect.x)},${Math.round(rect.y)} ${Math.round(rect.w)}×${Math.round(rect.h)}`,
          });
        }
      });
      return results;
    });
    console.log('사진 텍스트 요소들:', JSON.stringify(allPhotoElems, null, 2));

    // 사진 버튼 클릭
    const photoBtn = await editFrame.$('button:has-text("사진")');
    if (photoBtn) {
      await photoBtn.click();
      await sleep(2000);
    }

    // After clicking 사진, find all clickable buttons in the toolbar
    const toolbarBtns = await editFrame.evaluate(() => {
      const all = document.querySelectorAll('button, a, [role="button"], [onclick]');
      return Array.from(all)
        .filter(el => el.offsetParent !== null)
        .map(el => ({
          tag: el.tagName,
          text: (el.textContent || '').trim().substring(0, 30),
          cls: el.className?.substring(0, 60),
          id: el.id,
          title: el.getAttribute('title') || '',
          ariaLabel: el.getAttribute('aria-label') || '',
        }))
        .filter(el => el.text || el.title || el.ariaLabel);
    });
    
    console.log('\n툴바 버튼들:');
    toolbarBtns.forEach((b, i) => {
      console.log(`  [${i}] <${b.tag}> text="${b.text}" cls="${b.cls}" title="${b.title}"`);
    });
    
    // Find the hidden file input
    const fileInputInfo = await editFrame.evaluate(() => {
      const input = document.querySelector('#hidden-file');
      if (!input) return null;
      const rect = input.getBoundingClientRect();
      return {
        id: input.id,
        tag: input.tagName,
        rect: `${Math.round(rect.x)},${Math.round(rect.y)} ${Math.round(rect.w)}×${Math.round(rect.h)}`,
        visible: rect.width > 0 && rect.height > 0 && input.offsetParent !== null,
        accept: input.getAttribute('accept'),
        parent: input.parentElement?.className?.substring(0, 50),
      };
    });
    console.log('\n숨김 파일 입력:', JSON.stringify(fileInputInfo, null, 2));

  } finally {
    await page.close();
  }
})();
