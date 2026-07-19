// 네이버 블로그 — 올바른 글쓰기 URL 찾기
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let blogPage = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('blog.naver.com/aicut')) {
      blogPage = p;
      p.on('dialog', async d => { await d.accept(); });
      break;
    }
  }
  if (!blogPage) {
    blogPage = await ctx.newPage();
    blogPage.on('dialog', async d => { await d.accept(); });
    await blogPage.goto('https://blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await blogPage.waitForTimeout(5000);
  }
  
  const url = blogPage.url();
  console.log('현재 URL:', url);
  
  // 1. 페이지에서 '글쓰기' 버튼/링크 찾기
  const writeLink = await blogPage.evaluate(() => {
    const all = document.querySelectorAll('a, button, span');
    for (const el of all) {
      const text = el.innerText.trim();
      if (text === '글쓰기' || text === '글 작성') {
        const href = el.href || '';
        const onclick = el.getAttribute('onclick') || '';
        return { tag: el.tagName, text, href: href.slice(0, 150), onclick: onclick.slice(0, 150) };
      }
    }
    return null;
  });
  console.log('글쓰기 버튼:', JSON.stringify(writeLink));
  
  // 2. 네이버 블로그 헤더의 글쓰기 링크
  const allWrite = await blogPage.evaluate(() => {
    const results = [];
    // 모든 a 태그 검사
    document.querySelectorAll('a').forEach(a => {
      const href = (a.href || '').toLowerCase();
      const text = a.innerText.trim().toLowerCase();
      if (href.includes('write') || href.includes('postwrite') || text === '글쓰기') {
        results.push({
          text: a.innerText.trim().slice(0, 30),
          href: (a.href || '').slice(0, 120),
          onclick: (a.getAttribute('onclick') || '').slice(0, 100),
          cls: (a.className || '').slice(0, 30)
        });
      }
    });
    return results;
  });
  console.log('write 관련 링크들:', JSON.stringify(allWrite, null, 2));
  
  // 3. 네이버 블로그 iframe 안 검사
  const iframeInfo = await blogPage.evaluate(() => {
    const result = [];
    document.querySelectorAll('iframe').forEach(f => {
      const src = f.src || '';
      const id = f.id || '';
      result.push({ id, src: src.slice(0, 150) });
    });
    return result;
  });
  console.log('iframe들:', JSON.stringify(iframeInfo, null, 2));
  
  await b.close();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });