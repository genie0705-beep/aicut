const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  await page.goto('https://searchadvisor.naver.com/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  // '에이컷' 요소 분석
  const info = await page.evaluate(() => {
    const result = {};
    
    // '에이컷' 텍스트를 가진 모든 요소 찾기
    const walker = document.createTreeWalker(document.body, 4, null, false);
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent?.trim() === '에이컷') {
        // 상위로 올라가면서 href, role, onclick 등 확인
        let el = node.parentElement;
        for (let i = 0; i < 5 && el; i++) {
          const tag = el.tagName;
          const href = el.getAttribute('href') || '';
          const role = el.getAttribute('role') || '';
          const onclick = el.getAttribute('onclick') || '';
          const routerLink = el.getAttribute('ng-reflect-router-link') || el.getAttribute('routerlink') || '';
          
          if (href || role || onclick || routerLink || tag === 'A') {
            result.found = { level: i, tag, href: href.substring(0, 150), role, onclick: onclick.substring(0, 100), routerLink: routerLink.substring(0, 100) };
            break;
          }
          el = el.parentElement;
        }
        
        if (!result.found) {
          result.found = { level: 4, tag: el?.tagName, html: el?.outerHTML?.substring(0, 300) };
        }
        break;
      }
    }
    
    // 모든 앵커 태그에서 에이컷 관련 찾기
    const allLinks = document.querySelectorAll('a');
    for (const a of allLinks) {
      const t = (a.innerText || '').trim();
      if (t === '에이컷') {
        result.aLink = {
          href: a.getAttribute('href')?.substring(0, 150),
          routerLink: a.getAttribute('ng-reflect-router-link') || a.getAttribute('routerlink') || '',
          onclick: a.getAttribute('onclick')?.substring(0, 100),
          target: a.getAttribute('target'),
          className: a.className?.substring(0, 40)
        };
        break;
      }
    }
    
    return result;
  });
  
  console.log('에이컷 요소 정보:', JSON.stringify(info, null, 2));
  
  // 사이트 URL 직접 접근 시도
  // searchadvisor.naver.com/console/site/{siteId} 형식
  // 아니면 최근 사이트 목록 API 호출
  const navUrls = await page.evaluate(() => {
    return document.querySelectorAll('[class*=site], [class*=domain], .site-item, .domain-item');
  });
  
  // 네트워크 요청 확인을 위한 라우트 설정
  await page.route('**/api/**', route => {
    console.log('API 호출:', route.request().url().substring(0, 150));
    route.continue();
  });
  
  // '에이컷' 직접 클릭 (더 정확한 방법)
  await page.evaluate(() => {
    const els = document.querySelectorAll('a, [role=button], button, span');
    for (const el of els) {
      const t = (el.innerText || '').trim();
      if (t === '에이컷' && el.offsetParent !== null) {
        // parent 중 a 태그 찾기
        let parent = el.parentElement;
        while (parent && parent.tagName !== 'A') {
          parent = parent.parentElement;
        }
        if (parent && parent.tagName === 'A') {
          const href = parent.getAttribute('href');
          console.log('찾은 href:', href);
          parent.click();
          return;
        }
        el.click();
        return;
      }
    }
  });
  
  await page.waitForTimeout(5000);
  
  const finalUrl = page.url();
  console.log('\\n클릭 후 URL:', finalUrl.substring(0, 200));
  const finalText = await page.evaluate(() => document.body?.innerText?.substring(0, 1000) || '');
  console.log('\\n=== 내용 ===');
  console.log(finalText.substring(0, 500));
  
  await page.close();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
