const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  
  const urls = [
    { label: '인스타릴스 광고', url: 'https://kin.naver.com/qna/detail.naver?d1id=1&dirId=1061203&docId=491943585' },
    { label: '결혼식 영상', url: 'https://kin.naver.com/qna/detail.naver?d1id=10&dirId=10010102&docId=493736600' },
    { label: 'AI동영상', url: 'https://kin.naver.com/qna/detail.naver?d1id=8&dirId=8080105&docId=493566474' },
    { label: '홈런 숏폼', url: 'https://kin.naver.com/qna/detail.naver?d1id=3&dirId=31402&docId=493820187' },
  ];
  
  for (const item of urls) {
    const p = await ctx.newPage();
    await p.goto(item.url, { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(5000);
    
    const content = await p.evaluate(() => {
      const mainContent = document.querySelector('#content');
      if (mainContent) return mainContent.innerText.trim();
      return document.body.innerText.trim().substring(0, 3000);
    });
    
    console.log('\n====== ' + item.label + ' ======');
    console.log(content.substring(0, 1500));
    console.log('...[length: ' + content.length + ']');
    
    await p.close();
  }
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));
