/**
 * daily_marketing.js — 에이컷 통합 데일리 마케팅 자동화
 * 
 * 사용법: node daily_marketing.js [옵션]
 * 
 * 옵션:
 *   full      — 전체 루틴 실행 (기본)
 *   check     — 현황만 확인
 *   blog      — 블로그 관련만 실행
 *   sns       — SNS 관련만 실행  
 *   ad        — 광고 현황만 확인
 *   report    — 리포트만 생성
 * 
 * 1인 기업 대표를 위한 원버튼 마케팅 자동화
 */

const { chromium } = require('playwright');
const BROWSER_PORT = 9224;

// ============================================================
// 설정
// ============================================================
const CONFIG = {
  // 네이버
  naverAdAccount: '334739',
  blogId: 'aicut',
  
  // 인스타그램
  instagram: {
    targetHashtags: ['콘텐츠마케팅', '유튜브마케팅', '쇼핑몰마케팅', '영상편집', '숏폼마케팅', '릴스마케팅'],
    commentTemplates: [
      '영상 편집 아웃소싱 고민이신가요? 에이컷에서 도와드립니다!',
      '숏폼 영상, 월 정기 납품으로 부담 없이 시작하세요.',
      'AI 기반 영상 편집 서비스, 에이컷을 확인해보세요.',
    ]
  },
  
  // 블로그
  blog: {
    visitCount: 10,      // 이웃 방문 수
    likeRate: 0.5,       // 공감률 50%
  }
};

// ============================================================
// 공통 유틸
// ============================================================
let browser = null;

async function connectBrowser() {
  try {
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${BROWSER_PORT}`);
    return browser.contexts()[0];
  } catch (e) {
    console.log('❌ Chrome 연결 실패 (포트 ' + BROWSER_PORT + ')');
    console.log('   Chrome이 실행 중인지 확인하세요.');
    return null;
  }
}

async function closeBrowser() {
  if (browser) {
    try { await browser.disconnect(); } catch(e) {}
    browser = null;
  }
}

// ============================================================
#region 📊 1. 광고 현황 체크
// ============================================================
async function checkAdStatus() {
  console.log('\n=== 📊 광고 현황 체크 ===');
  const ctx = await connectBrowser();
  if (!ctx) return null;
  
  try {
    const page = await ctx.newPage();
    await page.goto(`https://ads.naver.com/manage/ad-accounts/${CONFIG.naverAdAccount}/dashboard`, 
      { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1500);
    
    const data = await page.evaluate(() => {
      const text = document.body.innerText;
      
      // 비즈머니
      const bizMoney = text.match(/비즈머니\s*([\d,]+)원/);
      // 노출/클릭/전환
      const impr = text.match(/총\s*노출수\s*([\d,]+)/);
      const clicks = text.match(/총\s*클릭수\s*([\d,]+)/);
      const conv = text.match(/총\s*전환수\s*([\d,]+)/);
      // 오늘 소진
      const todayCost = text.match(/오늘\s*소진\s*금액\s*([\d,]+)원/);
      const yesterdayCost = text.match(/([\d,]+)원\s*0%\s*100%/);
      
      // 기간
      const period = text.match(/(\d{4}\.\d{2}\.\d{2}\.)\s*(\d{4}\.\d{2}\.\d{2}\.)/);
      
      return {
        period: period ? `${period[1]}~${period[2]}` : 'N/A',
        bizMoney: bizMoney ? bizMoney[1] : 'N/A',
        impressions: impr ? impr[1] : 'N/A',
        clicks: clicks ? clicks[1] : 'N/A',
        conversions: conv ? conv[1] : 'N/A',
        todayCost: todayCost ? todayCost[1] : 'N/A',
        yesterdayCost: yesterdayCost ? yesterdayCost[1] : 'N/A'
      };
    });
    
    await page.close();
    console.log(`💰 비즈머니: ${data.bizMoney}원`);
    console.log(`📈 노출: ${data.impressions} / 클릭: ${data.clicks} / 전환: ${data.conversions}`);
    console.log(`💵 오늘 소진: ${data.todayCost}원`);
    return data;
    
  } catch (e) {
    console.log('❌ 광고 체크 실패:', e.message);
    return null;
  } finally {
    await closeBrowser();
  }
}

