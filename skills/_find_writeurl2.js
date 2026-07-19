// 네이버 블로그 — iframe 안 글쓰기 찾기
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 이미 열린 blog 탭 사용
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
    await blogPage.waitForTimeout(3000);
  }
  
  // iframe 접근
  const mainFrame = blogPage.frame('mainFrame');
  if (!mainFrame) {
    console.log('mainFrame iframe을 찾을 수 없음');
    // 다른 방식: section.blog.naver.com 의 BlogHome 페이지로 이동
    await blogPage.goto('https://section.blog.naver.com/BlogHome.naver?directoryNo=0&currentPage=1&groupId=0', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    await blogPage.waitForTimeout(5000);
    
    const writeBtns = await blogPage.evaluate(() => {
      const results = [];
      document.querySelectorAll('a, button').forEach(el => {
        const text = el.innerText.trim();
        const href = el.href || '';
        const onclick = el.getAttribute('onclick') || '';
        if (text.includes('글쓰기') || href.includes('write') || onclick.includes('write') || onclick.includes('Write')) {
          results.push({ text: text.slice(0, 30), href: href.slice(0, 120), onclick: onclick.slice(0, 120) });
        }
      });
      return results;
    });
    console.log('글쓰기 버튼:', JSON.stringify(writeBtns, null, 2));
    
    // 페이지 전체 텍스트
    const bodyText = await blogPage.evaluate(() => document.body.innerText.slice(0, 1000));
    console.log('페이지 텍스트:', bodyText);
    
    return;
  }
  
  console.log('mainFrame 접근 성공');
  const bodyText = await mainFrame.evaluate(() => document.body.innerText.slice(0, 2000));
  console.log('iframe 본문:', bodyText);
  
  // iframe 안 글쓰기 버튼 찾기
  const writeBtn = await mainFrame.evaluate(() => {
    const results = [];
    document.querySelectorAll('a, button').forEach(el => {
      const text = el.innerText.trim();
      const href = el.href || '';
      if (text === '글쓰기' || href.includes('write') || href.includes('PostWrite')) {
        results.push({
          text: text.slice(0, 30),
          href: (href || '').slice(0, 150),
          cls: (el.className || '').slice(0, 40)
        });
      }
    });
    return results;
  });
  console.log('iframe 글쓰기:', JSON.stringify(writeBtn, null, 2));
  
  await b.close();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });