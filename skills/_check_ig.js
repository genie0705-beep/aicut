// 인스타그램 피드 업로드 - 부동산 블로그 요약
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // Instagram 탭 찾기 또는 새로 열기
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('instagram.com')) {
      page = p;
      break;
    }
  }
  
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
  }
  
  console.log('현재 URL:', page.url());
  const bodyText = await page.evaluate(() => (document.body.innerText || '').slice(0, 500));
  console.log('Body:', bodyText);
  
  // 로그인 상태 확인
  const loginStatus = await page.evaluate(() => {
    // 프로필/로그인 링크 확인
    const links = Array.from(document.querySelectorAll('a, span, div')).map(el => ({
      text: (el.innerText || '').trim().slice(0, 30),
      href: el.href || '',
      cls: typeof el.className === 'string' ? el.className.slice(0, 40) : '',
    }));
    
    // "로그인" 또는 "profile" 관련 텍스트 찾기
    const loginLink = links.find(l => l.text.includes('로그인') || l.text.includes('Log in'));
    const profileLink = links.find(l => l.text.includes('aicut') || l.href.includes('aicut.official'));
    
    return {
      isLoggedIn: !!profileLink,
      hasLoginLink: !!loginLink,
      sampleLinks: links.slice(0, 10),
    };
  });
  console.log('로그인 상태:', JSON.stringify(loginStatus, null, 2));
  
  await page.screenshot({ path: 'debug_ig_status.png', fullPage: true });
  console.log('✅ 스크린샷 저장');
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));
