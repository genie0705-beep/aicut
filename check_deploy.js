const https = require('https');

https.get('https://aicut.co.kr/', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const title = d.match(/<title>([^<]+)<\/title>/);
    const metaDesc = d.match(/<meta name="description" content="([^"]+)"/);
    const hasAicutCoKtText = d.includes('월정기');
    const isGithub = d.includes('github.io');
    const hasLandingText = d.includes('숏폼 전문') || d.includes('편집부터 납품까지');
    const hasPricing = d.includes('요금제') && d.includes('30만원');
    
    console.log('=== aicut.co.kr 현재 ===');
    console.log('Title:', title ? title[1] : '없음');
    console.log('Description:', metaDesc ? metaDesc[1].substring(0, 100) : '없음');
    console.log('GitHub Pages?', isGithub ? '예 (아직 SPA)' : '아니오');
    console.log('새 HTML(index.html) 반영됨?', hasLandingText ? '✅ 예' : '❌ 아니오 (아직 예전 SPA)');
    console.log('요금제 정보 있음?', hasPricing ? '✅' : '❌');
    console.log('페이지 크기:', (d.length / 1024).toFixed(0), 'KB');
    console.log('첫 100자:', d.substring(0, 100).replace(/\n/g, ' '));
  });
}).on('error', e => console.log('ERR:', e.message));

// Also check Firebase hosting directly
setTimeout(() => {
  https.get('https://aicut-28ab5.web.app/', (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      const hasLandingText = d.includes('숏폼 전문') || d.includes('에이컷이 매월');
      console.log('\n=== Firebase 호스팅 확인 (aicut-28ab5.web.app) ===');
      console.log('상태코드:', res.statusCode);
      console.log('새 HTML 있음?', hasLandingText ? '✅ 예' : '❌ 아니오');
      console.log('처음 200자:', d.substring(0, 200).replace(/\n/g, ' '));
    });
  }).on('error', e => console.log('Firebase ERR:', e.message));
}, 2000);

// Also check the Naver search one more time
setTimeout(() => {
  // First check what's returned for aicut.co.kr in Naver
  https.get('https://search.naver.com/search.naver?query=%EC%97%90%EC%9D%B4%EC%BB%B7', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  }, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      const hasBlog = d.includes('blog.naver.com/aicut');
      const hasSite = d.includes('aicut.co.kr');
      console.log('\n=== 네이버: 에이컷 검색 ===');
      console.log('블로그 노출?', hasBlog ? '✅' : '❌');
      console.log('aicut.co.kr 노출?', hasSite ? '✅' : '❌');
    });
  }).on('error', e => console.log('Naver ERR:', e.message));
}, 4000);
