// 문서 상태 확인 + 올바른 저장
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const LOG_NO = '224341544476';
const BLOG_ID = 'aicut';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  // Find the blog page with postupdate in mainFrame
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url() === 'https://blog.naver.com/aicut') {
      page = p;
      break;
    }
  }

  if (!page) {
    console.log('❌ Blog page not found');
    await b.close();
    return;
  }

  console.log('✅ Blog page found');

  // Get mainFrame
  const mfEl = await page.$('iframe[name="mainFrame"]');
  if (!mfEl) { console.log('❌ mainFrame not found'); await b.close(); return; }
  const mf = await mfEl.contentFrame();
  if (!mf) { console.log('❌ cannot access mainFrame'); await b.close(); return; }

  console.log('mainFrame URL:', mf.url().substring(0, 80));

  // Check document various ways
  console.log('\n[1] 문서 상태 확인 (다양한 방법)...');

  // Method A: Check via getDocumentData
  const docData = await mf.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const data = ed.getDocumentData();
      const str = typeof data === 'string' ? data : JSON.stringify(data);
      const imgCount = (str.match(/@ctype["']?\s*:\s*["']image/i) || []).length;
      const imgTags = (str.match(/<img[^>]+src=/g) || []).length;
      return { method: 'getDocumentData', dataLen: str.length, imgCount, imgTags };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log(`   ${JSON.stringify(docData)}`);

  // Method B: Check editingService.getComponentInfoList
  const compInfo = await mf.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const list = ed._editingService.getComponentInfoList();
      if (Array.isArray(list)) {
        const types = list.map(c => c.ctype || c.type || '?');
        return { count: list.length, types: types.slice(0, 20) };
      }
      return { error: 'not array', type: typeof list, preview: JSON.stringify(list).substring(0, 200) };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log(`   getComponentInfoList: ${JSON.stringify(compInfo)}`);

  // Method C: Use the raw document object
  const rawInfo = await mf.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const doc = ed._document;
      const docData = doc.getDocumentData ? doc.getDocumentData() : null;
      if (docData) {
        // Check if it has components at top level
        if (docData.components) {
          return { hasComponents: true, compCount: docData.components.length, type: 'components[]' };
        }
        if (docData.body && docData.body.components) {
          return { hasComponents: true, compCount: docData.body.components.length, type: 'body.components[]' };
        }
        return { hasComponents: false, keys: Object.keys(docData).slice(0, 10) };
      }
      return { error: 'no getDocumentData' };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log(`   raw info: ${JSON.stringify(rawInfo)}`);

  // Method D: Check getDocumentData return value structure
  const dataStructure = await mf.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const data = ed.getDocumentData();
      if (typeof data === 'object' && !Array.isArray(data)) {
        const keys = Object.keys(data);
        const structure = {};
        keys.forEach(k => {
          const val = data[k];
          if (Array.isArray(val)) structure[k] = `Array(${val.length})`;
          else if (typeof val === 'object' && val !== null) structure[k] = `Object(${Object.keys(val).length})`;
          else structure[k] = typeof val;
        });
        return structure;
      }
      return { type: typeof data, isArray: Array.isArray(data) };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log(`   data structure: ${JSON.stringify(dataStructure)}`);

  // Step 2: Check if "발행" click showed a dialog
  console.log('\n[2] 발행 버튼 재시도 + 대화상자 처리...');
  
  // Set up dialog handler for accept (confirm save)
  page.on('dialog', async dialog => {
    console.log(`   📋 다이얼로그: ${dialog.type()} - ${dialog.message().substring(0, 100)}`);
    await dialog.accept();
    console.log('   ✅ 다이얼로그 수락됨');
  });

  // Try clicking 발행 with Playwright native click at coordinates
  const publishBtn = await mf.$('button.publish_btn__m9KHH, button:has-text("발행")');
  if (publishBtn) {
    console.log('   ✅ 발행 버튼 Playwright 클릭');
    try {
      await publishBtn.click({ timeout: 5000 });
    } catch(e) {
      console.log(`   ⚠️ Playwright click error: ${e.message}`);
      // Fallback: evaluate click
      await mf.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          if (btn.textContent.trim() === '발행' && btn.offsetParent !== null) {
            btn.click();
            return true;
          }
        }
        return false;
      });
    }

    // Wait for navigation or dialog
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(1000);
      const currentUrl = mf.url();
      if (!currentUrl.includes('postupdate')) {
        console.log(`   ✅ 저장됨! URL: ${currentUrl.substring(0, 80)}`);
        break;
      }
      if (i === 9) {
        console.log(`   ⚠️ 10초 후에도 postupdate 페이지`);
      }
    }
  } else {
    console.log('   ❌ 발행 버튼 못 찾음');
  }

  // Try also Ctrl+Enter (common save shortcut in Naver blog)
  console.log('\n[3] Ctrl+Enter 저장 시도...');
  await page.keyboard.press('Control+Enter');
  await page.waitForTimeout(5000);
  const urlAfterCtrlEnter = mf.url();
  console.log(`   Ctrl+Enter 후 mainFrame: ${urlAfterCtrlEnter.substring(0, 80)}`);

  await b.close();
})().catch(e => console.log('E:', e.message));
