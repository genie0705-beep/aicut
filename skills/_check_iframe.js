const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  
  await p.goto('https://blog.naver.com/aicut', {
    waitUntil: 'domcontentloaded',
    timeout: 20000
  });
  await p.waitForTimeout(5000);
  
  console.log('현재 URL:', p.url());
  
  // iframe 내부 접근
  const frame = await p.$('iframe#mainFrame');
  if (frame) {
    const frameContent = await frame.contentFrame();
    if (frameContent) {
      console.log('iframe URL:', frameContent.url());
      
      const bodyText = await frameContent.evaluate(() => (document.body.innerText || '').slice(0, 500));
      console.log('iframe body:', bodyText);
      
      // 글쓰기 버튼 찾기
      const writeBtns = await frameContent.evaluate(() => {
        const btns = [];
        // 모든 a와 button 요소 검사
        document.querySelectorAll('a, button, span').forEach(el => {
          const text = (el.innerText || el.title || el.textContent || '').trim();
          const cls = (el.className || '').slice(0,60);
          if (text.includes('글쓰기') || text.includes('글 작성') || text.includes('write') || text.includes('Post') || text.includes('post') || cls.includes('write') || cls.includes('post') || cls.includes('btn_write')) {
            btns.push({ tag: el.tagName, text: text.slice(0,30), cls, href: (el.href || '').slice(0,150) });
          }
        });
        return btns;
      });
      console.log('글쓰기 버튼:', JSON.stringify(writeBtns, null, 2));
      
      // 아이프레임 내 모든 링크 (href에 PostWrite 포함)
      const postWriteLinks = await frameContent.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
          .filter(a => (a.href || '').includes('PostWrite'))
          .map(a => ({ text: (a.innerText || '').slice(0,30), href: (a.href || '').slice(0,200) }));
      });
      console.log('PostWrite 링크:', JSON.stringify(postWriteLinks, null, 2));
      
      await p.screenshot({ path: 'debug_iframe.png', fullPage: false });
      console.log('✅ 스크린샷: debug_iframe.png');
    }
  }
  
  await b.close();
}

main().catch(e => console.error('❌', e.message));
