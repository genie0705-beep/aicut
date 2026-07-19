const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  // GA4 탭 찾기
  const gaPage = pages.find(p => p.url().includes('analytics.google.com'));
  if (!gaPage) {
    console.log('GA4 탭 없음');
    await browser.close();
    process.exit(1);
  }
  
  console.log('GA4 탭 이동:', gaPage.url().substring(0, 120));
  
  // 인사이트 홈으로 이동
  await gaPage.goto('https://analytics.google.com/analytics/web/#/p538910436/reports/defaulthome', { waitUntil: 'networkidle', timeout: 30000 });
  await gaPage.waitForTimeout(5000);
  
  const data = await gaPage.evaluate(() => {
    const text = document.body.innerText;
    const result = { rawText: text.substring(0, 6000) };
    
    // 활성 사용자
    const m1 = text.match(/활성\s*사용자[^0-9]*([0-9,]+)/);
    if (m1) result.활성사용자 = m1[1];
    
    // 세션
    const m2 = text.match(/세션[^0-9]*([0-9,]+)/);
    if (m2) result.세션 = m2[1];
    
    // 신규 사용자
    const m3 = text.match(/신규\s*사용자[^0-9]*([0-9,]+)/);
    if (m3) result.신규사용자 = m3[1];
    
    // 평균 참여 시간
    const m4 = text.match(/평균\s*참여\s*시간[^0-9]*([0-9ms: ]+)/);
    if (m4) result.평균참여시간 = m4[1];
    
    // 유입 채널 데이터 찾기
    const channels = [];
    const channelRegex = /(Organic Search|Direct|Paid Social|Organic Social|Referral|Email|Paid Search|Display|Affiliates|기타|유입채널)[^0-9]*[\s\S]{0,500}/g;
    // 대신 간단한 방식: 카드 형태 텍스트 분석
    const cards = document.querySelectorAll('[class*="card"], [class*="Card"], [class*="widget"], [data-testid]');
    cards.forEach(c => {
      const t = c.innerText.trim();
      if (t && t.length < 300) result[t.substring(0, 30)] = t;
    });
    
    return result;
  });
  
  console.log(JSON.stringify(data, null, 2));
  
  await browser.close();
})();
