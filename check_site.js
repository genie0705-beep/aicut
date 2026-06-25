const https = require('https');
https.get('https://aicut.co.kr/', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const scripts = [...d.matchAll(/src="([^"]+)"/g)].map(m => m[1]);
    console.log('Scripts:', scripts.join(', '));
    
    const title = d.match(/<title>([^<]+)<\/title>/);
    console.log('Title:', title ? title[1] : 'none');
    
    // Check for routes (hash-based or otherwise)
    const hashLinks = [...d.matchAll(/href="#([^"]+)"/g)].map(m => m[1]);
    console.log('Hash routes:', [...new Set(hashLinks)].join(', '));
    
    console.log('Body length:', d.length);
    console.log('First 500 chars:', d.substring(0, 500));
  });
}).on('error', e => console.log('ERR:', e.message));
