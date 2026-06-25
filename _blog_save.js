const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  // Find PostWriteForm tabs
  let targetPage = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm')) {
      targetPage = p;
      break;
    }
  }
  
  if (!targetPage) {
    console.log('❌ 블로그 에디터 탭 없음');
    await browser.close();
    return;
  }
  
  await targetPage.bringToFront();
  await targetPage.waitForTimeout(2000);
  
  // Check current state
  const state = await targetPage.evaluate(() => {
    const wrap = document.querySelector('.se-components-wrap');
    if (!wrap) return { error: 'no editor' };
    
    const text = wrap.innerText || '';
    const imgs = wrap.querySelectorAll('img');
    
    return {
      hasTitle: text.includes('클린트') || text.includes('영상편집'),
      imgCount: imgs.length,
      textLength: text.length,
      textPreview: text.substring(0, 200),
      imgUrls: Array.from(imgs).map(i => (i.getAttribute('src') || '').substring(0, 40))
    };
  });
  
  console.log('=== 에디터 상태 ===');
  console.log(JSON.stringify(state, null, 2));
  
  // Check if title is set
  const titleText = await targetPage.evaluate(() => {
    const titleEl = document.querySelector('.se-documentTitle');
    return titleEl ? (titleEl.innerText || '').substring(0, 50) : 'no title element';
  });
  console.log('Title:', titleText);
  
  // If title missing, set it
  if (!state.hasTitle && !titleText.includes('클린트')) {
    console.log('\n=== 제목 입력 ===');
    await targetPage.evaluate(() => {
      SmartEditor._editors['blogpc001'].setDocumentTitle('영상편집 클린트 5번, 수정 요청 30회... 프리랜서 편집러와 작별한 이유');
    });
    console.log('✅ 제목 입력 완료');
  }
  
  // If no text content, paste body text
  if (state.textLength < 50 || state.textPreview.includes('나를 돌아보는')) {
    console.log('\n=== 본문 붙여넣기 ===');
    
    const bodyText = `💭 "클린트만 5번 돌렸는데 마음에 안 든다고?"
💭 "수정 요청 30회, 편집자가 연락 두절"
💭 "이번 달 편집자, 또 바꿔야 하나?"

영상 편집 아웃소싱을 해본 브랜드라면 누구나 한 번쯤 겪는 상황입니다.

😤 프리랜서 편집러, 왜 자꾸 바꾸게 될까?

① 클린트 무한 반복 - 매번 다른 의견, 다른 결과. 클린트 5번 돌려도 안 맞는 건 편집자의 문제가 아니라 시스템의 문제입니다.
② 매달 새로운 편집자 찾기 - 이번 달 괜찮았던 편집자, 다음 달엔 이미 다른 프로젝트. 이 과정이 매달 반복됩니다.
③ 소통 비용 > 편집 비용 - 편집자와의 소통 시간이 실제 편집 비용보다 더 큽니다.

💡 에이컷의 해결책: 전담 에디터 고정 + 브랜드 가이드 저장 + 48시간 납기

📊 결과: 편집자 고정, 클린트 1~2회, 소통 주 1시간 이내, 납기 98%

🎯 이런 분들께 - 매달 다른 편집자에게 브랜드 설명하는 분, 클린트 피드백에 지친 마케터, 납기 지연으로 일정 밀리는 분

👉 카카오톡: 에이컷 / 이메일: contact@aicut.co.kr`;

    await targetPage.evaluate((t) => navigator.clipboard.writeText(t), bodyText);
    await targetPage.waitForTimeout(300);
    await targetPage.keyboard.press('Control+v');
    await targetPage.waitForTimeout(3000);
    console.log('✅ 본문 붙여넣기 완료');
  }
  
  // Save button click
  console.log('\n=== 저장 버튼 클릭 ===');
  await targetPage.screenshot({ path: path.join(WORKSPACE, 'blog_before_save.png') });
  
  const saveResult = await targetPage.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const text = (btn.innerText || '').trim();
      if (text === '저장') {
        const r = btn.getBoundingClientRect();
        btn.click();
        return { clicked: true, x: Math.round(r.x), y: Math.round(r.y), text: '저장' };
      }
    }
    // Also try finding by class
    const saveBtn = document.querySelector('.save_btn__bzc5B');
    if (saveBtn) {
      saveBtn.click();
      return { clicked: true, method: 'class', text: '저장' };
    }
    return { clicked: false };
  });
  console.log('저장 결과:', JSON.stringify(saveResult));
  
  await targetPage.waitForTimeout(3000);
  
  // Check result
  const afterSave = await targetPage.evaluate(() => {
    const btns = document.querySelectorAll('button');
    return Array.from(btns)
      .filter(b => b.getBoundingClientRect().width > 10)
      .map(b => ({ text: (b.innerText || '').trim().substring(0, 10), className: b.className.substring(0, 30) }));
  });
  console.log('After save buttons:', afterSave.map(b => b.text).join(', '));
  
  // Check for publish/done
  const saveDone = await targetPage.evaluate(() => {
    const text = document.body.innerText;
    if (text.includes('저장되었습니다') || text.includes('저장됨') || text.includes('발행')) {
      return '저장 확인됨';
    }
    return text.substring(0, 300);
  });
  console.log('Save status:', saveDone.substring(0, 100));
  
  await targetPage.screenshot({ path: path.join(WORKSPACE, 'blog_after_save.png') });
  
  console.log('\n=== 작업 완료 ===');
  
  await browser.close();
})();
