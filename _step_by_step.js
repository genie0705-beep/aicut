const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  let page;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { console.log('No editor tab'); process.exit(1); }
  
  await page.bringToFront();
  await page.waitForTimeout(1500);
  
  // === STEP 1: 본문 입력 ===
  console.log('=== STEP 1: 본문 입력 ===');
  
  // Click on text module to focus
  const clickPos = await page.evaluate(() => {
    const modules = document.querySelectorAll('.se-module-text');
    const body = modules[1];
    if (body) { const r = body.getBoundingClientRect(); return { x: r.x + 50, y: r.y + 10 }; }
    return null;
  });
  
  if (clickPos) {
    await page.mouse.click(clickPos.x, clickPos.y);
    await page.waitForTimeout(1000);
    
    // Delete existing text first - select all and delete
    await page.keyboard.press('End');
    await page.waitForTimeout(200);
    // Hold shift+home to select to start
    await page.keyboard.down('Shift');
    await page.keyboard.press('Home');
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);
    await page.keyboard.press('Delete');
    await page.waitForTimeout(500);
    
    // Insert full body text using insertText
    const bodyText = '💭 "클린트만 5번 돌렸는데 마음에 안 든다고?"\n💭 "수정 요청 30회, 편집자가 연락 두절"\n💭 "이번 달 편집자, 또 바꿔야 하나?"\n\n영상 편집 아웃소싱을 해본 브랜드라면\n누구나 한 번쯤 겪는 상황입니다.\n\n😤 프리랜서 편집러, 왜 자꾸 바꾸게 될까?\n\n① 클린트 무한 반복\n매번 다른 의견, 다른 결과. 클린트 5번 돌려도 안 맞는 건\n편집자의 문제가 아니라 시스템의 문제입니다.\n\n② 매달 새로운 편집자 찾기\n이번 달 괜찮았던 편집자, 다음 달엔 이미 다른 프로젝트.\n이 과정이 매달 반복됩니다.\n\n③ 소통 비용 > 편집 비용\n편집자와의 소통 시간이 실제 편집 비용보다 더 큽니다.\n\n💡 에이컷이 해결한 방법 (전담 에디터 시스템)\n에이컷은 프리랜서 편집러의 문제를 시스템으로 해결했습니다.\n\n👤 전담 에디터 고정 배정\n한 번 배정된 에디터는 변경 요청이 없는 한 계속 같은 분이 작업합니다.\n📋 브랜드 가이드 저장\n색상/폰트/BGM을 한 번 등록하면 다음 작업부터 설명이 필요 없습니다.\n⚡ 48시간 기본 납기\n가이드 기반 작업으로 리드타임이 획기적으로 줄어듭니다.\n\n📊 바뀐 결과\n편집자 교체 주기: 매월 → 고정 배정\n클린트 횟수: 5~7회 → 1~2회\n소통 시간: 주 8시간 → 1시간 이내\n납기 준수율: 60% → 98%\n\n🎯 이런 분들께 추천합니다\n매달 다른 편집자에게 브랜드를 설명해야 하는 분\n클린트 피드백에 지친 마케터\n납기 지연으로 광고 일정이 밀리는 분\n\n👉 카카오톡 채널: 에이컷\n👉 이메일: contact@aicut.co.kr\n👉 홈페이지: aicut.co.kr';
    
    await page.keyboard.insertText(bodyText);
    await page.waitForTimeout(2000);
    
    // Check
    const check1 = await page.evaluate(() => {
      const w = document.querySelector('.se-content');
      const text = w ? w.innerText : '';
      return { length: text.length, hasKeywords: text.includes('클린트') && text.includes('에이컷'), preview: text.substring(80, 150) };
    });
    console.log('본문 입력 결과:', JSON.stringify(check1));
  }
  
  // === STEP 2: 해시태그 ===
  console.log('\n=== STEP 2: 해시태그 ===');
  await page.evaluate(() => {
    const tags = '#영상편집외주 #프리랜서편집 #영상편집대행 #에이컷 #AICUT #전담에디터 #48시간납품 #영상편집 #숏폼제작 #릴스편집 #영상제작 #콘텐츠마케팅 #영상마케팅 #SNS영상 #마케팅영상 #브랜드영상 #편집외주 #영상편집비용 #영상편집서비스 #영상편집월정액 #클린트 #수정요청 #브랜드가이드 #전담매니저 #숏폼마케팅 #유튜브편집 #쇼츠제작 #인스타릴스 #영상편집전문 #콘텐츠제작';
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('태그')) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(inp, tags);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        return 'done';
      }
    }
    return 'no input';
  });
  await page.waitForTimeout(1500);
  console.log('✅ 해시태그');
  
  // === STEP 3: 저장 ===
  console.log('\n=== STEP 3: 저장 ===');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
    document.querySelector('.save_btn__bzc5B')?.click();
  });
  await page.waitForTimeout(3000);
  console.log('✅ 저장');
  
  await page.screenshot({ path: 'blog_final_complete.png' });
  console.log('\n=== ✅ STEP 1~3 완료 ===');
  console.log('STEP 1: 본문 - insertText로 전체 입력');
  console.log('STEP 2: 해시태그 30개');
  console.log('STEP 3: 저장 완료');
  console.log('');
  console.log('📌 STEP 4 (정이사님): 에디터에서 사진 버튼 → 5장 등록 → 발행');
  
  await b.close();
})();
