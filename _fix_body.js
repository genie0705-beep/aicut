const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  // Find PostWriteForm tab
  let target = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm')) { target = p; break; }
  }
  
  if (!target) {
    console.log('❌ 에디터 탭 없음 - 새로 열기');
    target = await ctx.newPage();
    await target.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
    await target.waitForTimeout(5000);
  }
  
  await target.bringToFront();
  await target.waitForTimeout(2000);
  
  // Check actual content
  const state = await target.evaluate(() => {
    const wrap = document.querySelector('.se-components-wrap');
    const titleEl = document.querySelector('.se-documentTitle');
    return {
      title: titleEl ? (titleEl.innerText || '').trim().substring(0, 50) : 'no title',
      text: wrap ? wrap.innerText.substring(0, 500) : 'no wrap',
      textLength: wrap ? wrap.innerText.length : 0,
      hasContent: wrap ? wrap.innerText.length > 50 : false,
      isEmpty: wrap ? wrap.innerText.includes('나를 돌아보는') || wrap.innerText.includes('추가할 컴포넌트') : true
    };
  });
  
  console.log('=== 에디터 상태 ===');
  console.log('Title:', state.title);
  console.log('Text 길이:', state.textLength);
  console.log('내용 있음:', state.hasContent);
  console.log('비어있음:', state.isEmpty);
  console.log('텍스트:', state.text.substring(0, 200));
  
  await target.screenshot({ path: 'editor_check_state.png' });
  
  // If empty, paste again
  if (state.isEmpty || !state.hasContent) {
    console.log('\n⚠️ 본문 비어있음 - 다시 붙여넣기');
    await target.waitForTimeout(1000);
    
    const bodyText = '💭 "클린트만 5번 돌렸는데 마음에 안 든다고?"\n💭 "수정 요청 30회, 편집자가 연락 두절"\n💭 "이번 달 편집자, 또 바꿔야 하나?"\n\n영상 편집 아웃소싱을 해본 브랜드라면 누구나 한 번쯤 겪는 상황입니다.\n\n😤 프리랜서 편집러, 왜 자꾸 바꾸게 될까?\n\n① 클린트 무한 반복\n매번 다른 의견, 다른 결과. 클린트 5번 돌려도 안 맞는 건 편집자의 문제가 아니라 시스템의 문제입니다.\n\n② 매달 새로운 편집자 찾기\n이번 달 괜찮았던 편집자, 다음 달엔 이미 다른 프로젝트. 이 과정이 매달 반복됩니다.\n\n③ 소통 비용 > 편집 비용\n편집자와의 소통 시간이 실제 편집 비용보다 더 큽니다.\n\n💡 에이컷이 해결한 방법 (전담 에디터 시스템)\n\n👤 전담 에디터 고정 배정: 한 번 배정된 에디터는 변경 요청이 없는 한 계속 같은 분이 작업합니다.\n📋 브랜드 가이드 저장: 색상/폰트/BGM 한 번 등록, 이후 설명 불필요\n⚡ 48시간 기본 납기: 가이드 기반 작업으로 리드타임 단축\n\n📊 바뀐 결과\n편집자 교체 주기: 매월 → 고정 배정\n클린트 횟수: 5~7회 → 1~2회\n소통 시간: 주 8시간 → 1시간 이내\n납기 준수율: 60% → 98%\n\n👉 카카오톡 채널: 에이컷\n👉 이메일: contact@aicut.co.kr\n👉 홈페이지: aicut.co.kr';
    
    // Try SmartEditor API to set body
    const apiResult = await target.evaluate((text) => {
      try {
        const ed = SmartEditor._editors['blogpc001'];
        // Try appendBody
        if (ed.appendBody) { ed.appendBody(text); return 'appendBody'; }
        // Try setBody with paragraph tags
        if (ed.setBody) { 
          const html = '<p>' + text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
          ed.setBody(html); 
          return 'setBody'; 
        }
        return 'no API';
      } catch(e) { return 'error: ' + e.message; }
    }, bodyText);
    console.log('API result:', apiResult);
    
    await target.waitForTimeout(1000);
    
    // Fallback: clipboard paste
    const afterApi = await target.evaluate(() => {
      const w = document.querySelector('.se-components-wrap');
      return w ? w.innerText.length : 0;
    });
    console.log('After API, text length:', afterApi);
    
    if (afterApi < 30) {
      // Paste via clipboard
      await target.evaluate((t) => navigator.clipboard.writeText(t), bodyText);
      await target.waitForTimeout(300);
      
      // Click on content area
      const seContent = await target.$('.se-content');
      if (seContent) {
        await seContent.click();
        await target.waitForTimeout(500);
      } else {
        await target.mouse.click(400, 300);
        await target.waitForTimeout(500);
      }
      
      await target.keyboard.press('Control+v');
      await target.waitForTimeout(3000);
      console.log('✅ 클립보드 붙여넣기 완료');
    }
    
    // Check final state
    const finalState = await target.evaluate(() => {
      const w = document.querySelector('.se-components-wrap');
      return { textLength: w ? w.innerText.length : 0, text: w ? w.innerText.substring(0, 100) : '' };
    });
    console.log('최종 텍스트 길이:', finalState.textLength);
    console.log('최종 텍스트:', finalState.text);
    
    // Save
    await target.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
      }
      const sc = document.querySelector('.save_btn__bzc5B');
      if (sc) sc.click();
    });
    await target.waitForTimeout(3000);
    console.log('✅ 저장 완료');
  }
  
  await target.screenshot({ path: 'editor_final_state.png' });
  await b.close();
})();
