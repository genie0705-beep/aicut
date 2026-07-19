const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('글쓰기 페이지 없음'); await b.close(); return; }

  // 저장 버튼 찾기
  const btnInfo = await wp.evaluate(() => {
    const buttons = document.querySelectorAll('button, a, span');
    const results = [];
    buttons.forEach(b => {
      const text = (b.textContent || '').trim();
      if (text === '저장' || text.includes('저장')) {
        const rect = b.getBoundingClientRect();
        results.push({
          tag: b.tagName,
          text: text,
          visible: rect.width > 0 && rect.height > 0,
          rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
          id: b.id,
          className: b.className,
          dataset: Object.keys(b.dataset).slice(0,5)
        });
      }
    });
    return results;
  });
  console.log('저장 버튼 후보:', JSON.stringify(btnInfo, null, 2));

  if (btnInfo.length > 0) {
    await wp.click('button:has-text("저장")');
    await wp.waitForTimeout(2000);
    console.log('저장 버튼 클릭 완료');
  } else {
    console.log('저장 버튼을 찾을 수 없습니다. 직접 저장해주세요.');
  }

  await b.close();
}
main().catch(e => { console.error('❌', e.message); process.exit(1); });
