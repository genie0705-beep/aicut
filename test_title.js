const { chromium } = require('playwright');
const fs = require('fs');

const TITLE = '피부과 영상 마케팅, 숏폼 편집 하나로 해결되는 이유 | 여름 시즌 준비';
const IMG_DIR = 'C:\\Users\\paul\\.openclaw\\workspace\\';

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const write = pages.find(p => p.url().includes('Redirect=Write'));
  if (!write) { console.log('❌ No write tab'); process.exit(1); }

  const frameEl = await write.$('#mainFrame');
  if (!frameEl) { console.log('❌ No iframe'); process.exit(1); }
  const frame = await frameEl.contentFrame();
  if (!frame) { console.log('❌ Cannot access iframe'); process.exit(1); }

  console.log('✅ iframe 접근 성공\n');

  // 현재 상태 진단
  const diag = await frame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const curTitle = ed.getDocumentTitle();
    const data = ed.getDocumentData();
    const blockCount = data.document.blocks.length;
    const titleEls = document.querySelectorAll('[contenteditable]');
    const titleArea = document.querySelector('#titleArea');
    const seTitle = document.querySelector('.se-title');
    const textEditors = document.querySelectorAll('div[contenteditable].se-text-editor');
    return {
      title: curTitle,
      blocks: blockCount,
      titleEls: titleEls.length,
      titleArea: !!titleArea,
      seTitle: !!seTitle,
      textEditors: textEditors.length,
      firstBlockType: data.document.blocks[0]?.type || 'none',
      hasCanvas: !!document.querySelector('.se-canvas'),
    };
  });
  console.log('현재 상태:', JSON.stringify(diag, null, 2));

  // 제목 설정
  await frame.evaluate((t) => {
    SmartEditor._editors['blogpc001'].setDocumentTitle(t);
  }, TITLE);
  console.log('✅ 제목 설정 완료');

  await frame.waitForTimeout(500);

  // 제목 확인
  const newTitle = await frame.evaluate(() => SmartEditor._editors['blogpc001'].getDocumentTitle());
  console.log('설정된 제목:', newTitle);

  // 제목 영역 확인
  const titleUI = await frame.evaluate(() => {
    const eds = document.querySelectorAll('[contenteditable]');
    return Array.from(eds).slice(0,5).map(e => ({
      tag: e.tagName,
      id: e.id,
      cls: (e.className || '').substring(0,60),
      text: (e.innerText || '').substring(0,40),
      display: getComputedStyle(e).display,
      visibility: getComputedStyle(e).visibility,
    }));
  });
  console.log('제목 UI:', JSON.stringify(titleUI, null, 2));

  process.exit(0);
}

main().catch(e => { console.error('❌ 오류:', e.message); process.exit(1); });
