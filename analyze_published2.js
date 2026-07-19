const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const postPage = pages[2]; // 224348766674
  
  await postPage.bringToFront();
  await postPage.goto('https://blog.naver.com/aicut/224348766674', { waitUntil: 'networkidle', timeout: 20000 });
  await postPage.waitForTimeout(5000);
  
  // iframe 찾기
  const frameEl = await postPage.$('#mainFrame');
  if (frameEl) {
    const frame = await frameEl.contentFrame();
    if (frame) {
      await frame.waitForTimeout(2000);
      
      const result = await frame.evaluate(() => {
        // 포스트 내용 추출
        const bodyText = document.body.innerText || '';
        const title = document.querySelector('.se-title, h1, h2, [class*="title"]');
        const content = document.querySelector('.se-main-container, .se-section, [class*="content"], article, .post-view');
        const imgs = Array.from(document.querySelectorAll('img'));
        const blogImgs = imgs.filter(img => (img.src||'').includes('blogfiles'));
        
        // H2 태그 확인
        const h2s = Array.from(document.querySelectorAll('h2')).map(h => h.innerText.substring(0, 30));
        
        // Bold 태그 확인
        const bolds = document.querySelectorAll('b, strong').length;
        
        return {
          title: title?.innerText || document.title || '(없음)',
          bodyTextLen: bodyText.length,
          bodyPreview: bodyText.substring(0, 500),
          images: blogImgs.length,
          h2Tags: h2s,
          boldCount: bolds,
          hasContent: content ? (content.innerText || '').length : 0,
        };
      });
      
      console.log('📋 iframe 내 포스트 분석:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.bodyTextLen > 1000) {
        console.log('\n✅✅✅ 텍스트 정상 표시됨! (' + result.bodyTextLen + '자)');
        console.log('H2 ' + result.h2Tags.length + '개, Bold ' + result.boldCount + '개');
      } else {
        console.log('\n⚠️ 텍스트 ' + result.bodyTextLen + '자 - 확인 필요');
      }
      
      process.exit(0);
    }
  }
  
  // iframe 없으면 본 페이지에서 확인
  const result2 = await postPage.evaluate(() => {
    return {
      title: document.title,
      bodyLen: document.body.innerText.length,
      body: document.body.innerText.substring(0, 300),
    };
  });
  console.log('iframe 없음, 본문:', JSON.stringify(result2));
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));
