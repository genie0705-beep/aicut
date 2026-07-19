const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const write = pages.find(p => p.url().includes('Redirect=Write'));
  const fe = await write.$('#mainFrame');
  const f = await fe.contentFrame();

  // 저장 버튼 클릭
  const saved = await f.evaluate(async () => {
    try {
      const saveBtn = document.querySelector('.save_btn__bzc5B');
      if (saveBtn) {
        saveBtn.click();
        return '저장 버튼 클릭됨';
      }
      // 대체: span 저장
      const anySave = document.querySelector('button:has-text("저장"), span:has-text("저장")');
      if (anySave) { anySave.click(); return '대체 저장 버튼 클릭'; }
      return '저장 버튼 못 찾음';
    } catch(e) { return '오류: ' + e.message; }
  });
  console.log('💾', saved);
  await f.waitForTimeout(2000);
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
