const https = require('https');

// 1. Check aicut.co.kr current state
https.get('https://aicut.co.kr/', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const title = d.match(/<title>([^<]+)<\/title>/);
    const ghScript = d.includes('github.io');
    const firebaseScript = d.includes('firebase');
    const hasMetaDesc = d.includes('meta name="description"');
    const hasOg = d.includes('og:title');
    
    console.log('=== aicut.co.kr 현재 상태 ===');
    console.log('Title:', title ? title[1] : '없음');
    console.log('GitHub Pages에서 호스팅?', ghScript ? '✅ 예' : '아니오');
    console.log('Firebase 호스팅?', firebaseScript ? '✅ 예' : '아니오');
    console.log('meta description 있음?', hasMetaDesc ? '✅' : '❌ 없음');
    console.log('OG 태그 있음?', hasOg ? '✅' : '❌ 없음');
    console.log('HTML 크기:', d.length, 'bytes');
    console.log('첫 200자:', d.substring(0, 200).replace(/\n/g, ' '));
  });
}).on('error', e => console.log('ERR:', e.message));

// 2. Check Naver search
setTimeout(() => {
  https.get('https://search.naver.com/search.naver?query=aicut.co.kr', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      const hasAicut = d.includes('aicut') || d.includes('에이컷');
      const noResult = d.includes('검색결과가 없') || d.includes('0건');
      console.log('\n=== 네이버 검색: aicut.co.kr ===');
      console.log('aicut 관련 내용 있음?', hasAicut ? '✅' : '❌ 없음');
      console.log('검색결과 없음 메시지?', noResult ? '❌' : '결과 있음');
      if (hasAicut) {
        const snippet = d.substring(d.indexOf('aicut') - 50, d.indexOf('aicut') + 200).replace(/\n/g, ' ');
        console.log('스니펫:', snippet.substring(0, 300));
      }
    });
  }).on('error', e => console.log('Naver search ERR:', e.message));
}, 1000);

// 3. Check Google search
setTimeout(() => {
  https.get('https://www.google.com/search?q=aicut.co.kr', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      const hasAicut = d.includes('aicut') || d.includes('에이컷');
      const noResult = d.includes('did not match') || d.includes('No results');
      console.log('\n=== 구글 검색: aicut.co.kr ===');
      console.log('aicut 관련 내용 있음?', hasAicut ? '✅' : '❌ 없음');
      if (hasAicut) {
        const snippet = d.substring(d.indexOf('aicut') - 50, d.indexOf('aicut') + 200).replace(/\n/g, ' ');
        console.log('스니펫:', snippet.substring(0, 300));
      }
    });
  }).on('error', e => console.log('Google search ERR:', e.message));
}, 2000);
