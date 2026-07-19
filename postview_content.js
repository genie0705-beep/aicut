const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  await page.goto('https://blog.naver.com/aicut/224333770986', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await sleep(6000);

  // PostView 프레임 찾기
  const pf = page.frames().find(f => f.url().includes('PostView'));
  if (!pf) { console.log('PostView not found'); process.exit(); }

  // 전체 텍스트 출력
  const text = await pf.evaluate(() => {
    const all = document.body.innerText;
    const result = {};
    result.fullText = all.substring(0, 5000);
    
    // 특정 영역 찾기
    const lines = all.split('\n').filter(l => l.trim());
    
    // 조회수, 공감수, 댓글수 관련 라인
    const statPatterns = ['조회', '공감', '댓글', '좋아요', 'count', 'view', 'list', '공유'];
    const statLines = [];
    for (const line of lines) {
      for (const pat of statPatterns) {
        if (line.includes(pat)) {
          statLines.push(line.substring(0, 80));
          break;
        }
      }
    }
    result.statLines = statLines.slice(0, 20);
    
    // 숫자+텍스트 조합 (숫자가 포함된 짧은 라인)
    const shortNums = lines.filter(l => /[0-9]/.test(l) && l.length < 30 && !l.includes('stylesheet') && !l.includes('.js'));
    result.shortNums = shortNums.slice(0, 20);
    
    return result;
  });

  console.log('=== PostView Content ===');
  console.log('\n[Stats lines]:');
  text.statLines.forEach(l => console.log(`  ${l}`));
  
  console.log('\n[Short number lines]:');
  text.shortNums.forEach(l => console.log(`  ${l}`));

  console.log('\n[Full text first 1500]:');
  console.log(text.fullText.substring(0, 1500));

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
