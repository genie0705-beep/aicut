const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const page = await ctx.newPage();

  // 블로그 메인 페이지 (PostList 포함)
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', {
    waitUntil: 'domcontentloaded', timeout: 20000
  }).catch(() => {});
  await new Promise(r => setTimeout(r, 5000));

  console.log('URL:', page.url().substring(0, 100));

  const frames = page.frames();
  let mf = frames.find(f => f.name() === 'mainFrame');
  
  if (mf) {
    console.log('mainFrame 발견');
    
    // mainFrame 내부 HTML 구조 파악
    const htmlSample = await mf.evaluate(() => document.body.innerHTML.substring(0, 5000));
    console.log('\n=== mainFrame HTML (일부) ===');
    console.log(htmlSample);
    
    // a 태그 전체 출력
    const allLinks = await mf.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(a => ({
        href: a.getAttribute('href') || '',
        text: (a.innerText || '').trim().substring(0, 50)
      })).filter(a => a.text.length > 3).slice(0, 30);
    });
    console.log('\n=== mainFrame 내 a 태그 ===');
    allLinks.forEach((l, i) => console.log(` ${i+1}. href=${l.href.substring(0, 70)} text="${l.text}"`));
    
  } else {
    console.log('mainFrame 없음');
    frames.forEach((f, i) => console.log(` [${i}] name="${f.name()}" url=${f.url().substring(0, 100)}`));
    
    // 페이지 본문 직접 파싱
    const text = await page.evaluate(() => document.body.innerText.substring(0, 5000));
    console.log('\n=== 페이지 본문 ===');
    console.log(text);
  }

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
