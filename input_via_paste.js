const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');
const path = require('path');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let targetPage = null;
  for (const p of ctx.pages()) {
    if (p.frames().some(f => f.url().includes('PostWriteForm'))) {
      targetPage = p;
      break;
    }
  }
  if (!targetPage) { console.log('탭 없음'); b.close(); return; }

  await targetPage.bringToFront();
  await sleep(2000);
  const frame = targetPage.frames().find(f => f.url().includes('PostWriteForm'));

  const posts = [
    { file: 'aicut_blog_baseball.html', label: '⚾ 프로야구' },
    { file: 'aicut_blog_rainy.html', label: '🌧 장맛비' },
  ];

  for (const post of posts) {
    console.log(`\n━━━ ${post.label} ━━━`);
    const htmlContent = fs.readFileSync(path.join(__dirname, post.file), 'utf-8');

    // 1. 에디터 본문 영역 찾기 (contenteditable div)
    const editorBody = await frame.evaluate(() => {
      const editables = document.querySelectorAll('[contenteditable="true"]');
      for (const el of editables) {
        if (el.offsetParent !== null && el.textContent.trim() === '') {
          el.focus();
          return el.id || 'tag:' + el.tagName;
        }
      }
      // 두 번째 contenteditable (첫 번째는 제목, 두 번째는 본문)
      const visibleEditables = [];
      for (const el of editables) {
        if (el.offsetParent !== null) visibleEditables.push(el);
      }
      if (visibleEditables.length >= 2) {
        visibleEditables[1].focus();
        return '본문(' + (visibleEditables[1].id || 'tag:' + visibleEditables[1].tagName) + ')';
      }
      return null;
    });
    console.log(`  에디터 본문: ${editorBody}`);

    if (editorBody) {
      await sleep(500);

      // 2. HTML 내용을 clipboard DataTransfer로 paste
      const pasteResult = await frame.evaluate((html) => {
        try {
          // DataTransfer 객체 생성
          const dt = new DataTransfer();
          dt.setData('text/html', html);
          dt.setData('text/plain', '');

          // activeElement에 paste 이벤트 발생
          const target = document.activeElement;
          if (!target) return '❌ activeElement 없음';

          const event = new ClipboardEvent('paste', {
            clipboardData: dt,
            bubbles: true,
            cancelable: true
          });
          target.dispatchEvent(event);
          return '✅ paste 이벤트 발생';
        } catch(e) {
          return '❌ ' + e.message;
        }
      }, htmlContent);
      console.log(`  ${pasteResult}`);
    }

    await sleep(3000);
  }

  console.log('\n✅ 작업 완료. 저장 버튼을 눌러주세요.');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));
