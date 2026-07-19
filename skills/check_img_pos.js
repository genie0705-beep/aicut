const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));
  const r = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const ft = se.getContentText();
    // contentText에서 이미지는 제외되므로, 섹션 사이에 실제로 이미지가 있는지
    // DOM 구조로 확인
    const imgs = document.querySelectorAll('img');
    const imgParents = Array.from(imgs).map(img => {
      const parent = img.closest('.se-component') || img.parentElement;
      const nextSibling = parent.nextElementSibling;
      const prevSibling = parent.previousElementSibling;
      const nextText = nextSibling ? (nextSibling.textContent || '').trim().substring(0, 30) : '(없음)';
      const prevText = prevSibling ? (prevSibling.textContent || '').trim().substring(0, 30) : '(없음)';
      return {
        size: img.naturalWidth + 'x' + img.naturalHeight,
        prevText: prevText,
        nextText: nextText
      };
    });
    return { imgCount: imgs.length, imgPositions: imgParents };
  });
  console.log('이미지:', r.imgCount + '장');
  console.log('\n이미지 전후 텍스트:');
  r.imgPositions.forEach((img, i) => {
    console.log(`  [${i}] ${img.size}`);
    console.log(`      ← 이전: "${img.prevText}"`);
    console.log(`      → 다음: "${img.nextText}"`);
  });
  await b.close();
}
main().catch(e => console.log('err:', e.message));
