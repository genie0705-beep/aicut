const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let targetPage = null, targetFrame = null;
  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (f) { targetPage = p; targetFrame = f; break; }
  }
  if (!targetPage) { console.log('탭 없음'); b.close(); return; }

  await targetPage.bringToFront();
  await sleep(2000);

  console.log('=== [사진] 버튼 클릭 후 화면 분석 ===\n');

  // "사진" 버튼 클릭
  await targetFrame.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent.trim() === '사진') { b.click(); return; }
    }
  });
  await sleep(3000);

  // iframe 내 변화 확인
  const state = await targetFrame.evaluate(() => {
    // 새로 생긴 요소 확인
    const all = document.querySelectorAll('*');
    const newElements = [];
    for (const el of all) {
      if (el.offsetParent !== null) {
        const t = el.textContent.trim();
        if (t && t.length < 40 && (t.includes('파일') || t.includes('MYBOX') || t.includes('추가') || t.includes('업로드') || t.includes('선택'))) {
          newElements.push({ tag: el.tagName, text: t, cls: el.className.substring(0, 30) });
        }
      }
    }
    return {
      newElements: newElements.slice(0, 20),
      bodyPreview: document.body.innerText.substring(0, 500)
    };
  });

  console.log('버튼 클릭 후 새 요소들:');
  state.newElements.forEach(e => console.log(`  <${e.tag}> ${e.text} (${e.cls})`));

  console.log('\nBody preview:');
  console.log(state.bodyPreview);

  // file input 찾기
  const fileInput = await targetFrame.$('input[type="file"]');
  if (fileInput) {
    console.log('\n✅ file input 발견!');
    const visible = await fileInput.isVisible();
    console.log(`  visible: ${visible}`);
  } else {
    console.log('\n❌ file input 없음');
    
    // file chooser 리스너 설정 후 다시 클릭
    console.log('\n--- file chooser 리스너 설정 후 재시도 ---');
    const [fileChooser] = await Promise.all([
      targetPage.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
      targetFrame.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const b of btns) {
          if (b.textContent.trim() === '사진') { b.click(); return; }
        }
      })
    ]);
    console.log(`fileChooser: ${fileChooser ? '✅' : '❌'}`);
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
