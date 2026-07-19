const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));

  // 모든 contenteditable 요소 찾기 (OG 링크 입력창)
  const editables = await wp.evaluate(() => {
    return Array.from(document.querySelectorAll('[contenteditable]')).map((el, i) => ({
      i, text: (el.textContent || '').substring(0, 40),
      cls: el.className.substring(0, 60),
      rect: ((r) => `${Math.round(r.width)}x${Math.round(r.height)}`)(el.getBoundingClientRect()),
      parent: el.parentElement ? el.parentElement.className.substring(0, 40) : ''
    }));
  });
  console.log('contenteditable 요소:');
  editables.forEach(e => console.log(`  [${e.i}] "${e.text}" ${e.rect} ${e.cls} (${e.parent})`));

  await b.close();
}
main().catch(e => console.error('에러:', e.message));
