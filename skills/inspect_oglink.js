const { chromium } = require('playwright');
const path = require('path');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));

  // OG링크 버튼 클릭
  await wp.locator('.se-oglink-toolbar-button').first().click();
  await wp.waitForTimeout(2000);

  // 다이얼로그 내부 구조 확인
  const r = await wp.evaluate(() => {
    // 모든 버튼, input, textarea 콘텐츠
    const allInteractive = [];
    document.querySelectorAll('input, textarea, button, [contenteditable]').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 10 && rect.height > 10) {
        allInteractive.push({
          tag: el.tagName,
          type: el.type || el.getAttribute('role') || '',
          placeholder: el.placeholder || '',
          text: (el.textContent || '').trim().substring(0, 30),
          cls: el.className.substring(0, 60),
          visible: true
        });
      }
    });

    // 모든 visible 요소의 텍스트 수집
    const visibleTexts = [];
    document.querySelectorAll('div, span, label, p').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 50 && rect.height > 20) {
        const t = (el.textContent || '').trim();
        if (t.length > 0 && t.length < 60) visibleTexts.push(t);
      }
    });

    return {
      interactive: allInteractive.slice(0, 15),
      visibleLabels: [...new Set(visibleTexts)].slice(0, 20)
    };
  });

  console.log('인터랙티브 요소:');
  r.interactive.forEach(el => console.log(`  <${el.tag}> type=${el.type} placeholder="${el.placeholder}" text="${el.text}"`));
  
  console.log('\n보이는 텍스트:');
  r.visibleLabels.forEach(t => console.log('  "' + t + '"'));

  await wp.screenshot({ path: path.join(__dirname, '..', '_oglink_dialog.png') });
  console.log('\n📸 스크린샷 저장');

  await b.close();
}
main().catch(e => console.error('에러:', e.message));
