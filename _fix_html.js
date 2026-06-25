const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  let targetPage = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm')) {
      await p.bringToFront();
      await p.waitForTimeout(300);
      const cnt = await p.evaluate(() => document.querySelector('.se-components-wrap')?.querySelectorAll('img').length || 0);
      if (cnt >= 4) { targetPage = p; break; }
    }
  }
  
  if (!targetPage) { console.log('Not found'); process.exit(1); }
  
  await targetPage.bringToFront();
  await targetPage.waitForTimeout(2000);
  
  // Step 1: Clear the bad HTML text content from editor
  console.log('=== 에디터 초기화 ===');
  
  const cleared = await targetPage.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      if (ed && ed.getBody) {
        // Try to use SmartEditor API to clear body
        ed.setBody('<p><br></p>');
        return 'setBody used';
      }
    } catch(e) {}
    
    // Fallback: find and clear the contenteditable
    const contentEditable = document.querySelector('[contenteditable]');
    if (contentEditable) {
      contentEditable.innerHTML = '<p><br></p>';
      return 'contenteditable cleared';
    }
    
    // Try se-components-wrap
    const wrap = document.querySelector('.se-components-wrap');
    if (wrap) {
      // Remove all child components except images
      const toRemove = [];
      for (const child of wrap.children) {
        const tag = child.tagName.toLowerCase();
        const hasImg = child.querySelector('img') !== null;
        // Keep: title section and image components
        if (!hasImg && !child.classList.contains('se-documentTitle')) {
          toRemove.push(child);
        }
      }
      toRemove.forEach(el => el.remove());
      return 'removed ' + toRemove.length + ' non-image components';
    }
    
    return 'nothing cleared';
  });
  console.log('Clear result:', cleared);
  await targetPage.waitForTimeout(1000);
  
  // Step 2: Take a screenshot after clearing
  await targetPage.screenshot({ path: 'after_clear.png' });
  
  // Step 3: Check current state
  const afterClear = await targetPage.evaluate(() => {
    const w = document.querySelector('.se-components-wrap');
    return {
      text: (w ? w.innerText : '').substring(0, 200),
      imgCount: w ? w.querySelectorAll('img').length : 0
    };
  });
  console.log('After clear:', JSON.stringify(afterClear));
  
  // Step 4: Paste clean text (no HTML tags) 
  const cleanText = 
`💭 "클린트만 5번 돌렸는데 마음에 안 든다고?"
💭 "수정 요청 30회, 편집자가 연락 두절"
💭 "이번 달 편집자, 또 바꿔야 하나?"

영상 편집 아웃소싱을 해본 브랜드라면
누구나 한 번쯤 겪는 상황입니다.

😤 프리랜서 편집러, 왜 자꾸 바꾸게 될까?

영상 편집 프리랜서를 고용해본 분들은
다음 같은 경험을 해보셨을 겁니다.

① 클린트 무한 반복
매번 다른 의견, 매번 다른 결과.
클린트 5번 돌려도 원하는 느낌이 안 나오는 건
편집자의 문제가 아니라 시스템의 문제입니다.

② 매달 새로운 편집자 찾기
이번 달 괜찮았던 편집자, 다음 달엔 이미 다른 프로젝트.
또 구인 공고, 또 교육. 이 과정이 매달 반복됩니다.

③ 소통 비용 > 편집 비용
편집자와의 소통에 들어가는 시간이
실제 편집 비용보다 더 큽니다.

💡 에이컷이 해결한 방법 (전담 에디터 시스템)

에이컷은 프리랜서 편집러의 문제를
시스템으로 해결했습니다.

👤 전담 에디터 고정 배정
한 번 배정된 에디터는 변경 요청이 없는 한
계속 같은 분이 작업합니다.

📋 브랜드 가이드 저장
색상/폰트/BGM을 한 번 등록하면
다음 작업부터 설명이 필요 없습니다.

⚡ 48시간 기본 납기
가이드 기반 작업으로
리드타임이 획기적으로 줄어듭니다.

📊 바뀐 결과

에이컷 도입 후 고객사들의 변화입니다.
편집자 교체 주기: 매월 → 고정 배정
클린트 횟수: 5~7회 → 1~2회
소통 시간: 주 8시간 → 1시간 이내
납기 준수율: 60% → 98%

🎯 이런 분들께 추천합니다

매달 다른 편집자에게 브랜드를 설명해야 하는 분
클린트 피드백에 지친 마케터
납기 지연으로 광고 일정이 밀리는 분
브랜드 톤 일관성이 중요한 기업

👀 지금 확인해보세요

프리랜서 편집러와의 끝없는 소통,
이제는 시스템에 맡기세요.

에이컷 무료 상담에서
업종과 월 제작량에 맞는 플랜을
전담 매니저가 직접 안내해드립니다.

👉 카카오톡 채널: 에이컷
👉 이메일: contact@aicut.co.kr
👉 홈페이지: aicut.co.kr`;

  console.log('\n=== 본문 재입력 ===');
  
  // Copy clean text to clipboard
  await targetPage.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, cleanText);
  await targetPage.waitForTimeout(300);
  
  // Focus on contenteditable area properly
  const focused = await targetPage.evaluate(() => {
    // Find the actual editable content area
    const contentArea = document.querySelector('.se-content, .se-components-wrap [contenteditable], .se-section-text [contenteditable]');
    if (contentArea) {
      contentArea.focus();
      // Place cursor at the end
      const range = document.createRange();
      const sel = window.getSelection();
      if (contentArea.lastChild) {
        range.setStartAfter(contentArea.lastChild);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      return 'focused on ' + (contentArea.className || 'contenteditable');
    }
    return 'no contenteditable found';
  });
  console.log('Focus:', focused);
  await targetPage.waitForTimeout(500);
  
  // Try SmartEditor API first
  const apiResult = await targetPage.evaluate((text) => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      // Try various methods
      if (ed.appendBody) { ed.appendBody(text); return 'appendBody'; }
      if (ed.setBody) { ed.setBody('<p>' + text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>') + '</p>'); return 'setBody'; }
      if (ed.setHtml) { ed.setHtml(text); return 'setHtml'; }
      return 'no api found';
    } catch(e) { return 'api error: ' + e.message; }
  }, cleanText);
  console.log('API result:', apiResult);
  
  // Fallback: Ctrl+V paste
  await targetPage.keyboard.press('Control+v');
  await targetPage.waitForTimeout(3000);
  console.log('Pasted via Ctrl+V');
  
  // Check result
  const finalState = await targetPage.evaluate(() => {
    const w = document.querySelector('.se-components-wrap');
    const text = w ? w.innerText : '';
    const hasHTMLtags = text.includes('<p') || text.includes('<h2') || text.includes('<br');
    return {
      textPreview: text.substring(0, 300),
      hasHTMLtags: hasHTMLtags,
      length: text.length,
      imgCount: w ? w.querySelectorAll('img').length : 0
    };
  });
  console.log('\n=== 최종 상태 ===');
  console.log(JSON.stringify(finalState, null, 2));
  
  await targetPage.screenshot({ path: 'blog_final_clean.png', fullPage: true });
  
  await browser.close();
})();
