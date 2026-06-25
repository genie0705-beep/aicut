const https = require('https');

function checkUrl(url, label) {
  https.get(url, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      // Check critical indicators
      const hasAicutInTitle = d.includes('AICUT');
      const hasNewNav = d.includes('무료로 시작하기') && d.includes(''서비스');
      const hasOldSPA = d.includes('createRoot') || d.includes('_reactRoot') || d.includes('React');
      const hasOurPricing = d.includes('30만원') && d.includes('50만원') && d.includes('100만원');
      const hasGithubIo = d.includes('github.io');
      
      console.log('=== ' + label + ' ===');
      console.log('Server:', res.headers['server'] || 'unknown');
      console.log('Content-Type:', res.headers['content-type'] || 'unknown');
      console.log('Content-Length:', res.headers['content-length'] || (d.length + ' (actual)'));
      console.log('Our index.html (pricing)?', hasOurPricing ? '✅ YES' : 'NO');
      console.log('Old React SPA?', hasOldSPA ? 'YES' : 'NO');
      console.log('Contains github.io?', hasGithubIo ? 'YES' : 'NO');
      console.log('First 150 chars:', d.substring(0, 150).replace(/\n/g, ' '));
      console.log('');
    });
  }).on('error', e => console.log(label + ' ERR:', e.message));
}

checkUrl('https://aicut.co.kr/', 'aicut.co.kr');
checkUrl('https://aicut-28ab5.web.app/', 'Firebase (aicut-28ab5.web.app)');
checkUrl('https://genie0705-beep.github.io/aicut/', 'GitHub Pages');
