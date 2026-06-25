// 에디터 구조 상세 분석
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  let pwFrame = null;
  for (const p of ctx.pages()) {
    for (const f of p.frames()) {
      if (f.url().includes('PostWriteForm')) {
        pwFrame = f;
        break;
      }
    }
    if (pwFrame) break;
  }

  if (!pwFrame) {
    console.log('❌ 에디터 못 찾음');
    try { await b.close(); } catch(e) {}
    process.exit(1);
  }

  // 모든 iframe 목록
  console.log('=== postwrite 내부 iframes ===');
  const frames = pwFrame.childFrames();
  for (const f of frames) {
    console.log('iframe:', f.url().substring(0, 120));
  }

  // 전체 DOM 트리 간략
  const dom = await pwFrame.evaluate(() => {
    const result = [];
    function walk(el, depth) {
      if (depth > 5) return;
      const tag = el.tagName?.toLowerCase() || '';
      const id = el.id || '';
      const cls = (el.className && typeof el.className === 'string') ? el.className.substring(0, 60) : '';
      const ce = el.isContentEditable ? '[CE]' : '';
      const ph = el.placeholder || '';
      
      if (id || cls || ce || ph || tag === 'iframe') {
        result.push({ tag, id, cls, ce, ph, depth });
      }
      
      // contenteditable이면 더 깊이 안 감
      if (el.isContentEditable) return;
      
      for (const child of el.children) {
        walk(child, depth + 1);
      }
    }
    walk(document.body, 0);
    return result;
  });

  console.log('\n=== 주요 DOM 요소 ===');
  for (const d of dom) {
    if (d.id || d.cls || d.ce || d.ph) {
      console.log(`${'  '.repeat(d.depth)}<${d.tag}> id="${d.id}" class="${d.cls}" ${d.ce} placeholder="${d.ph}"`);
    }
  }

  // contenteditable 요소 상세
  console.log('\n=== contenteditable 요소 ===');
  const eds = await pwFrame.evaluate(() => {
    return Array.from(document.querySelectorAll('[contenteditable]')).map((el, i) => ({
      index: i,
      tag: el.tagName,
      id: el.id,
      cls: (el.className || '').substring(0, 60),
      text: (el.innerText || '').substring(0, 50),
      parentTag: el.parentElement?.tagName,
      parentCls: (el.parentElement?.className || '').substring(0, 40),
      rect: (() => { try { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) }; } catch(e) { return {}; } })()
    }));
  });
  console.log(JSON.stringify(eds, null, 2));

  // 내부 iframe들 contenteditable 확인
  console.log('\n=== 내부 iframe contenteditable ===');
  for (const f of frames) {
    try {
      const innerEds = await f.evaluate(() => {
        return Array.from(document.querySelectorAll('[contenteditable]')).map(el => ({
          tag: el.tagName,
          id: el.id,
          cls: (el.className || '').substring(0, 50),
          text: (el.innerText || '').substring(0, 50)
        }));
      });
      if (innerEds.length > 0) {
        console.log(`iframe ${f.url().substring(0, 60)}:`, JSON.stringify(innerEds));
      }
    } catch(e) {}
  }

  try { await b.close(); } catch(e) {}
})();
