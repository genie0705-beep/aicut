const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const IMG_DIR = path.join(__dirname, 'blog_images');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const pages = context.pages();
  console.log('Pages count:', pages.length);
  for (const p of pages) {
    console.log('  -', p.url().substring(0, 80));
  }

  // 에디터 탭 찾기 (이미 열려 있는지 확인)
  let editorPage = pages.find(p => p.url().includes('PostWriteForm') || p.url().includes('Redirect=Write'));
  
  if (!editorPage) {
    console.log('[INFO] No editor tab found, opening new one...');
    editorPage = await context.newPage();
    await editorPage.goto('https://blog.naver.com/aicut?Redirect=Write', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(5000);
  } else {
    console.log('[INFO] Found existing editor tab:', editorPage.url().substring(0, 80));
  }

  // 에디터 iframe 구조 분석
  const frames = editorPage.frames();
  console.log('\nFrames:');
  frames.forEach((f, i) => console.log(`  [${i}] ${f.url().substring(0, 80)}`));

  // PostWriteForm frame
  const writeFrame = frames.find(f => f.url().includes('PostWriteForm'));
  if (!writeFrame) {
    console.log('[ERROR] PostWriteForm frame not found');
    // 현재 상태 스냅샷
    await editorPage.screenshot({ path: path.join(IMG_DIR, 'debug_editor.png') });
    await browser.close();
    process.exit(1);
  }

  // 에디터 내부 DOM 구조 확인
  console.log('\n[DEBUG] Checking editor DOM...');
  const domInfo = await writeFrame.evaluate(() => {
    const results = {};
    // 제목 입력란
    const titleEls = document.querySelectorAll('[placeholder], input[type="text"], .se-documentTitle-input, .se-title-input, [class*="title"]');
    results.titleElements = Array.from(titleEls).slice(0, 5).map(el => ({
      tag: el.tagName,
      class: el.className.substring(0, 50),
      placeholder: el.placeholder || '',
      contenteditable: el.contentEditable,
    }));
    
    // contenteditable 요소들
    const editables = document.querySelectorAll('[contenteditable="true"]');
    results.editables = Array.from(editables).slice(0, 8).map(el => ({
      tag: el.tagName,
      class: el.className.substring(0, 50),
      id: el.id,
    }));

    // 툴바 버튼들
    const buttons = document.querySelectorAll('button, [role="button"]');
    results.buttons = Array.from(buttons).slice(0, 10).map(el => ({
      tag: el.tagName,
      class: el.className.substring(0, 40),
      text: el.textContent.trim().substring(0, 20),
      title: el.title || el.getAttribute('aria-label') || '',
    }));

    return results;
  });

  console.log('\nTitle elements:', JSON.stringify(domInfo.titleElements, null, 2));
  console.log('\nEditables:', JSON.stringify(domInfo.editables, null, 2));
  console.log('\nButtons (first 10):', JSON.stringify(domInfo.buttons, null, 2));

  await browser.close();
})();
