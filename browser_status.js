const { chromium } = require('playwright');
async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  console.log('=== 브라우저 현황 (9223포트) ===');
  console.log('전체 탭 수:', pages.length);
  console.log('');
  
  pages.forEach((p, i) => {
    const url = p.url();
    const title = p.url().includes('naver.com') ? url.split('/').slice(3).join('/') : url;
    let status = '';
    if (url.includes('PostWriteForm')) status = '📝 블로그 에디터';
    else if (url.includes('ads.naver.com')) status = '📊 광고센터';
    else if (url.includes('blog.naver.com/aicut')) status = '📋 블로그 메인';
    else if (url.includes('naver.com')) status = '🌐 네이버';
    else status = '🔄 기타';
    
    console.log(`[${i}] ${status}`);
    console.log(`    URL: ${url.substring(0, 100)}`);
    console.log('');
  });
  
  await b.close();
}
run().catch(e => console.error('❌', e.message));
