// blokey — 올바른 URL로 실시간 트렌드 + 황금키워드 분석
const { chromium } = require('playwright');
const fs = require('fs');

async function getMainContent(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(4000);
  
  return await page.evaluate(() => {
    // main 영역의 내용만 추출
    const main = document.querySelector('main');
    if (!main) return { text: '(no main)', html: '' };
    return {
      text: main.innerText.slice(0, 5000),
      html: main.innerHTML.slice(0, 5000)
    };
  });
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const p of ctx.pages()) {
    const url = p.url();
    if (url.includes('blokey')) { page = p; break; }
  }
  if (!page) {
    page = await ctx.newPage();
  }
  
  const allData = { timestamp: new Date().toISOString() };
  
  // 1️⃣ 실시간 트렌드
  console.log('1️⃣ 실시간 트렌드...');
  const trends = await getMainContent(page, 'https://blokey.co.kr/trends');
  allData.trends = trends;
  console.log('트렌드:', trends.text.slice(0, 1000));
  
  // 2️⃣ 트렌드 주제
  console.log('\n2️⃣ 트렌드 주제...');
  const topics = await getMainContent(page, 'https://blokey.co.kr/trend-topics');
  allData.topics = topics;
  console.log('트렌드 주제:', topics.text.slice(0, 1000));
  
  // 3️⃣ 황금키워드
  console.log('\n3️⃣ 황금키워드...');
  const golden = await getMainContent(page, 'https://blokey.co.kr/golden');
  allData.golden = golden;
  console.log('황금키워드:', golden.text.slice(0, 1000));
  
  // 4️⃣ 실시간 황금키워드
  console.log('\n4️⃣ 실시간 황금키워드...');
  const goldenLive = await getMainContent(page, 'https://blokey.co.kr/golden-live');
  allData.goldenLive = goldenLive;
  console.log('실시간 황금키워드:', goldenLive.text.slice(0, 1000));
  
  // 5️⃣ 키워드 분석 페이지
  console.log('\n5️⃣ 키워드 분석 메인 페이지...');
  const kwPage = await getMainContent(page, 'https://blokey.co.kr/keyword');
  allData.keywordPage = kwPage;
  console.log('키워드 분석:', kwPage.text.slice(0, 500));
  
  fs.writeFileSync('blokey_results_v2.json', JSON.stringify(allData, null, 2), 'utf8');
  console.log('\n✅ 완료 → blokey_results_v2.json');
  
  await b.close();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
