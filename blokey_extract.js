const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  console.log('=== Blokey 키워드 분석 ===\n');

  // Blokey 접속
  console.log('1. Blokey 접속...');
  await page.goto('https://blokey.co.kr', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(5000);
  console.log('   URL:', page.url().substring(0, 80));

  let text = await page.evaluate(() => document.body.innerText);
  console.log('\n   [Main Page]');
  text.split('\n').filter(l => l.trim()).slice(0, 40).forEach((l, i) => console.log(`    ${i}: ${l.substring(0, 100)}`));

  // 키워드 검색 기능 확인
  console.log('\n\n2. 키워드 검색 시도...');
  
  // 검색창 찾아서 입력
  const searchBox = await page.$('input[type="text"], input[placeholder*="검색"], textarea, input:not([type="hidden"])');
  
  if (searchBox) {
    // 여러 키워드 검색
    const keywords = ['프로야구', '야구', '7월 야구', '프랜차이즈 창업', '하반기 마케팅', '방학 특강', '숏폼 마케팅', '영상편집외주'];
    
    for (const kw of keywords) {
      console.log(`\n   🔍 "${kw}" 검색...`);
      
      // 검색어 입력
      await searchBox.click();
      await searchBox.fill('');
      await searchBox.type(kw, { delay: 50 });
      await sleep(2000);
      
      // 검색 버튼 또는 엔터
      const searchBtn = await page.$('button[type="submit"], button:has-text("검색")');
      if (searchBtn) {
        await searchBtn.click();
      } else {
        await page.keyboard.press('Enter');
      }
      await sleep(3000);
      
      text = await page.evaluate(() => document.body.innerText);
      console.log('   결과:');
      text.split('\n').filter(l => l.trim() && (l.includes('검색') || l.includes('월') || l.includes('등급') || l.includes('황금') || l.includes('경쟁') || /[0-9,]/.test(l))).slice(0, 10).forEach(l => console.log(`    ${l.substring(0, 120)}`));
    }
  } else {
    console.log('   검색창을 찾을 수 없음');
    console.log('   페이지 내용:');
    text.split('\n').filter(l => l.trim()).slice(0, 30).forEach(l => console.log('    ' + l.substring(0, 120)));
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
