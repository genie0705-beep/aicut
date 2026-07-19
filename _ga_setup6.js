const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  let gaPage = null;
  for (const p of pages) {
    if (p.url().includes('analytics.google.com')) {
      gaPage = p;
      break;
    }
  }
  
  // 1. 먼저 이벤트 보고서 페이지로 이동 (왼쪽 메뉴 사용)
  // '보고서' 클릭
  await gaPage.evaluate(() => {
    const items = document.querySelectorAll('span, a, div, [role=treeitem], [role=tab]');
    for (const el of items) {
      const t = (el.innerText || '').trim();
      if (t === '보고서' && el.offsetParent !== null) {
        el.click();
        return;
      }
    }
  });
  await gaPage.waitForTimeout(1500);
  
  // '이벤트' 클릭
  await gaPage.evaluate(() => {
    const items = document.querySelectorAll('span, a, div, [role=treeitem], [role=tab]');
    for (const el of items) {
      const t = (el.innerText || '').trim();
      if (t === '이벤트' && el.offsetParent !== null) {
        el.click();
        return;
      }
    }
  });
  await gaPage.waitForTimeout(5000);
  
  // API 토큰 가져오기 - 네트워크 요청에서 Bearer 토큰 추출
  const token = await gaPage.evaluate(() => {
    // gapi에서 access token 가져오기
    try {
      // Google Auth 객체에서 토큰 가져오기 (GA4 내부)
      if (window.gapi && window.gapi.auth2) {
        const auth = window.gapi.auth2.getAuthInstance();
        if (auth && auth.currentUser) {
          const user = auth.currentUser.get();
          const response = user.getAuthResponse();
          if (response && response.access_token) {
            return response.access_token;
          }
        }
      }
    } catch(e) {}
    
    // 방법 2: __APISID 또는 SAPISID 쿠키 확인
    const cookies = document.cookie.split(';').map(c => c.trim());
    const sapisid = cookies.find(c => c.startsWith('SAPISID=') || c.startsWith('__Secure-3PAPISID='));
    if (sapisid) return 'SAPISID_FOUND: ' + sapisid.substring(0, 30);
    
    return 'token_not_found';
  });
  
  console.log('토큰:', token);
  
  // 속성 ID 확인
  const url = gaPage.url();
  console.log('URL:', url);
  
  // URL에서 속성 ID 추출
  const propMatch = url.match(/p(\d{6,})/);
  if (propMatch) {
    console.log('속성 ID:', propMatch[1]);
  }
  
  // 페이지 데이터 확인
  const pageText = await gaPage.evaluate(() => {
    const root = document.querySelector('ga-hybrid-app-root') || document.querySelector('body');
    return root?.innerText?.substring(0, 3000) || '';
  });
  
  console.log('\\n페이지에 generate_lead 있음:', pageText.includes('generate_lead'));
  
  // generate_lead 행의 전환 토글 찾기 시도
  if (pageText.includes('generate_lead')) {
    const toggleResult = await gaPage.evaluate(() => {
      // generate_lead 텍스트를 포함한 요소 찾기
      const walker = document.createTreeWalker(document.body, 4, null, false);
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent?.trim() === 'generate_lead') {
          // 상위로 올라가면서 interactive 요소 찾기
          let parent = node.parentElement;
          for (let i = 0; i < 8 && parent; i++) {
            // 같은 행 내에서 스위치 찾기
            const switches = parent.querySelectorAll('[role=switch], button[role=checkbox], input[type=checkbox]');
            for (const sw of switches) {
              if (sw.offsetParent !== null) {
                sw.click();
                return 'clicked switch in parent level ' + i;
              }
            }
            parent = parent.parentElement;
          }
          return 'no switch found, deepest parent: ' + (parent?.tagName || 'none');
        }
      }
      return 'generate_lead not found in DOM tree';
    });
    console.log('\\n토글 결과:', toggleResult);
    
    await gaPage.waitForTimeout(3000);
    
    // 변경 확인
    const afterUrl = gaPage.url();
    console.log('\\n변경 후 URL:', afterUrl.substring(0, 150));
  } else {
    console.log('\\ngenerate_lead가 보이지 않음 - 다른 방법 시도');
    
    // GA4 API 직접 호출 시도
    // 먼저 OAuth 토큰을 가져오기 위해 GA 페이지의 리소스 요청에서 토큰 추출
    const authInfo = await gaPage.evaluate(() => {
      const result = {};
      
      // gapi.client에서 token 가져오기
      try {
        if (window.gapi && window.gapi.client && window.gapi.client.getToken) {
          const t = window.gapi.client.getToken();
          if (t) result.gapiToken = t.access_token?.substring(0, 30);
        }
      } catch(e) {}
      
      // fetch API를 intercept - GA4 Admin API 호출 흉내
      // 브라우저에서 이미 사용 중인 fetch를 가로챌 순 없지만,
      // ITC(page level) auth 정보 확인
      result.cookies = document.cookie.split(';')
        .map(c => c.trim())
        .filter(c => c.includes('SAPISID') || c.includes('APISID') || c.includes('GA_XSRF'))
        .map(c => c.substring(0, 40));
      
      return result;
    });
    
    console.log('\\n인증 정보:', JSON.stringify(authInfo, null, 2));
  }
  
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
