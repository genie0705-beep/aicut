const { chromium } = require('playwright');
const path = require('path');
const WS = path.join(__dirname, '..');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('글쓰기 페이지 없음'); await b.close(); return; }

  const html = await wp.evaluate(() => {
    // SE4 에디터 영역 찾기
    const editors = document.querySelectorAll('[class*="se-editor"], [class*="editor"], .se-canvas, .document, .write_editor');
    const editorInfo = [];
    editors.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      editorInfo.push({
        i, tag: el.tagName, cls: el.className.substring(0,100),
        w: Math.round(r.w), h: Math.round(r.h),
        children: el.children.length,
        text: el.textContent?.substring(0, 80) || ''
      });
    });

    // 모든 이미지 찾기
    const imgs = [];
    document.querySelectorAll('img').forEach((img, i) => {
      imgs.push({
        i,
        src: img.src ? img.src.substring(0,100) : '',
        w: img.width, h: img.height,
        rect: (() => { const r = img.getBoundingClientRect(); return `${Math.round(r.w)}x${Math.round(r.h)}`; })()
      });
    });

    return { editorInfo, imgs };
  });

  console.log('에디터 영역들:');
  html.editorInfo.forEach(e => console.log(`  [${e.i}] ${e.tag}.${e.cls} ${e.w}x${e.h} children:${e.children}`));
  console.log('\n이미지들:', html.imgs.length);
  html.imgs.forEach(img => console.log(`  [${img.i}] ${img.src} (${img.rect})`));

  await b.close();
}
main().catch(e => console.error('❌', e.message));
