const { chromium } = require('playwright');
async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[1] || pages[0]; // keyboard.type 탭 우선
  await page.bringToFront();

  // iframe 내용 삭제
  console.log('내용 삭제...');
  await page.evaluate(() => {
    const iframe = document.querySelector('iframe[id^="input_buffer"]');
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    const body = doc.querySelector('[contenteditable="true"]');
    if (!body) return;
    body.focus();
    body.innerHTML = '';
  });
  await delay(500);

  // Ctrl+V (클립보드에 수정된 본문 있음)
  console.log('본문 붙여넣기...');
  await page.keyboard.press('Control+V');
  await delay(3000);
  console.log('완료');

  // 이메일 확인
  const emailCheck = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor) return 'editor 없음';
    const data = editor.getDocumentData();
    let found = false;
    for (const c of data.document.components) {
      if (c['@ctype'] !== 'text') continue;
      for (const p of (c.value || [])) {
        for (const n of (p.nodes || [])) {
          if (n.value && n.value.includes('master@aicut')) found = true;
        }
      }
    }
    return found ? '✅ master@aicut.co.kr 확인' : '❌ 없음';
  });
  console.log('이메일:', emailCheck);

  // 저장
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) if (btn.textContent.trim() === '저장') { btn.click(); return; }
  });
  await delay(3000);
  console.log('저장 완료 ✅');

  process.exit(0);
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
run().catch(e => { console.error('❌', e.message); process.exit(1); });
