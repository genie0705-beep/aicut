const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const page = await ctx.newPage();

  // 1. 블로그 통계 페이지
  await page.goto('https://blog.naver.com/BlogStatistics.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 5000));

  const mf = page.frame({ name: 'mainFrame' });
  if (mf) {
    const statsText = await mf.evaluate(() => document.body.innerText.substring(0, 4000));
    console.log('=== 블로그 통계 ===');
    console.log(statsText);
  } else {
    const text = await page.evaluate(() => document.body.innerText.substring(0, 3000));
    console.log('=== 통계 페이지 ===');
    console.log(text);
  }

  await page.close();

  // 2. 서치어드바이저 검색 키워드 (aicut.co.kr)
  const saPage = await ctx.newPage();
  await saPage.goto('https://searchadvisor.naver.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));
  const saText = await saPage.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log('\n=== 서치어드바이저 ===');
  console.log(saText.substring(0, 500));

  await saPage.close();

  // 3. GA4에서 이미 수집한 데이터 기반 키워드 분석 리포트
  console.log('\n=== GA4 기반 유입 채널 분석 ===');
  console.log('(6/7~6/13 기준)');
  console.log('총 세션: 210');
  console.log('Paid Social(인스타광고): 117세션 (55.7%)');
  console.log('Direct: 52세션 (24.8%)');
  console.log('Organic Search(네이버검색): 32세션 (15.2%)');
  console.log('Organic Social: 8세션 (3.8%)');
  console.log('');
  console.log('소스별:');
  console.log('  ig → 125세션 (인스타그램)');
  console.log('  m.search.naver.com → 26세션 (네이버 모바일 검색)');
  console.log('  naver → 19세션 (네이버 검색)');
  console.log('  ad.search.naver.com → 10세션 (파워링크 광고)');
  console.log('  threads → 5세션');
  console.log('  facebook → 9세션');

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
