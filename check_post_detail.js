const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const postPage = pages[2];
  
  await postPage.goto('https://blog.naver.com/aicut/224348766674', { waitUntil: 'networkidle', timeout: 20000 });
  await postPage.waitForTimeout(5000);
  
  const frameEl = await postPage.$('#mainFrame');
  const frame = await frameEl.contentFrame();
  await frame.waitForTimeout(2000);
  
  const result = await frame.evaluate(() => {
    // 본문 영역 찾기 (네이버 블로그 본문 컨테이너)
    const seSection = document.querySelector('.se-main-container');
    const postView = document.querySelector('.post-view');
    const viewArea = document.querySelector('.se_viewArea, .se-og');
    
    // 다양한 선택자로 본문 찾기
    const contentSelectors = [
      '.se-main-container',
      '.se-section',
      '.post-view',
      '.se_viewArea',
      '.se-og',
      '#postViewArea',
      '.post-content',
      'article',
      '.blogview_content',
    ];
    
    let content = null;
    for (const sel of contentSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.length > 200) {
        content = el;
        break;
      }
    }
    
    const contentText = content ? content.innerText : '';
    const contentHTML = content ? content.innerHTML.substring(0, 500) : '';
    
    // H2 태그 in content
    const h2s = content ? Array.from(content.querySelectorAll('h2')).map(h => h.innerText) : [];
    
    // 이미지 in content
    const imgs = content ? content.querySelectorAll('img').length : 0;
    
    // Bold in content  
    const bolds = content ? content.querySelectorAll('b, strong').length : 0;
    
    return {
      contentFound: !!content,
      contentTextLen: contentText.length,
      contentTextPreview: contentText.substring(0, 300),
      h2InContent: h2s,
      imagesInContent: imgs,
      boldInContent: bolds,
    };
  });
  
  console.log('\n📋 포스트 본문 분석:');
  console.log(JSON.stringify(result, null, 2));
  
  if (result.contentFound && result.contentTextLen > 500) {
    console.log(`\n✅✅✅ 발행 완전 성공!`);
    console.log(`📝 본문 ${result.contentTextLen}자`);
    console.log(`📌 H2 ${result.h2InContent.length}개`);
    console.log(`💪 Bold ${result.boldInContent}개`);
    console.log(`🖼️ 이미지 ${result.imagesInContent}장`);
  } else {
    console.log('\n⚠️ 본문 미발견');
  }
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));
