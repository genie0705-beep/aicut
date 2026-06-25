const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm') && !p.url().includes('aicut/224')) { page = p; break; }
  }
  if (!page) { process.exit(1); }
  
  await page.bringToFront();
  await page.waitForTimeout(2000);
  
  // Set title
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('영상편집 클린트 5번, 수정 요청 30회... 프리랜서 편집러와 작별한 이유');
  });
  console.log('✅ 제목 설정');
  await page.waitForTimeout(1000);
  
  // Insert text via document data
  const result = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const ds = ed._documentService;
    const data = ds.getDocumentData();
    const components = data.document.components;
    
    // The existing text component: { id, layout, value, @ctype }
    // Update its value
    const textComp = components.find(c => c['@ctype'] === 'text');
    if (textComp) {
      textComp.value = '💭 "클린트만 5번 돌렸는데 마음에 안 든다고?"\n💭 "수정 요청 30회, 편집자가 연락 두절"\n💭 "이번 달 편집자, 또 바꿔야 하나?"\n\n영상 편집 아웃소싱을 해본 브랜드라면\n누구나 한 번쯤 겪는 상황입니다.\n\n😤 프리랜서 편집러, 왜 자꾸 바꾸게 될까?\n\n① 클린트 무한 반복\n매번 다른 의견, 다른 결과.\n클린트 5번 돌려도 안 맞는 건\n편집자의 문제가 아니라 시스템의 문제입니다.\n\n② 매달 새로운 편집자 찾기\n이번 달 괜찮았던 편집자,\n다음 달엔 이미 다른 프로젝트.\n\n③ 소통 비용 > 편집 비용\n편집자와의 소통 시간이\n실제 편집 비용보다 더 큽니다.\n\n💡 에이컷의 해결책\n전담 에디터 고정 + 브랜드 가이드 저장 + 48시간 납기\n\n📊 결과\n편집자 고정, 클린트 1~2회\n소통 주 1시간 이내, 납기 98%\n\n👉 카카오톡: 에이컷 / 이메일: contact@aicut.co.kr';
      
      ds.setDocumentData(data.document);
      return 'text component updated';
    }
    return 'no text component found';
  });
  
  console.log('Result:', result);
  await page.waitForTimeout(2000);
  
  const check = await page.evaluate(() => {
    const w = document.querySelector('.se-content');
    return {
      textLength: w ? w.innerText.length : 0,
      preview: w ? w.innerText.substring(0, 200) : '',
      hasContent: w ? w.innerText.length > 100 : false
    };
  });
  console.log('After:', JSON.stringify(check));
  
  // Hashtags
  if (check.hasContent) {
    await page.evaluate(() => {
      const tags = '#영상편집외주 #프리랜서편집 #영상편집대행 #에이컷 #AICUT #전담에디터 #48시간납품 #영상편집 #숏폼제작 #릴스편집 #영상제작 #콘텐츠마케팅 #영상마케팅 #SNS영상 #마케팅영상 #브랜드영상 #편집외주 #영상편집비용 #영상편집서비스 #영상편집월정액 #클린트 #수정요청 #브랜드가이드 #전담매니저 #숏폼마케팅 #유튜브편집 #쇼츠제작 #인스타릴스 #영상편집전문 #콘텐츠제작';
      const inputs = document.querySelectorAll('input');
      for (const inp of inputs) {
        if ((inp.placeholder || '').includes('태그')) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(inp, tags);
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          return 'tags done';
        }
      }
      return 'no tag input';
    });
    await page.waitForTimeout(1500);
    console.log('✅ 해시태그');
    
    // Save
    const saveResult = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) { if ((btn.innerText || '').trim() === '저장') { btn.click(); return 'saved'; } }
      const sc = document.querySelector('.save_btn__bzc5B');
      if (sc) { sc.click(); return 'saved by class'; }
      return 'no save btn';
    });
    console.log('Save:', saveResult);
    await page.waitForTimeout(3000);
    console.log('✅ 저장 완료');
  }
  
  await page.screenshot({ path: 'blog_v1_api_done.png' });
  await b.close();
})();
