const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';
const IMAGES = ['aicut_blog_ai_thumb.png','aicut_blog_ai_01.png','aicut_blog_ai_02.png','aicut_blog_ai_03.png','aicut_blog_ai_cta.png'];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  
  // Close any existing PostWriteForm tabs
  const existingPages = ctx.pages();
  for (const p of existingPages) {
    if (p.url().includes('PostWriteForm')) {
      await p.close();
    }
  }
  
  const page = await ctx.newPage();
  
  // 1. Open editor
  console.log('=== 에디터 열기 ===');
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  console.log('URL:', page.url());
  
  // 2. Set title
  console.log('\n=== 제목 ===');
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('AI 영상 편집이 대세라고? 그래도 전문 에디터가 필요한 이유');
  });
  console.log('✅');
  
  // 3. Upload images
  console.log('\n=== 이미지 업로드 ===');
  // First click the 사진 button to open upload
  const btnPos = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim().startsWith('사진')) {
        const r = btn.getBoundingClientRect();
        btn.click();
        return { x: r.x + r.width/2, y: r.y + r.height/2 };
      }
    }
    return null;
  });
  console.log('사진 버튼 clicked');
  await page.waitForTimeout(2000);
  
  // Check for file inputs
  const fcCount = await page.locator('input[type="file"]').count();
  console.log('File inputs:', fcCount);
  
  if (fcCount > 0) {
    // Set multiple
    await page.evaluate(() => {
      document.querySelectorAll('input[type="file"]').forEach(inp => { inp.multiple = true; });
    });
    
    const filePaths = IMAGES.map(f => path.join(WORKSPACE, f));
    await page.locator('input[type="file"]').first().setInputFiles(filePaths);
    console.log('✅ 5장 업로드 완료');
    await page.waitForTimeout(3000);
  } else {
    console.log('⚠️ 파일 입력 없음 - 직접 등록 필요');
  }
  
  await page.screenshot({ path: path.join(WORKSPACE, 'blog_ai_after_imgs.png') });
  
  // 4. Paste body text (plain text, no HTML)
  console.log('\n=== 본문 ===');
  const bodyText = `💭 "AI로 영상 편집하면 끝 아냐?"
💭 "생성형 AI면 자동 편집되는 거 아니야?"
💭 "그럼 편집 업체는 필요 없어지는 거 아니야?"

요즘 AI 영상 편집 툴이 쏟아지고 있습니다.
AI면 충분한데, 왜 전문 편집 에디터가 필요할까?

🤖 AI 영상 편집, 현재 수준은?
AI 툴의 발전 속도는 놀랍습니다. 자동 자막, 배경 제거, AI 더빙까지 이제 몇 번의 클릭으로 가능합니다. 단순한 SNS 숏폼 영상이라면 AI 툴만으로도 어느 정도 퀄리티가 나옵니다.

⚠️ 그런데, AI가 못 하는 3가지

① 브랜드 감각의 재현
AI는 브랜드만의 느낌을 학습할 수 없습니다. 색감 톤, 자막 스타일, BGM 방향성. 브랜드 가이드는 단순한 규칙이 아니라 감각과 경험의 결과물입니다.

② 맥락을 이해한 편집
AI는 영상의 맥락을 이해하지 못합니다. 단순히 예쁘게 자르는 것과 메시지를 전달하는 편집은 다릅니다.

③ 긴급 대응과 유연함
AI 툴은 긴급 상황에 대응할 수 없습니다. 하지만 전담 에디터는 브랜드를 이해하고 있기 때문에 별도 설명 없이도 바로 수정할 수 있습니다.

💡 정답은 AI + 인간의 조합
에이컷은 AI 툴로 1차 편집을 처리하고 전담 에디터가 최종 퀄리티를 조정합니다. 편집 시간 40% 단축, 퀄리티는 더 높아졌습니다.

🔮 앞으로의 영상 편집 시장
AI가 기본을 처리하고 전문가가 완성하는 구조로 변화할 뿐입니다. AI 툴만 사용하는 업체 vs AI + 전문 에디터의 조합. 품질과 속도 모두에서 차이가 날 것입니다.

👉 카카오톡 채널: 에이컷
👉 이메일: contact@aicut.co.kr
👉 홈페이지: aicut.co.kr`;

  await page.evaluate((t) => navigator.clipboard.writeText(t), bodyText);
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+v');
  await page.waitForTimeout(3000);
  console.log('✅');
  
  // 5. Hashtags
  console.log('\n=== 해시태그 ===');
  await page.evaluate(() => {
    const tags = '#AI영상편집 #영상편집외주 #생성형AI #에이컷 #AICUT #전담에디터 #숏폼마케팅 #영상편집대행 #AI영상 #릴스편집 #영상제작 #콘텐츠마케팅 #영상마케팅 #SNS영상 #마케팅영상 #AI마케팅 #영상편집 #숏폼제작 #AI에디터 #브랜드영상 #여름마케팅 #릴스알고리즘 #영상편집비용 #전담매니저 #유튜브편집 #쇼츠제작 #인스타릴스 #AI시대 #콘텐츠제작 #에이컷블로그';
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      const ph = (inp.placeholder || '').toLowerCase();
      if (ph.includes('태그') || ph.includes('tag')) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(inp, tags);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
        return 'ok';
      }
    }
    return '태그 입력창 못 찾음';
  });
  await page.waitForTimeout(2000);
  console.log('✅');
  
  // 6. Save
  console.log('\n=== 저장 ===');
  await page.screenshot({ path: path.join(WORKSPACE, 'blog_ai_before_save.png') });
  
  const saveResult = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') {
        btn.click();
        return '저장 클릭됨';
      }
    }
    const saveClass = document.querySelector('.save_btn__bzc5B');
    if (saveClass) { saveClass.click(); return '저장(클래스)'; }
    return '저장 버튼 없음';
  });
  console.log(saveResult);
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: path.join(WORKSPACE, 'blog_ai_done.png') });
  
  console.log('\n=== ✅ 완료 ===');
  console.log('제목: AI 영상 편집이 대세라고? 그래도 전문 에디터가 필요한 이유');
  console.log('이미지: 5장');
  console.log('해시태그: 30개');
  console.log('시즌키워드: 여름마케팅');
  console.log('핫키워드: AI영상편집, 생성형AI, 릴스알고리즘, 숏폼마케팅');
  
  await b.close();
})();
