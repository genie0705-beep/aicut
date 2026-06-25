const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  // Find or create editor tab
  let page;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm')) { page = p; break; }
  }
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
  }
  
  await page.bringToFront();
  await page.waitForTimeout(2000);
  
  // Step 1: Set correct title
  console.log('=== 제목 변경 ===');
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('영상편집 클린트 5번, 수정 요청 30회... 프리랜서 편집러와 작별한 이유');
  });
  console.log('✅ 제목 변경 완료');
  
  // Step 2: Find the EXACT contenteditable area and paste
  console.log('\n=== 본문 붙여넣기 ===');
  
  const bodyText = '💭 "클린트만 5번 돌렸는데 마음에 안 든다고?"\n💭 "수정 요청 30회, 편집자가 연락 두절"\n💭 "이번 달 편집자, 또 바꿔야 하나?"\n\n영상 편집 아웃소싱을 해본 브랜드라면 누구나 한 번쯤 겪는 상황입니다.\n\n😤 프리랜서 편집러, 왜 자꾸 바꾸게 될까?\n\n① 클린트 무한 반복\n매번 다른 의견, 다른 결과. 클린트 5번 돌려도 안 맞는 건 편집자의 문제가 아니라 시스템의 문제입니다.\n\n② 매달 새로운 편집자 찾기\n이번 달 괜찮았던 편집자, 다음 달엔 이미 다른 프로젝트. 이 과정이 매달 반복됩니다.\n\n③ 소통 비용 > 편집 비용\n편집자와의 소통 시간이 실제 편집 비용보다 더 큽니다.\n\n💡 에이컷이 해결한 방법 (전담 에디터 시스템)\n\n👤 전담 에디터 고정 배정: 한 번 배정된 에디터는 변경 요청이 없는 한 계속 같은 분이 작업합니다.\n📋 브랜드 가이드 저장: 색상/폰트/BGM 한 번 등록, 이후 설명 불필요\n⚡ 48시간 기본 납기: 가이드 기반 작업으로 리드타임 단축\n\n📊 바뀐 결과\n편집자 교체 주기: 매월 → 고정 배정\n클린트 횟수: 5~7회 → 1~2회\n소통 시간: 주 8시간 → 1시간 이내\n납기 준수율: 60% → 98%\n\n👉 카카오톡 채널: 에이컷\n👉 이메일: contact@aicut.co.kr\n👉 홈페이지: aicut.co.kr';
  
  // Copy to clipboard
  await page.evaluate((t) => navigator.clipboard.writeText(t), bodyText);
  await page.waitForTimeout(500);
  
  // Find the exact contenteditable and focus it
  const focusResult = await page.evaluate(() => {
    // Find all contenteditable elements
    const editables = document.querySelectorAll('[contenteditable="true"], [contenteditable=""]');
    let result = [];
    editables.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const tag = el.tagName;
      const cls = (el.className || '').substring(0, 30);
      // Check if it's the main content area (not title)
      if (r.width > 100 && r.height > 50) {
        result.push({ idx: i, tag, cls, x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), w: Math.round(r.width), h: Math.round(r.height) });
      }
    });
    return result;
  });
  
  console.log('Contenteditable areas:', JSON.stringify(focusResult));
  
  if (focusResult.length > 0) {
    // Click on the largest contenteditable area (the body)
    const target = focusResult.sort((a, b) => b.w * b.h - a.w * a.h)[0];
    console.log(`Focusing on (${target.x}, ${target.y}) ${target.w}x${target.h}`);
    
    await page.mouse.click(target.x, target.y);
    await page.waitForTimeout(800);
    
    // Select all and clear first (to remove placeholder)
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(300);
    await page.keyboard.press('Delete');
    await page.waitForTimeout(500);
    
    // Paste
    await page.keyboard.press('Control+v');
    await page.waitForTimeout(3000);
    console.log('✅ 붙여넣기 완료');
  } else {
    console.log('❌ Contenteditable 영역을 찾을 수 없음');
  }
  
  // Check result
  const check = await page.evaluate(() => {
    const w = document.querySelector('.se-components-wrap');
    const text = w ? w.innerText : '';
    return {
      length: text.length,
      hasContent: text.length > 100,
      hasKeywords: text.includes('클린트') || text.includes('프리랜서'),
      preview: text.substring(0, 100)
    };
  });
  console.log('\n=== 확인 ===');
  console.log(JSON.stringify(check));
  
  // Save
  if (check.hasContent) {
    console.log('\n=== 저장 ===');
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
      }
      document.querySelector('.save_btn__bzc5B')?.click();
    });
    await page.waitForTimeout(3000);
    console.log('✅ 저장 완료');
    
    // Add hashtags
    await page.evaluate(() => {
      const tags = '#영상편집외주 #프리랜서편집 #영상편집대행 #에이컷 #AICUT #전담에디터 #48시간납품 #영상편집 #숏폼제작 #릴스편집 #영상제작 #콘텐츠마케팅 #영상마케팅 #SNS영상 #마케팅영상 #브랜드영상 #편집외주 #영상편집비용 #영상편집서비스 #영상편집월정액 #클린트 #수정요청 #브랜드가이드 #전담매니저 #숏폼마케팅 #유튜브편집 #쇼츠제작 #인스타릴스 #영상편집전문 #콘텐츠제작';
      const inputs = document.querySelectorAll('input');
      for (const inp of inputs) {
        if ((inp.placeholder || '').includes('태그')) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(inp, tags);
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
          return 'done';
        }
      }
      return 'no tag input';
    });
    await page.waitForTimeout(2000);
    console.log('✅ 해시태그 완료');
    
    // Save again
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
      }
    });
    await page.waitForTimeout(3000);
    console.log('✅ 최종 저장 완료');
  }
  
  await page.screenshot({ path: 'blog_v1_body_done.png' });
  await b.close();
})();
