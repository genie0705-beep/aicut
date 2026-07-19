const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  
  // 블로그 메인으로 이동
  await p.goto('https://blog.naver.com/aicut', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await p.waitForTimeout(3000);
  
  await p.screenshot({ path: 'debug_blog_main.png', fullPage: true });
  console.log('✅ 스크린샷: debug_blog_main.png');
  
  const bodyText = await p.evaluate(() => (document.body.innerText || '').slice(0, 1000));
  console.log('📄 body:', bodyText);
  
  // 글쓰기/포스트쓰기 링크 찾기
  const writeLinks = await p.evaluate(() => {
    const links = [];
    document.querySelectorAll('a').forEach(a => {
      const href = a.href || '';
      const text = (a.innerText || a.title || '').trim();
      if (href.includes('PostWrite') || href.includes('postwrite') || text.includes('글쓰기') || text.includes('글 작성') || text.includes('write')) {
        links.push({ text: text.slice(0,30), href: href.slice(0,150) });
      }
    });
    return links;
  });
  console.log('📎 글쓰기 링크들:', JSON.stringify(writeLinks, null, 2));
  
  // 다양한 버튼 찾기
  const buttons = await p.evaluate(() => {
    const btns = [];
    document.querySelectorAll('a, button, span').forEach(el => {
      const text = (el.innerText || el.title || '').trim().slice(0,20);
      const cls = (el.className || '').slice(0,60);
      if (text.includes('글쓰기') || text.includes('글') || text.includes('write') || text.includes('관리') || cls.includes('write') || cls.includes('post')) {
        btns.push({ tag: el.tagName, text, cls, href: el.href?.slice(0,100) });
      }
    });
    return btns;
  });
  console.log('🔘 글 관련 버튼들:', JSON.stringify(buttons, null, 2));
  
  await b.close();
}

main().catch(e => console.error('❌', e.message));
