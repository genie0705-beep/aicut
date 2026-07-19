const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 1. 레퍼런스 블로그 구조 분석 (줄 단위)
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/aicut/224346527054', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(5000);
  
  const frames = page.frames();
  const postFrame = frames.find(f => f.url().includes('PostView.naver'));
  
  let refLines = [];
  if (postFrame) {
    refLines = await postFrame.evaluate(() => {
      const main = document.querySelector('.se-main-container');
      if (!main) return [];
      const lines = [];
      main.querySelectorAll('p, h2, h3').forEach(el => {
        const t = el.innerText.replace(/\s+/g, ' ').trim();
        if (t) lines.push(t);
      });
      return lines;
    });
  }
  await page.close();
  
  // 2. 레퍼런스의 텍스트 구조 출력
  console.log('=== 레퍼런스 줄 단위 구조 (' + refLines.length + '줄) ===\n');
  refLines.forEach((l, i) => {
    console.log(i + ': [' + l.length + '자] ' + l);
  });
  
  // 3. 통계
  const totalLen = refLines.reduce((a, l) => a + l.length, 0);
  const avgLen = Math.round(totalLen / refLines.length);
  console.log('\n=== 통계 ===');
  console.log('줄 수:', refLines.length);
  console.log('평균 길이:', avgLen + '자');
  console.log('총 글자수:', totalLen);
  
  await b.close();
})();
