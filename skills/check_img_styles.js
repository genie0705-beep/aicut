const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('글쓰기 페이지 없음'); await b.close(); return; }

  // 이미지 현재 스타일 확인
  const imgInfo = await wp.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    return Array.from(imgs).map((img, i) => ({
      i,
      w: img.naturalWidth,
      h: img.naturalHeight,
      styleWidth: img.style.width,
      styleMaxWidth: img.style.maxWidth,
      parentStyle: img.parentElement ? img.parentElement.style.cssText : '',
      parentCls: img.parentElement ? img.parentElement.className.substring(0,80) : '',
      inlineWidth: img.getAttribute('width'),
      attrStyle: img.getAttribute('style'),
      containerStyle: img.closest('[class*="component"]')?.style?.cssText || '',
      containerCls: img.closest('[class*="component"]')?.className?.substring(0,100) || ''
    }));
  });

  console.log('=== 현재 이미지 상태 ===');
  imgInfo.forEach(img => {
    console.log(`\n[${img.i}] ${img.w}x${img.h}`);
    console.log(`  style.width: "${img.styleWidth}"`);
    console.log(`  style.maxWidth: "${img.styleMaxWidth}"`);
    console.log(`  inline width attr: "${img.inlineWidth}"`);
    console.log(`  attr style: "${img.attrStyle}"`);
    console.log(`  parent className: ${img.parentCls}`);
    console.log(`  parent style: ${img.parentStyle}`);
    console.log(`  container className: ${img.containerCls}`);
    console.log(`  container style: ${img.containerStyle}`);
  });

  await b.close();
}
main().catch(e => console.error('❌', e.message));
