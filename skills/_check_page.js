// 글쓰기 페이지 — 페이지 콘텐츠 확인
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let blogPage = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('blog.naver.com')) {
      blogPage = p;
      p.on('dialog', async d => { await d.accept(); });
      break;
    }
  }
  if (!blogPage) {
    blogPage = await ctx.newPage();
    blogPage.on('dialog', async d => { await d.accept(); });
  }
  
  await blogPage.goto('https://blog.naver.com/PostWrite.nhn?blogId=aicut', {
    waitUntil: 'domcontentloaded',
    timeout: 20000
  });
  await blogPage.waitForTimeout(8000);
  
  // 페이지 본문 전체 텍스트 출력
  const bodyText = await blogPage.evaluate(() => document.body.innerText.slice(0, 3000));
  console.log('=== 페이지 텍스트 ===');
  console.log(bodyText);
  
  // HTML 구조 간략히
  const htmlStructure = await blogPage.evaluate(() => {
    const walk = (el, d) => {
      if (d > 4) return [];
      const arr = [];
      const tag = el.tagName.toLowerCase();
      const id = el.id ? '#'+el.id : '';
      const cls = el.className && typeof el.className === 'string' ? '.'+el.className.slice(0,30) : '';
      const text = (el.innerText || '').trim().slice(0, 40);
      arr.push('  '.repeat(d) + tag + id + cls + (text ? ' = "'+text+'"' : ''));
      for (const c of el.children) {
        arr.push(...walk(c, d+1));
      }
      return arr;
    };
    return walk(document.body, 0).slice(0, 100).join('\n');
  });
  console.log('\n=== HTML 구조 (depth 4) ===');
  console.log(htmlStructure);
  
  await b.close();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });