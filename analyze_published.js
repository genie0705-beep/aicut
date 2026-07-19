const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const postPage = pages[2]; // blog.naver.com/aicut/224348766674
  
  await postPage.bringToFront();
  await postPage.reload();
  await postPage.waitForTimeout(3000);
  
  const result = await postPage.evaluate(() => {
    // 1. 메인 콘텐츠 영역 찾기
    const mainContent = document.querySelector('#main-frame, .se-main-container, .post-view, .se_viewArea, [class*="post"], [class*="view"], article');
    
    if (!mainContent) return { error: 'no content area found' };
    
    // 2. 텍스트 추출
    const bodyText = document.body.innerText || '';
    const textLen = bodyText.length;
    const textPreview = bodyText.substring(0, 500);
    
    // 3. 이미지 확인
    const imgs = Array.from(document.querySelectorAll('img')).filter(img => {
      const src = img.src || '';
      return src.includes('blogfiles') || src.includes('aicut');
    });
    
    // 4. 제목 확인
    const title = document.title || '';
    
    // 5. iframe 내용 확인
    const iframe = document.querySelector('#mainFrame');
    let iframeText = '';
    if (iframe) {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) iframeText = (doc.body?.innerText || '').substring(0, 200);
      } catch(e) { iframeText = 'iframe 접근 불가'; }
    }
    
    return {
      url: location.href,
      title,
      bodyTextLen: textLen,
      bodyPreview: textPreview.substring(0, 200),
      images: imgs.length,
      hasIframe: !!iframe,
      iframeText: iframeText.substring(0, 100),
    };
  });
  
  console.log('📋 발행된 포스트 분석:');
  console.log(JSON.stringify(result, null, 2));
  
  // 텍스트 표시 여부 확인
  if (result.bodyTextLen > 500) {
    console.log('\n✅ 텍스트 정상 표시됨! 본문 ' + result.bodyTextLen + '자');
  } else {
    console.log('\n⚠️ 텍스트 표시 의심: ' + result.bodyTextLen + '자');
  }
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));
