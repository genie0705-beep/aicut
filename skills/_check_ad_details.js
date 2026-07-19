const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  
  // 광고 관리 → 캠페인 페이지로 이동
  await p.goto('https://ads.naver.com/manage/ad-accounts/334739/campaigns', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await p.waitForTimeout(5000);
  
  console.log('URL:', p.url());
  
  const bodyText = await p.evaluate(() => (document.body.innerText || '').slice(0, 1500));
  console.log('Body:', bodyText);
  
  await p.screenshot({ path: 'debug_campaign_detail.png', fullPage: true });
  console.log('✅ 스크린샷: debug_campaign_detail.png');
  
  // 키워드/광고그룹 데이터도 확인
  // 광고그룹 페이지
  await p.goto('https://ads.naver.com/manage/ad-accounts/334739/ad-groups', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await p.waitForTimeout(5000);
  
  console.log('\n=== 광고그룹 페이지 ===');
  console.log('URL:', p.url());
  const body3 = await p.evaluate(() => (document.body.innerText || '').slice(0, 1500));
  console.log('Body:', body3);
  
  await p.screenshot({ path: 'debug_adgroups.png', fullPage: true });
  
  await b.close();
}

main().catch(e => console.error('❌', e.message));
