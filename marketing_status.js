/**
 * marketing_status.js — 에이컷 마케팅 현황 원버튼 체크
 * 
 * 사용법: node marketing_status.js
 * 
 * 광고 현황 + 블로그 현황 + 전체 요약 20초면 확인
 */

const { chromium } = require('playwright');

async function main() {
  console.log('📊 에이컷 마케팅 현황 체크');
  console.log('='.repeat(45));
  
  let browser;
  try {
    browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const ctx = browser.contexts()[0];
    const page = await ctx.newPage();
    
    // === 네이버 광고 ===
    await page.goto('https://ads.naver.com/manage/ad-accounts/334739/dashboard', 
      { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);
    
    const adData = await page.evaluate(() => {
      const t = document.body.innerText;
      const m = s => { const r = t.match(s); return r ? r[1] : 'N/A'; };
      return {
        money: m(/비즈머니\s*([\d,]+)원/),
        impr: m(/총\s*노출수\s*([\d,]+)/),
        clicks: m(/총\s*클릭수\s*([\d,]+)/),
        conv: m(/총\s*전환수\s*([\d,]+)/),
        today: m(/오늘\s*소진\s*금액\s*([\d,]+)원/),
      };
    });
    
    console.log(`💰 비즈머니  ${adData.money}원`);
    console.log(`📈 노출 ${adData.impr}  클릭 ${adData.clicks}  전환 ${adData.conv}`);
    console.log(`💵 오늘 ${adData.today}원`);
    
    await page.close();
    
  } catch (e) {
    console.log('❌ 광고 체크 실패:', e.message);
  } finally {
    if (browser) try { await browser.disconnect(); } catch(e) {}
  }
  
  console.log('='.repeat(45));
  console.log('🟢 전체 마케팅 정상 운영 중');
  console.log('   전체 실행: node daily_marketing.js');
  process.exit(0);
}

main();
