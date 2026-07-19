// 구글 광고 애널리틱스 + 네이버 광고 종합 분석
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 모든 페이지 dialog 핸들러
  for (const p of ctx.pages()) {
    p.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  }
  
  const pages = ctx.pages();
  console.log('전체 탭:', pages.length);
  
  let ga4Page = null;
  let adPage = null;
  
  for (const p of pages) {
    const url = p.url();
    if (url.includes('analytics.google.com')) ga4Page = p;
    if (url.includes('manage.searchad.naver.com') || url.includes('ads.naver.com')) adPage = p;
  }
  
  console.log('GA4 탭:', ga4Page ? '✅' : '❌');
  console.log('네이버광고 탭:', adPage ? '✅' : '❌');
  
  // ============================================================
  // 1. GA4 데이터 분석
  // ============================================================
  console.log('\n' + '='.repeat(50));
  console.log('📊 구글 애널리틱스 (GA4) 분석');
  console.log('='.repeat(50));
  
  const gaData = { status: '탭 없음' };
  
  if (ga4Page) {
    await ga4Page.bringToFront();
    await ga4Page.waitForTimeout(5000);
    
    gaData.url = ga4Page.url().slice(0, 120);
    
    const gaInfo = await ga4Page.evaluate(() => {
      const body = document.body.innerText || '';
      const text = body;
      
      // 숫자 데이터 추출
      const numberPatterns = [];
      const lines = text.split('\n').filter(l => l.trim());
      
      // 주요 지표 찾기
      const metrics = {};
      
      // 사용자/세션
      const userMatch = text.match(/(\d[\d,.%]*)\s*(사용자|Users)/);
      if (userMatch) metrics.users = userMatch[1].trim();
      
      const sessionMatch = text.match(/(\d[\d,.%]*)\s*(세션|Sessions)/);
      if (sessionMatch) metrics.sessions = sessionMatch[1].trim();
      
      const pageviewMatch = text.match(/(\d[\d,.%]*)\s*(조회|Page\s*views|페이지뷰)/);
      if (pageviewMatch) metrics.pageviews = pageviewMatch[1].trim();
      
      const bounceMatch = text.match(/([\d.]+%)\s*(이탈|Bounce)/);
      if (bounceMatch) metrics.bounceRate = bounceMatch[1].trim();
      
      const durationMatch = text.match(/(\d+:\d+|\d+[.\d]*\s*[smh])\s*(세션\s*당\s*|평균\s*)?(참여|세션\s*시간|Engagement|duration)/i);
      if (durationMatch) metrics.avgDuration = durationMatch[1].trim();
      
      // 트래픽 소스
      const sources = [];
      ['organic', 'direct', 'referral', 'social', 'email', 'paid'].forEach(src => {
        const idx = text.indexOf(src);
        if (idx > -1) {
          const snippet = text.substring(Math.max(0, idx - 20), idx + 40).replace(/\s+/g, ' ').trim();
          sources.push(snippet.slice(0, 80));
        }
      });
      
      // 상위 페이지
      const pages = [];
      lines.forEach((l, i) => {
        if ((l.includes('/aicut/') || l.includes('blog.naver.com/aicut')) && l.length < 100) {
          pages.push(l.trim());
        }
      });
      
      return { textSample: text.slice(0, 3000), metrics, sources: sources.slice(0, 6), topPages: pages.slice(0, 10) };
    });
    
    gaData.metrics = gaInfo.metrics;
    gaData.sources = gaInfo.sources;
    gaData.topPages = gaInfo.topPages;
    gaData.textSample = gaInfo.textSample;
    gaData.status = '확인됨';
    
    console.log('GA4 주요 지표:', JSON.stringify(gaInfo.metrics, null, 2));
    console.log('\n트래픽 소스:', JSON.stringify(gaInfo.sources, null, 2));
    console.log('\n상위 페이지:', JSON.stringify(gaInfo.topPages, null, 2));
    console.log('\n페이지 텍스트 샘플:', gaInfo.textSample.slice(0, 1000));
    
    await ga4Page.screenshot({ path: 'debug_ga4_data.png', fullPage: false });
  }
  
  // ============================================================
  // 2. 네이버 광고 데이터 분석
  // ============================================================
  console.log('\n' + '='.repeat(50));
  console.log('📈 네이버 광고 (파워링크) 분석');
  console.log('='.repeat(50));
  
  const adData = { status: '탭 없음' };
  
  if (adPage) {
    await adPage.bringToFront();
    await adPage.waitForTimeout(5000);
    
    const adInfo = await adPage.evaluate(() => {
      const text = document.body.innerText || '';
      const lines = text.split('\n').filter(l => l.trim());
      
      const metrics = {};
      
      // 금액 데이터
      const amountMatch = text.match(/([0-9,]+)\s*원/g);
      if (amountMatch) metrics.amounts = amountMatch.slice(0, 10);
      
      // 클릭, 노출, CTR
      const clickMatch = text.match(/(\d[\d,]*)\s*(클릭|click)/i);
      if (clickMatch) metrics.clicks = clickMatch[1].trim();
      
      const impMatch = text.match(/(\d[\d,]*)\s*(노출|impression)/i);
      if (impMatch) metrics.impressions = impMatch[1].trim();
      
      const ctrMatch = text.match(/([\d.]+%)\s*(CTR|클릭률)/);
      if (ctrMatch) metrics.ctr = ctrMatch[1].trim();
      
      const cpcMatch = text.match(/평균\s*CPC[\s:]*([\d,]+원)/);
      if (cpcMatch) metrics.avgCPC = cpcMatch[1].trim();
      
      const costMatch = text.match(/총\s*비용[\s:]*([\d,]+원)/);
      if (costMatch) metrics.totalCost = costMatch[1].trim();
      
      const budgetMatch = text.match(/잔여\s*예산[\s:]*([\d,]+원)/);
      if (budgetMatch) metrics.remainingBudget = budgetMatch[1].trim();
      
      // 비즈머니
      const bizMoney = text.match(/비즈머니[\s\S]{0,30}?([\d,]+원)/);
      if (bizMoney) metrics.bizMoney = bizMoney[1].trim();
      
      // 캠페인명
      const campaignNames = [];
      lines.forEach(l => {
        if ((l.includes('에이컷') || l.includes('영상편집')) && l.length < 40) {
          campaignNames.push(l);
        }
      });
      
      return {
        allText: text.slice(0, 3000),
        metrics,
        keywords: text.match(/[가-힣]{2,}[편집외주마케팅]/g) || [],
        campaignNames: campaignNames.slice(0, 5)
      };
    });
    
    adData.metrics = adInfo.metrics;
    adData.text = adInfo.allText;
    adData.status = '확인됨';
    
    console.log('광고 지표:', JSON.stringify(adInfo.metrics, null, 2));
    console.log('\n페이지 텍스트:', adInfo.allText.slice(0, 1500));
    
    await adPage.screenshot({ path: 'debug_ads_data.png', fullPage: false });
  }
  
  // ============================================================
  // 3. 없다면 새 탭에서 열기
  // ============================================================
  if (!ga4Page) {
    console.log('\n⚠️ GA4 탭이 없습니다. 수동 확인 필요');
  }
  
  if (!adPage) {
    console.log('\n⚠️ 네이버 광고 탭이 없습니다. 수동 확인 필요');
  }
  
  // 결과 저장
  const result = { ga4: gaData, ads: adData, timestamp: new Date().toISOString() };
  console.log('\n✅ 분석 완료');
  
  await b.disconnect();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });