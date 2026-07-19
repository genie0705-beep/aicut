const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.goto('https://analytics.google.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('GA4 페이지 로드됨:', page.url().includes('analytics.google.com'));
  await page.waitForTimeout(8000);
  
  const url = page.url();
  console.log('현재 URL:', url);
  
  await page.screenshot({ path: 'ga4_login_check.png', fullPage: false });
  console.log('✅ 스크린샷 저장: ga4_login_check.png');
  
  if (url.includes('accounts.google.com') || url.includes('signin')) {
    console.log('⚠️ 로그인 필요 - 브라우저에서 직접 로그인해주세요');
  } else if (url.includes('analytics.google.com')) {
    console.log('✅ GA4 접속 완료');
  }
  
  console.log('완료');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
