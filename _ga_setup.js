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
  
  // GA4 브라우저에서 OAuth 토큰과 속성 정보 가져오기
  const tokens = await gaPage.evaluate(() => {
    const result = {};
    
    // Google OAuth 토큰 찾기
    try {
      if (window.gapi && window.gapi.auth2) {
        const auth2 = window.gapi.auth2.getAuthInstance();
        if (auth2) {
          const user = auth2.currentUser.get();
          const authResp = user.getAuthResponse();
          result.tokenFound = !!authResp.access_token;
          if (authResp.access_token) {
            result.tokenStart = authResp.access_token.substring(0, 20);
          }
        }
      }
    } catch(e) {
      result.authError = e.message;
    }
    
    // 쿠키 확인
    result.cookieKeys = document.cookie.split(';').map(c => c.split('=')[0].trim()).filter(k => k.includes('GA') || k.includes('oauth') || k.includes('token') || k.includes('SAPISID') || k.includes('APISID')).slice(0, 10);
    
    // sessionStorage에서 GA config 찾기
    try {
      const ssKeys = Object.keys(sessionStorage).filter(k => k.includes('google') || k.includes('ga') || k.includes('oauth'));
      result.ssKeys = ssKeys.slice(0, 10);
      // sessionStorage 값 읽기
      for (const key of ssKeys.slice(0, 3)) {
        const val = sessionStorage.getItem(key);
        if (val && val.length < 200) result['ss_' + key] = val;
      }
    } catch(e) {}
    
    // 페이지 제목과 URL에서 속성 ID 추출
    result.pageUrl = window.location.href;
    result.pageTitle = document.title;
    
    // meta 태그에서 GA ID 찾기
    const metas = document.querySelectorAll('meta');
    for (const m of metas) {
      const content = m.getAttribute('content') || '';
      if (content.includes('G-') || content.includes('UA-') || content.match(/^\d+$/)) {
        result.metaContent = content;
      }
    }
    
    return result;
  }).catch(e => ({error: e.message}));
  
  console.log('=== 토큰 정보 ===');
  console.log(JSON.stringify(tokens, null, 2));
  
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
