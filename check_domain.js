const https = require('https');

// Check Firebase hosting custom domain status
const options = {
  hostname: 'firebasehosting.googleapis.com',
  path: '/v1beta1/sites/aicut-28ab5/versions',
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
};

// Check what aicut.co.kr DNS resolves to
const dns = require('dns');
dns.resolve('aicut.co.kr', 'A', (err, addresses) => {
  if (err) {
    console.log('DNS A 레코드:', err.code);
  } else {
    console.log('aicut.co.kr A 레코드:', addresses.join(', '));
  }
});

dns.resolve('aicut.co.kr', 'CNAME', (err, addresses) => {
  if (!err) {
    console.log('aicut.co.kr CNAME:', addresses.join(', '));
  }
});

// Check Firebase hosting URL directly
https.get('https://aicut-28ab5.web.app/', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const title = d.match(/<title>([^<]+)<\/title>/);
    const hasNav = d.includes('AICUT') && d.includes('서비스') && d.includes('요금제');
    console.log('\n=== Firebase 호스팅 (aicut-28ab5.web.app) ===');
    console.log('Title:', title ? title[1] : '없음');
    console.log('새 HTML(index.html) 정상?:', hasNav ? '✅ 완전한 페이지' : '❌ 문제 있음');
    console.log('크기:', (d.length / 1024).toFixed(0), 'KB');
  });
}).on('error', e => console.log('Firebase ERR:', e.message));

// Check what aicut.co.kr actually serves
https.get('https://aicut.co.kr/', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const isOldSPA = d.includes('react') || d.includes('createRoot') || d.includes('_reactRoot');
    const isNewHTML = d.includes('월정기') && d.includes('요금제') && d.includes('무료 상담');
    
    console.log('\n=== aicut.co.kr (실제 서빙 중인 페이지) ===');
    console.log('React SPA?', isOldSPA ? '✅ 예 (구버전)' : '아니오');
    console.log('우리가 만든 새 HTML?', isNewHTML ? '✅ 예' : '❌ 아니오');
    console.log('크기:', (d.length / 1024).toFixed(0), 'KB');
    
    if (isOldSPA) {
      console.log('\n⚠️ aicut.co.kr가 아직 GitHub Pages를 가리키고 있습니다.');
      console.log('Firebase에 배포는 됐지만, 도메인 연결이 안 된 상태예요.');
      console.log('\nFirebase 콘솔에서 도메인 연결을 해야 합니다:');
      console.log('1. https://console.firebase.google.com 접속');
      console.log('2. aicut-28ab5 프로젝트 선택');
      console.log('3. Hosting 메뉴 → Add custom domain');
      console.log('4. aicut.co.kr 입력');
      console.log('5. 안내되는 DNS 레코드를 도메인 등록업체에 추가');
    }
  });
}).on('error', e => console.log('aicut.co.kr ERR:', e.message));
