const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const wp = pages.find(p => p.url().includes('Redirect=Write'));
  if (!wp) { console.log('NO PAGE'); await b.close(); return; }
  await wp.bringToFront(); await sleep(2000);
  
  const frames = wp.frames();
  let se = null;
  for (const f of frames) {
    if (await f.evaluate(() => typeof SmartEditor !== 'undefined' && !!SmartEditor._editors).catch(() => false)) { se = f; break; }
  }
  if (!se) { console.log('NO SE'); await b.close(); return; }
  
  // 현재 상태 진단
  const diag = await se.evaluate(() => {
    const canvas = document.querySelector('.se-canvas');
    const html = canvas ? canvas.outerHTML : 'no canvas';
    const titleArea = document.querySelector('[class*=title], [class*=Title], #titleArea, [contenteditable][_placeholder]');
    const titleHtml = titleArea ? titleArea.outerHTML.substring(0, 300) : 'no title area';
    
    // 제목 입력 영역 찾기
    const allEditables = document.querySelectorAll('[contenteditable]');
    const editInfo = Array.from(allEditables).map(el => ({
      tag: el.tagName,
      id: el.id,
      cls: el.className.substring(0, 40),
      text: (el.innerText || '').substring(0, 30),
      height: el.offsetHeight
    }));
    
    return {
      hasTitleField: !!document.querySelector('[class*=title], [class*=Title], #titleArea'),
      canvasHeight: canvas ? canvas.offsetHeight : 0,
      canvasHTML: html.substring(0, 800),
      titleAreaHTML: titleHtml.substring(0, 300),
      editables: editInfo
    };
  });
  
  console.log('=== 에디터 상태 진단 ===\n');
  console.log('제목 입력 필드:', diag.hasTitleField ? '✅ 있음' : '❌ 없음');
  console.log('Canvas 높이:', diag.canvasHeight + 'px');
  console.log('\n편집 가능 영역:');
  diag.editables.forEach((e, i) => console.log('  [' + i + '] ' + e.tag + ' cls=' + e.cls + ' text="' + e.text + '" h=' + e.height));
  console.log('\n제목 영역 HTML:');
  console.log(diag.titleAreaHTML.substring(0, 300));
  
  await b.close();
})();
