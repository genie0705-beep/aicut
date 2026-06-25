const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  // 발행된 글 열기
  await page.goto('https://blog.naver.com/aicut/224322110674', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const url = page.url();
  console.log('Post URL:', url);
  
  // iframe 내부 확인
  const frames = page.frames();
  console.log('Frames:', frames.length);
  console.log('Main frame URL:', frames[0].url().substring(0, 100));
  
  // 수정 버튼 찾기 - 모든 텍스트 검색
  const editInfo = await page.evaluate(() => {
    const body = document.body;
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_ALL, null, false);
    let node;
    const results = [];
    while (node = walker.nextNode()) {
      const text = (node.innerText || '').trim();
      const tag = node.tagName || '';
      if (text === '수정' && tag === 'A') {
        const r = node.getBoundingClientRect();
        if (r.width > 0) {
          results.push({ href: node.href || '', x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });
        }
      }
    }
    // Also check all iframes
    const iframes = document.querySelectorAll('iframe');
    results.push('iframes: ' + iframes.length);
    iframes.forEach(f => results.push('  ' + (f.src || f.id || '').substring(0, 100)));
    return results;
  });
  
  console.log('Edit info:', JSON.stringify(editInfo, null, 2));
  
  // Try known edit URLs
  const editUrls = [
    'https://blog.naver.com/PostEdit.naver?blogId=aicut&logNo=224322110674',
    'https://blog.naver.com/PostWriteForm.naver?blogId=aicut&logNo=224322110674&mode=edit',
    'https://blog.naver.com/PostWrite.naver?blogId=aicut&logNo=224322110674'
  ];
  
  for (const eu of editUrls) {
    console.log('\n--- Trying:', eu.substring(0, 100));
    await page.goto(eu, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);
    console.log('Result URL:', page.url().substring(0, 120));
    
    const text = await page.evaluate(() => document.body.innerText);
    if (text.includes('클린트') || text.includes('SmartEditor') || text.includes('사진')) {
      console.log('✅ EDIT MODE FOUND!');
      await page.screenshot({ path: 'edit_mode_found.png' });
      
      // 본문 끝에 해시태그 추가
      const clickPos = await page.evaluate(() => {
        const content = document.querySelector('.se-content');
        if (content) {
          const r = content.getBoundingClientRect();
          return { x: r.x + 100, y: r.y + r.height - 50 };
        }
        return null;
      });
      
      if (clickPos) {
        await page.mouse.click(clickPos.x, clickPos.y);
        await page.waitForTimeout(800);
        await page.keyboard.press('End');
        await page.waitForTimeout(300);
        
        const tagsText = '\n\n#영상편집외주 #프리랜서편집 #영상편집대행 #에이컷 #AICUT #전담에디터 #48시간납품 #영상편집 #숏폼제작 #릴스편집 #영상제작 #콘텐츠마케팅 #영상마케팅 #SNS영상 #마케팅영상 #브랜드영상 #편집외주 #영상편집비용 #영상편집서비스 #영상편집월정액 #클린트 #수정요청 #브랜드가이드 #전담매니저 #숏폼마케팅 #유튜브편집 #쇼츠제작 #인스타릴스 #영상편집전문 #콘텐츠제작';
        await page.keyboard.type(tagsText, { delay: 2 });
        await page.waitForTimeout(2000);
        console.log('✅ 해시태그 본문 추가 완료');
      }
      
      // 저장
      await page.evaluate(() => document.querySelector('.save_btn__bzc5B')?.click());
      await page.waitForTimeout(3000);
      console.log('✅ 저장 완료');
      break;
    }
  }
  
  await b.close();
})();
