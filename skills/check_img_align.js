const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));
  const r = await wp.evaluate(() => {
    // 이미지를 감싸는 컴포넌트 구조 찾기
    const imgs = document.querySelectorAll('img');
    return Array.from(imgs).map((img, i) => {
      const containers = [];
      let el = img;
      while (el) {
        el = el.parentElement;
        if (!el || el === document.body) break;
        containers.push({
          tag: el.tagName,
          cls: el.className.substring(0, 80),
          style: el.getAttribute('style') || '(없음)',
          align: el.style.textAlign || el.style.cssFloat || 'none'
        });
      }
      return {
        i,
        size: img.naturalWidth + 'x' + img.naturalHeight,
        containers
      };
    });
  });
  console.log('이미지 컨테이너 구조:');
  r.forEach(img => {
    console.log(`\n[${img.i}] ${img.size}`);
    img.containers.forEach((c, ci) => {
      console.log(`  ${'  '.repeat(ci)}↳ ${c.tag}.${c.cls.substring(0,50)} | style="${c.style}" | align=${c.align}`);
    });
  });
  await b.close();
}
main().catch(e => console.log('err:', e.message));