// ============================================================
#endregion
#region 📝 2. 블로그 이웃 방문 + 공감
// ============================================================
async function blogNeighborVisit() {
  console.log('\n=== 👋 블로그 이웃 방문 + 공감 ===');
  const ctx = await connectBrowser();
  if (!ctx) return;
  
  try {
    // 기존 blog_visit.js 로직 활용
    // 네이버 블로그 이웃글 목록에서 방문 + 공감
    const page = await ctx.newPage();
    await page.goto(`https://blog.naver.com/PostList.naver?blogId=${CONFIG.blogId}&categoryNo=10&parentCategoryNo=10&viewType=0`, 
      { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    
    // 이웃글 링크 수집
    const links = await page.evaluate(() => {
      const items = document.querySelectorAll('a[href*="logNo="]');
      return Array.from(items).slice(0, 15).map(a => a.href);
    });
    
    console.log(`📝 이웃글 ${links.length}개 발견`);
    
    let visited = 0;
    let liked = 0;
    
    for (let i = 0; i < Math.min(links.length, CONFIG.blog.visitCount); i++) {
      try {
        await page.goto(links[i], { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(1000);
        visited++;
        
        // 50% 확률로 공감
        if (Math.random() < CONFIG.blog.likeRate) {
          // iframe 전환 후 공감 버튼 클릭
          const frames = page.frames();
          for (const f of frames) {
            const btn = await f.$('text=공감');
            if (btn) { await btn.click(); liked++; break; }
          }
        }
        
        // 랜덤 대기 (어뷰징 방지)
        await page.waitForTimeout(2000 + Math.random() * 3000);
      } catch (e) {
        // 개별 실패는 무시
      }
    }
    
    console.log(`✅ 방문: ${visited}개 / 공감: ${liked}개`);
    await page.close();
    
  } catch (e) {
    console.log('❌ 블로그 방문 실패:', e.message);
  } finally {
    await closeBrowser();
  }
}

// ============================================================
#endregion
#region 📸 3. 인스타그램 활동
// ============================================================
async function instaActivity() {
  console.log('\n=== 📸 인스타그램 활동 ===');
  const ctx = await connectBrowser();
  if (!ctx) return;
  
  try {
    const page = await ctx.newPage();
    await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    
    // 로그인 체크
    const isLoggedIn = await page.evaluate(() => {
      return document.body.innerText.includes('홈') || 
             document.body.innerText.includes('Home') ||
             !!document.querySelector('[aria-label="홈"]') ||
             !!document.querySelector('[aria-label="Home"]');
    });
    
    if (!isLoggedIn) {
      console.log('⚠️ 인스타 로그인 필요');
      await page.close();
      return;
    }
    
    console.log('✅ 인스타 로그인 상태');
    
    // 타겟 수집 (기존 insta_collect.js 방식)
    // 해시태그 검색 → 게시물 수집 → 댓글
    let totalComments = 0;
    
    for (const tag of CONFIG.instagram.targetHashtags.slice(0, 3)) {
      try {
        await page.goto(`https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`, 
          { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(2000);
        
        // 게시물 클릭
        const posts = await page.$$('article a');
        if (posts.length > 0) {
          await posts[0].click();
          await page.waitForTimeout(2000);
          
          // 댓글 달기
          const commentTemplate = CONFIG.instagram.commentTemplates[
            Math.floor(Math.random() * CONFIG.instagram.commentTemplates.length)
          ];
          
          const commentArea = await page.$('textarea, [aria-label="댓글 달기"], [aria-label="Add a comment…"]');
          if (commentArea) {
            await commentArea.click();
            await page.waitForTimeout(500);
            await commentArea.fill(commentTemplate);
            await page.waitForTimeout(500);
            
            // 게시 버튼 클릭
            const submitBtn = await page.$('button[type="submit"]');
            if (submitBtn) {
              await submitBtn.click();
              totalComments++;
              await page.waitForTimeout(2000);
            }
          }
        }
      } catch (e) {
        // 개별 태그 실패 무시
      }
    }
    
    console.log(`✅ 댓글: ${totalComments}개 완료`);
    await page.close();
    
  } catch (e) {
    console.log('❌ 인스타 활동 실패:', e.message);
  } finally {
    await closeBrowser();
  }
}

// ============================================================
#endregion
#region 🧵 4. Threads 활동
// ============================================================
async function threadsActivity() {
  console.log('\n=== 🧵 Threads 활동 ===');
  const ctx = await connectBrowser();
  if (!ctx) return;
  
  try {
    const page = await ctx.newPage();
    await page.goto('https://www.threads.net/', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    
    // 로그인 체크
    const isLoggedIn = await page.evaluate(() => {
      return document.body.innerText.includes('홈') || 
             document.body.innerText.includes('프로필') ||
             document.body.innerText.includes('Profile');
    });
    
    if (!isLoggedIn) {
      console.log('⚠️ Threads 로그인 필요');
      await page.close();
      return;
    }
    
    console.log('✅ Threads 로그인 상태');
    console.log('📌 활동 완료 (기능 준비)');
    await page.close();
    
  } catch (e) {
    console.log('❌ Threads 활동 실패:', e.message);
  } finally {
    await closeBrowser();
  }
}

// ============================================================
#endregion
#region 🛠️ 5. 서치어드바이저 색인 요청
// ============================================================
async function searchAdvisorRequest() {
  console.log('\n=== 🔍 서치어드바이저 수집 요청 ===');
  const ctx = await connectBrowser();
  if (!ctx) return;
  
  try {
    const page = await ctx.newPage();
    await page.goto('https://searchadvisor.naver.com/', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    
    // 로그인 체크
    const hasSite = await page.evaluate(() => {
      return document.body.innerText.includes('aicut') || 
             document.querySelector('[class*=site]');
    });
    
    if (hasSite) {
      console.log('✅ 사이트 등록됨 — 수동 요청 필요 시 직접 실행');
    } else {
      console.log('⚠️ 서치어드바이저 로그인 필요');
    }
    
    await page.close();
    
  } catch (e) {
    console.log('❌ 서치어드바이저 실패:', e.message);
  } finally {
    await closeBrowser();
  }
}

// ============================================================
#endregion
#region 📋 6. 최종 리포트
// ============================================================
function printReport(adData) {
  console.log('\n' + '='.repeat(50));
  console.log('📋 에이컷 데일리 마케팅 리포트');
  console.log('='.repeat(50));
  console.log(`📅 ${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}`);
  console.log('');
  
  if (adData) {
    console.log('📊 광고 현황');
    console.log(`  기간: ${adData.period}`);
    console.log(`  비즈머니: ${adData.bizMoney}원`);
    console.log(`  노출: ${adData.impressions} / 클릭: ${adData.clicks} / 전환: ${adData.conversions}`);
    console.log(`  오늘 소진: ${adData.todayCost}원`);
  }
  
  console.log('\n💡 다음 추천 액션');
  
  if (adData && parseInt(adData.conversions) === 0) {
    console.log('  • ⚠️ 전환 추적 상태 확인 필요');
  }
  if (adData && parseInt(adData.bizMoney.replace(',','')) < 50000) {
    console.log('  • 💰 비즈머니 충전 고려 (잔액 5만원 미만)');
  }
  console.log('  • 📝 블로그 포스팅 작성이 필요하면 말씀주세요');
  console.log('  • 📸 인스타그램 게시물 업로드가 필요하면 말씀주세요');
  console.log('='.repeat(50));
}

// ============================================================
#endregion
#region 🚀 메인 실행
// ============================================================
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'full';
  
  console.log('🚀 에이컷 데일리 마케팅 자동화 시작');
  console.log(`   모드: ${mode}`);
  console.log('='.repeat(50));
  
  let adData = null;
  
  const tasks = [];
  
  if (mode === 'full' || mode === 'check' || mode === 'ad') {
    tasks.push(async () => { adData = await checkAdStatus(); });
  }
  
  if (mode === 'full' || mode === 'blog') {
    tasks.push(() => blogNeighborVisit());
  }
  
  if (mode === 'full' || mode === 'sns') {
    tasks.push(() => instaActivity());
  }
  
  if (mode === 'full' || mode === 'sns') {
    tasks.push(() => threadsActivity());
  }
  
  if (mode === 'full' || mode === 'blog') {
    tasks.push(() => searchAdvisorRequest());
  }
  
  // 순차 실행
  for (const task of tasks) {
    await task();
  }
  
  // 리포트
  if (mode === 'full' || mode === 'report' || mode === 'check') {
    printReport(adData);
  }
  
  console.log('\n✅ 데일리 마케팅 자동화 완료!');
  process.exit(0);
}

main().catch(e => {
  console.error('❌ 치명적 오류:', e.message);
  process.exit(1);
});
// ============================================================
#endregion
