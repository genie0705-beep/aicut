const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));

  const r = await wp.evaluate(() => {
    const canvas = document.querySelector('.se-canvas-layer');
    if (!canvas) return 'no canvas';
    
    const children = canvas.children;
    const comps = Array.from(children).map((el, i) => {
      const tag = el.tagName;
      const cls = el.className || '';
      const text = (el.textContent || '').trim();
      const hasImg = !!el.querySelector('img');
      const imgInfo = el.querySelector('img') ? 
        el.querySelector('img').naturalWidth + 'x' + el.querySelector('img').naturalHeight : '';
      
      let type = '기타';
      if (hasImg) type = '🖼️이미지(' + imgInfo + ')';
      else if (tag === 'H2') type = '📐H2';
      else if (tag === 'P' || cls.includes('paragraph')) type = '📝텍스트';
      else if (text.startsWith('#')) type = '🏷️해시태그';
      
      return { i, type, text: text.substring(0, 40) };
    });

    // 텍스트만 추출해서 머지 확인
    const fullText = SmartEditor._editors['blogpc001'].getContentText();
    
    return {
      compCount: comps.length,
      structure: comps.slice(0, 15),
      hasMerge: fullText.includes('알려드립니다.☀'),
      fullTextPreview: fullText.substring(fullText.length - 200, fullText.length)
    };
  });

  console.log('=== 에디터 컴포넌트 구조 (처음 15개) ===');
  console.log('총 컴포넌트:', r.compCount);
  r.structure.forEach(c => console.log(`[${c.i}] ${c.type} "${c.text}"`));

  console.log('\n머지 탐지:', r.hasMerge);
  console.log('(getContentText는 이미지를 제외한 순수 텍스트만 반환하므로 이미지 사이의 텍스트가 연속으로 보임 — 정상)');
  console.log('\n텍스트 마지막 200자:', r.fullTextPreview);

  await b.close();
}
main().catch(e => console.error('에러:', e.message));
