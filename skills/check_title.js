const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));
  const r = await wp.evaluate(() => {
    // 제목 영역 찾기
    const titleArea = document.querySelector('[class*="title"] input, .se-document-title, .document-title');
    const inputs = document.querySelectorAll('input');
    const titleInputs = Array.from(inputs).filter(i => {
      const ph = i.placeholder || '';
      return ph.includes('제목') || i.className.includes('title');
    });
    
    return {
      titleArea: titleArea ? titleArea.textContent : '없음',
      titleInputs: titleInputs.map(i => ({ placeholder: i.placeholder, value: i.value, cls: i.className.substring(0,40) })),
      allPlaceholders: Array.from(inputs).map(i => i.placeholder).filter(p => p)
    };
  });
  console.log('제목 영역:', r.titleArea);
  console.log('제목 input:', JSON.stringify(r.titleInputs));
  console.log('전체 placeholder:', r.allPlaceholders);
  await b.close();
}
main().catch(e => console.log('err', e.message));
