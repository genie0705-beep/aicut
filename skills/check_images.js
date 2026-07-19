const { chromium } = require('playwright');
const path = require('path');
const WS = path.join(__dirname, '..');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('글쓰기 페이지 없음'); await b.close(); return; }

  // 에디터 내용 전체 분석
  const info = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const root = document.querySelector('.se-canvas-layer') || document.querySelector('.se-document');
    
    // 모든 자식 요소 (컴포넌트)
    if (!root) return { noRoot: true };
    
    const children = [];
    root.querySelectorAll(':scope > div, :scope > section, .se-component, .se-image-component, .se-text-component').forEach(el => {
      const cls = el.className;
      const tag = el.tagName;
      const rect = el.getBoundingClientRect();
      const img = el.querySelector('img');
      const text = el.textContent ? el.textContent.trim().substring(0, 60) : '';
      children.push({
        tag, cls: cls.substring(0, 80),
        hasImage: !!img?.src,
        imgSrc: img ? img.src.substring(0, 80) : '',
        text,
        w: Math.round(rect.w), h: Math.round(rect.h)
      });
    });
    
    // 이미지 요소 전체 검색
    const allImgs = [];
    document.querySelectorAll('img').forEach(img => {
      allImgs.push({
        src: img.src.substring(0, 80),
        w: img.width, h: img.height,
        parent: img.parentElement?.className?.substring(0, 40) || ''
      });
    });

    return { 
      rootTag: root?.tagName,
      rootCls: root?.className?.substring(0, 60),
      childCount: children.length,
      children,
      allImgs
    };
  });

  console.log('에디터 루트:', info.rootTag, info.rootCls);
  console.log('자식 수:', info.childCount);
  
  if (info.children) {
    info.children.forEach((c, i) => {
      console.log(`[${i}] ${c.tag} | img:${c.hasImage} | text:"${c.text}" | ${c.w}x${c.h}`);
    });
  }
  
  if (info.allImgs && info.allImgs.length > 0) {
    console.log('\n에디터 내 이미지:');
    info.allImgs.forEach((img, i) => {
      console.log(`  [${i}] src:${img.src} ${img.w}x${img.h}`);
    });
  } else {
    console.log('\n에디터 내 이미지 없음');
  }

  await b.close();
}
main().catch(e => console.error('❌', e.message));
