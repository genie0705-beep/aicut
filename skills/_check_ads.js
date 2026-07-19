// 네이버 광고센터 — 광고 현황 분석
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  
  // 광고센터 메인
  await p.goto('https://manage.searchad.naver.com/', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await p.waitForTimeout(5000);
  
  const url = p.url();
  const title = await p.title();
  const bodyText = await p.evaluate(() => (document.body.innerText || '').slice(0, 800));
  
  console.log('URL:', url);
  console.log('Title:', title);
  console.log('Body:', bodyText);
  
  await p.screenshot({ path: 'debug_adcenter.png', fullPage: true });
  console.log('✅ 스크린샷: debug_adcenter.png');
  
  // 광고 요약 정보 확인
  const adInfo = await p.evaluate(() => {
    // 숫자/금액 등 주요 데이터 추출
    const text = document.body.innerText || '';
    const numbers = text.match(/[0-9,]+원|[0-9,]+%|[0-9,]+회/g) || [];
    return {
      allText: text.slice(0, 2000),
      numbers: numbers.slice(0, 30),
    };
  });
  console.log('광고 데이터:', JSON.stringify(adInfo, null, 2));
  
  // 캠페인 리스트 페이지 시도
  // 광고센터의 캠페인/광고그룹 페이지로 이동
  await p.goto('https://manage.searchad.naver.com/campaigns', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await p.waitForTimeout(5000);
  
  const body2 = await p.evaluate(() => (document.body.innerText || '').slice(0, 1000));
  console.log('\n=== 캠페인 페이지 ===');
  console.log('URL:', p.url());
  console.log('Body:', body2);
  
  await p.screenshot({ path: 'debug_campaigns.png', fullPage: true });
  
  await b.close();
}

main().catch(e => console.error('❌', e.message));
