// blokey — 페이지 구조 분석
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('blokey')) { page = p; break; }
  }
  if (!page) {
    page = await ctx.newPage();
  }
  
  // 1. 메인 페이지
  await page.goto('https://blokey.co.kr', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  // 전체 DOM 구조 분석
  const structure = await page.evaluate(() => {
    function getStructure(el, depth = 0) {
      if (depth > 3) return '';
      let result = '  '.repeat(depth) + el.tagName.toLowerCase();
      if (el.id) result += '#' + el.id;
      if (el.className && typeof el.className === 'string') result += '.' + el.className.slice(0, 40);
      const text = (el.innerText || '').trim().slice(0, 40);
      if (text) result += ' = "' + text + '"';
      result += '\n';
      for (const child of el.children) {
        result += getStructure(child, depth + 1);
      }
      return result;
    }
    return getStructure(document.body);
  });
  console.log('=== 페이지 구조 ===');
  console.log(structure.slice(0, 3000));
  
  // 사이드바 메뉴 클릭하여 트렌드 페이지 이동
  console.log('\n=== 사이드바에서 트렌드 클릭 시도 ===');
  const sidebarLinks = await page.evaluate(() => {
    const links = document.querySelectorAll('a, button, [role="button"], span, div');
    const result = [];
    for (const el of links) {
      const text = el.innerText?.trim();
      if (text && text.length < 30 && (text.includes('트렌드') || text.includes('황금') || text.includes('키워드'))) {
        const tag = el.tagName;
        const cls = el.className?.slice(0, 50);
        const id = el.id;
        const href = el.href || '';
        result.push({ tag, text: text.slice(0, 30), cls, id, href: href.slice(0, 100) });
      }
    }
    return result;
  });
  console.log('찾은 메뉴 항목들:', JSON.stringify(sidebarLinks, null, 2));
  
  await b.disconnect();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
