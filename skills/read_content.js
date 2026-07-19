const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('글쓰기 페이지 없음'); await b.close(); return; }

  const content = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const fullText = se.getContentText();
    // 각 문단 출력
    const paras = document.querySelectorAll('.se-text-paragraph, h2, h3');
    const paraTexts = Array.from(paras).map((p, i) => 
      `[${i}] ${p.tagName}: ${(p.textContent || '').trim()}`
    );
    return { length: fullText.length, text: fullText, paras: paraTexts };
  });

  console.log(`전체 글자 수: ${content.length}`);
  console.log('\n=== 전체 내용 ===');
  console.log(content.text);
  
  console.log('\n=== 문단별 ===');
  content.paras.forEach(p => console.log(p));

  await b.close();
}
main().catch(e => console.error('❌', e.message));
