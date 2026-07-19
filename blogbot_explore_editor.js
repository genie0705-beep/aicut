const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  // Find the editor page that's already open
  let editorPage = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('postupdate')) {
      editorPage = p;
      break;
    }
  }

  if (!editorPage) {
    // Open new one
    console.log('No editor page found, opening new one...');
    editorPage = await ctx.newPage();
    await editorPage.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'networkidle', timeout: 15000 });
    await editorPage.waitForTimeout(4000);

    const mfEl = await editorPage.$('iframe[name="mainFrame"]');
    if (mfEl) {
      const mf = await mfEl.contentFrame();
      if (mf) {
        await mf.evaluate(() => {
          const el = document.querySelector('a[href*="suggestConvert"]');
          if (el) el.click();
        });
        await editorPage.waitForTimeout(5000);
      }
    }

    // Find the update page
    for (const p of ctx.pages()) {
      if (p.url().includes('postupdate') || p.url().includes('PostWrite')) {
        editorPage = p;
        break;
      }
    }
  }

  console.log('Editor page URL:', editorPage.url());

  // Explore all frames
  console.log('\n=== 모든 프레임 ===');
  for (const f of editorPage.frames()) {
    try {
      const url = f.url();
      const name = f.name();
      if (url !== 'about:blank') {
        const hasSE = await f.evaluate(() => typeof SmartEditor !== 'undefined').catch(() => false);
        const hasjQ = await f.evaluate(() => typeof jQuery !== 'undefined').catch(() => false);
        const buttons = await f.evaluate(() => {
          return Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => t);
        }).catch(() => []);
        console.log(`  [${name}] ${url.substring(0, 100)}`);
        console.log(`    SE:${hasSE} jQ:${hasjQ} buttons:${JSON.stringify(buttons.slice(0, 10))}`);
      }
    } catch(e) {
      console.log(`  (error accessing frame)`);
    }
  }

  // Search for save button specifically
  console.log('\n=== 저장 버튼 검색 ===');
  for (const f of editorPage.frames()) {
    try {
      const url = f.url();
      if (url === 'about:blank') continue;
      const saveBtns = await f.evaluate(() => {
        const results = [];
        const allEls = document.querySelectorAll('button, a, [role="button"], input[type="submit"]');
        for (const el of allEls) {
          const text = el.textContent.trim();
          if (text.includes('저장') || text === '완료' || text === '확인') {
            const rect = el.getBoundingClientRect();
            results.push({
              tag: el.tagName,
              text: text,
              visible: el.offsetParent !== null,
              rect: { w: Math.round(rect.width), h: Math.round(rect.height), x: Math.round(rect.x), y: Math.round(rect.y) },
              title: el.getAttribute('title') || '',
              cls: (el.className || '').substring(0, 50)
            });
          }
        }
        return results;
      }).catch(() => []);
      if (saveBtns.length > 0) {
        console.log(`  Frame: ${url.substring(0, 80)}`);
        console.log(`    저장 버튼들: ${JSON.stringify(saveBtns, null, 4)}`);
      }
    } catch(e) {}
  }

  // Also check the main page for SmartEditor buttons (save, publish, etc.)
  console.log('\n=== SmartEditor 의 editors 정보 ===');
  for (const f of editorPage.frames()) {
    try {
      const seInfo = await f.evaluate(() => {
        if (typeof SmartEditor === 'undefined') return null;
        const ed = SmartEditor._editors || {};
        const editorNames = Object.keys(ed);
        const info = {};
        for (const name of editorNames) {
          const editor = ed[name];
          info[name] = {
            hasDocumentService: !!editor._documentService,
            hasComponentService: !!editor._componentService,
            hasImageUploadService: !!editor._imageUploadService,
            hasToolbar: !!editor._toolbar,
            hasTool: !!editor._tool,
            hasMenuService: !!editor._menuService,
            services: Object.keys(editor).filter(k => k.startsWith('_') && editor[k] && typeof editor[k] === 'object').slice(0, 20)
          };
        }
        return info;
      }).catch(() => null);
      if (seInfo) {
        console.log(`  Frame: ${f.url().substring(0, 80)}`);
        console.log(`  ${JSON.stringify(seInfo, null, 2)}`);
      }
    } catch(e) {}
  }

})().catch(e => console.log('E:', e.message));
