const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  try {
    await page.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'load', timeout: 20000 });
    await sleep(4000);

    // PostView iframe
    const pf = page.frames().find(f => f.url().includes('PostView'));
    if (!pf) { console.log('PostView iframe not found'); return; }

    // 방법 1: 직접 jQuery/synthetic click 이벤트 발생
    console.log('방법 1: synthetic click 이벤트...');
    await pf.evaluate(() => {
      const link = document.querySelector('a._modifyPost');
      if (!link) return;
      
      // MouseEvent로 강제 클릭
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    });
    
    await sleep(3000);
    console.log('  URL:', page.url());
    
    // 방법 2: parent.location 변경
    if (!page.url().includes('PostEdit')) {
      console.log('방법 2: parent.location 변경...');
      await pf.evaluate(() => {
        try {
          if (window.parent) {
            window.parent.location.href = 'https://blog.naver.com/PostEdit.naver?blogId=aicut&postNo=224341544476&from=postView';
          }
        } catch(e) { console.log('parent edit error:', e.message); }
      });
      await sleep(5000);
      console.log('  URL:', page.url());
    }
    
    // 방법 3: 새 탭에서 열기
    if (!page.url().includes('PostEdit')) {
      console.log('방법 3: 새 탭...');
      const editUrl = `https://blog.naver.com/PostEdit.naver?blogId=aicut&postNo=224341544476`;
      
      // 새 페이지에서 열기
      const page2 = await ctx.newPage();
      await page2.goto(editUrl, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
      await sleep(3000);
      console.log('  page2 URL:', page2.url());
      
      const bodyText = await page2.evaluate(() => document.body?.innerText?.substring(0, 200) || '').catch(() => '');
      console.log('  page2 body:', bodyText);
      
      // 안 되면 기존 page 사용
      await page2.close();
      
      // 다른 형식 시도
      const urls = [
        `https://blog.naver.com/PostEditor.naver?blogId=aicut&logNo=224341544476`,
        `https://blog.naver.com/EditPost.naver?blogId=aicut&logNo=224341544476`,
        `https://blog.naver.com/WriteEdit.naver?blogId=aicut&logNo=224341544476`,
        `https://blog.naver.com/PostWrite.naver?blogId=aicut&logNo=224341544476`,
      ];
      
      for (const url of urls) {
        const p3 = await ctx.newPage();
        await p3.goto(url, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
        await sleep(2000);
        const body = await p3.evaluate(() => document.body?.innerText?.substring(0, 100) || '').catch(() => '');
        console.log(`  ${url}: ${body.substring(0, 60)}`);
        await p3.close();
      }
    }

  } finally {
    await page.close();
  }
})();
