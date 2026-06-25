const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  // Find the tab with 5 images
  let targetPage = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm')) {
      await p.bringToFront();
      await p.waitForTimeout(800);
      const imgCount = await p.evaluate(() => {
        const html = document.querySelector('.se-components-wrap')?.innerHTML || '';
        return (html.match(/<img/gi) || []).length;
      });
      if (imgCount === 5) {
        targetPage = p;
        break;
      }
    }
  }
  
  if (!targetPage) {
    console.log('Tab with 5 images not found');
    await browser.close();
    return;
  }
  
  console.log('Found tab with 5 images');
  await targetPage.bringToFront();
  await targetPage.waitForTimeout(2000);
  
  // Get image URLs
  const imgInfo = await targetPage.evaluate(() => {
    const wrap = document.querySelector('.se-components-wrap');
    const allImgs = wrap.querySelectorAll('img');
    const urls = [];
    allImgs.forEach(img => {
      urls.push({
        src: img.getAttribute('src') || img.src || '',
        alt: img.alt || ''
      });
    });
    
    // Get the full HTML structure to understand component order
    const fullHtml = wrap.innerHTML;
    
    return { urls, htmlLength: fullHtml.length };
  });
  
  console.log('Found', imgInfo.urls.length, 'images');
  imgInfo.urls.forEach((u, i) => {
    console.log('Image', i+1, ':', u.src.substring(0, 80));
  });
  
  // The 5 images are already in the editor in the order 정이사님이 uploaded them
  // We need to insert text between them
  
  // Build section-by-section HTML to paste between images
  // Each section will be pasted one at a time after clicking between images
  
  const sections = [
    // Section 0: Intro (before first image)
    '<p style="text-align: center; line-height: 1.8;">💭 "클린트만 5번 돌렸는데 마음에 안 든다고?"<br>💭 "수정 요청 30회, 편집자가 연락 두절"<br>💭 "이번 달 편집자, 또 바꿔야 하나?"</p><p style="text-align: center;"><br></p><p style="text-align: center; line-height: 1.8;">영상 편집 아웃소싱을 해본 브랜드라면<br>누구나 한 번쯤 겪는 상황입니다.</p>',
    
    // Section 1: Problem (after image 1 - thumbnail)
    '<h2 style="text-align: center; font-size: 22px; margin: 30px 0 20px;">😤 프리랜서 편집러, 왜 자꾸 바꾸게 될까?</h2><p style="text-align: center; line-height: 1.8;"><strong>영상 편집 프리랜서</strong>를 고용해본 분들은 다음 같은 경험을 해보셨을 겁니다.</p><p style="text-align: center;"><br></p><h3 style="text-align: center; font-size: 18px; margin: 20px 0;">① 클린트 무한 반복</h3><p style="text-align: center; line-height: 1.8;">매번 다른 의견, 매번 다른 결과. <strong>클린트</strong> 5번 돌려도 원하는 느낌이 안 나오는 건 편집자의 문제가 아니라 <strong>시스템의 문제</strong>입니다.</p><h3 style="text-align: center; font-size: 18px; margin: 20px 0;">② 매달 새로운 편집자 찾기</h3><p style="text-align: center; line-height: 1.8;">이번 달 괜찮았던 편집자, 다음 달엔 이미 다른 프로젝트. 또 구인 공고, 또 교육. 이 과정이 매달 반복됩니다.</p><h3 style="text-align: center; font-size: 18px; margin: 20px 0;">③ 소통 비용 &gt; 편집 비용</h3><p style="text-align: center; line-height: 1.8;"><strong>편집자와의 소통</strong>에 들어가는 시간이 실제 편집 비용보다 더 큽니다.</p>',
    
    // Section 2: Solution (after image 2 - problem)
    '<h2 style="text-align: center; font-size: 22px; margin: 30px 0 20px;">💡 에이컷이 해결한 방법 (전담 에디터 시스템)</h2><p style="text-align: center; line-height: 1.8;">에이컷은 프리랜서 편집러의 문제를 <strong>시스템으로 해결</strong>했습니다.</p><p style="text-align: center;"><br></p><h3 style="text-align: center; font-size: 18px; margin: 20px 0;">👤 전담 에디터 고정 배정</h3><p style="text-align: center; line-height: 1.8;">한 번 배정된 에디터는 변경 요청이 없는 한 계속 같은 분이 작업합니다.</p><h3 style="text-align: center; font-size: 18px; margin: 20px 0;">📋 브랜드 가이드 저장</h3><p style="text-align: center; line-height: 1.8;">색상/폰트/BGM을 한 번 등록하면 다음 작업부터 설명이 필요 없습니다.</p><h3 style="text-align: center; font-size: 18px; margin: 20px 0;">⚡ 48시간 기본 납기</h3><p style="text-align: center; line-height: 1.8;">가이드 기반 작업으로 리드타임이 획기적으로 줄어듭니다.</p>',
    
    // Section 3: Results (after image 3 - solution)
    '<h2 style="text-align: center; font-size: 22px; margin: 30px 0 20px;">📊 바뀐 결과</h2><p style="text-align: center; line-height: 1.8;">에이컷 도입 후 고객사들의 변화입니다. <strong>편집자 교체 주기</strong> 매월 → 고정 배정, <strong>클린트 횟수</strong> 5~7회 → 1~2회, <strong>소통 시간</strong> 주 8시간 → 1시간 이내, <strong>납기 준수율</strong> 60% → 98%.</p>',
    
    // Section 4: CTA text (after image 4 - results)
    '<h2 style="text-align: center; font-size: 22px; margin: 30px 0 20px;">🎯 이런 분들께 추천합니다</h2><p style="text-align: center; line-height: 1.8;">매달 다른 편집자에게 브랜드를 설명해야 하는 분, 클린트 피드백에 지친 마케터, 납기 지연으로 광고 일정이 밀리는 분, 브랜드 톤 일관성이 중요한 기업.</p><p style="text-align: center;"><br></p><h2 style="text-align: center; font-size: 22px; margin: 30px 0 20px;">👀 지금 확인해보세요</h2><p style="text-align: center; line-height: 1.8;">프리랜서 편집러와의 끝없는 소통, 이제는 시스템에 맡기세요. <strong>에이컷 무료 상담</strong>에서 업종과 월 제작량에 맞는 플랜을 전담 매니저가 직접 안내해드립니다.</p><p style="text-align: center;"><br></p><p style="text-align: center; line-height: 1.8;">👉 <strong>카카오톡 채널:</strong> 에이컷<br>👉 <strong>이메일:</strong> contact@aicut.co.kr<br>👉 <strong>홈페이지:</strong> aicut.co.kr</p>'
  ];
  
  // Now we need to add text AFTER each image
  // The images are in the editor as <figure> components
  // We need to click after each figure and paste
  
  for (let i = 0; i < sections.length; i++) {
    console.log('Pasting section', i+1, 'of', sections.length);
    
    // Set clipboard
    await targetPage.evaluate((html) => {
      navigator.clipboard.writeText(html);
    }, sections[i]);
    await targetPage.waitForTimeout(300);
    
    // Click at a position where text should go
    // After image i, click at (400, 300 + i*150) roughly
    const yPos = 350 + (i * 250);
    await targetPage.mouse.click(400, Math.min(yPos, 1800));
    await targetPage.waitForTimeout(800);
    
    // Paste
    await targetPage.keyboard.press('Control+v');
    await targetPage.waitForTimeout(2000);
    
    console.log('  Pasted');
  }
  
  // Take final screenshot
  await targetPage.screenshot({ path: 'blog_image_text_ordered.png', fullPage: true });
  
  console.log('\n=== 완료! 본문+이미지 순서 정리 완료 ===');
  console.log('에디터 화면 확인 후 저장/발행 버튼을 눌러주세요.');
  
  await browser.close();
})();
