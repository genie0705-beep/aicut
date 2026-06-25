const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const W = 'C:\\Users\\paul\\.openclaw\\workspace';
const TITLE = '온라인 강사·교육 크리에이터라면 숏폼 마케팅이 필요한 이유 (방학 특강 시즌)';
const IMAGES = [
  'aicut_blog_edu_01_main.png',
  'aicut_blog_edu_02_trend.png',
  'aicut_blog_edu_03_shortform.png',
  'aicut_blog_edu_04_season.png',
  'aicut_blog_edu_05_cta.png'
];
const HASHTAGS = '#온라인강의 #교육콘텐츠 #숏폼마케팅 #방학특강 #여름방학 #영상편집외주 #에듀테크 #릴스편집 #쇼츠제작 #틱톡마케팅 #강사마케팅 #온라인강사 #숏폼제작 #에이컷 #aicut #강의홍보 #영상마케팅 #인스타릴스 #유튜브쇼츠 #콘텐츠마케팅 #SNS마케팅 #영상편집 #브랜드영상 #교육마케팅 #강의영상 #숏폼영상 #여름특강 #온라인교육 #마케팅전략 #AI영상편집';

// 순수 텍스트 본문
const BODY_TEXT = `💭 이런 고민, 온라인 강사라면 공감하실 겁니다

"온라인 강의를 열심히 찍는데, 수강생이 계속 정체예요"

"릴스나 쇼츠로 강의를 홍보해보고 싶은데, 영상 편집이 너무 어려워요"

"방학 특강 시즌인데, 어떻게 홍보해야 할지 모르겠어요"

온라인 교육 시장이 빠르게 성장하면서, 강의 퀄리티만큼 중요한 것이 마케팅입니다. 아무리 좋은 강의를 만들어도 사람들이 모르면 의미가 없습니다.

[이미지1]

📈 온라인 교육 시장, 영상 마케팅이 답인 이유

2026년 현재 국내 온라인 교육 시장은 10조 원을 넘어섰습니다. 클래스101, 탈잉, 인프런 등 플랫폼이 다양해지면서 경쟁도 치열해지고 있습니다.

같은 플랫폼 안에서 수많은 강사와 경쟁해야 하는 상황에서, 숏폼 콘텐츠는 가장 효과적인 홍보 수단입니다. 유튜브 쇼츠, 인스타그램 릴스, 틱톡 등 숏폼 플랫폼에서 강의의 핵심을 미리 보여주는 방식이 가장 효과적입니다.

[이미지2]

🎬 숏폼 영상이 강의 홍보에 효과적인 3가지 이유

1. 짧은 시간, 강력한 임팩트 — 15~60초로 강의의 핵심 가치를 전달할 수 있습니다.

2. 플랫폼 알고리즘 특혜 — 릴스, 쇼츠, 틱톡 모두 짧은 영상을 우선 노출합니다.

3. 신뢰도와 전문성 구축 — 강사가 직접 출연하는 영상이 텍스트보다 훨씬 높은 신뢰도를 형성합니다.

[이미지3]

🔥 방학 특강 시즌, 지금 시작해야 하는 이유

6월은 여름방학 특강 시즌을 준비하는 골든타임입니다. 방학이 시작되기 전에 수강생을 모집해야 하므로, 6월 말에서 7월 초가 최적기입니다.

초중고 방학 특강, 취업 준비생 대상 강의, 직장인 자기계발까지 수요가 급증하는 시기입니다. 이 시기에 맞춰 숏폼 영상 마케팅을 준비하면 검색량이 높은 키워드에서 자연스럽게 노출됩니다.

[이미지4]

📦 AICUT의 교육 콘텐츠 영상 솔루션

AICUT은 온라인 교육 콘텐츠에 특화된 영상 편집 서비스를 제공합니다.

🎯 강의 하이라이트 숏폼 제작
📱 릴스·쇼츠·틱톡 맞춤 편집
✂️ 자막·효과·자연스러운 컷 편집
📦 월 정기 납품으로 안정적인 콘텐츠 발행

하루 1시간씩 영상 편집에 쏟던 시간, 이제 강의 퀄리티에 투자하세요.

[이미지5]

📞 지금 바로 상담받으세요

교육 콘텐츠 영상 마케팅, 어디서부터 시작할지 막막하시죠?
AICUT이 처음부터 끝까지 도와드립니다.

📧 master@aicut.co.kr
🌐 aicut.co.kr
💬 카카오톡 플러스친구 'AICUT'

무료 상담 및 견적 제공 중입니다. 부담 없이 문의 주세요!`;

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  
  // 기존 PostWriteForm 닫기
  for (const p of ctx.pages()) { if (p.url().includes('PostWriteForm')) await p.close(); }
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(8000);
  
  console.log('=== 교육 블로그 작성 (순수 텍스트) ===\n');
  
  // 1. 제목
  console.log('[1] 제목');
  await page.evaluate(t => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅\n');
  
  // 2. 본문 (순수 텍스트 - HTML 태그 없음)
  console.log('[2] 본문');
  await page.evaluate(t => navigator.clipboard.writeText(t), BODY_TEXT);
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+v');
  await page.waitForTimeout(3000);
  console.log('✅\n');
  
  // 3. 이미지
  console.log('[3] 이미지');
  await page.evaluate(() => { const btn = document.querySelector('.se-image-toolbar-button'); if (btn) btn.click(); });
  await page.waitForTimeout(2000);
  
  const pos = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      const t = (b.innerText || '').trim();
      if (t === '사진' || t.startsWith('사진')) {
        const r = b.getBoundingClientRect();
        return { x: r.x + r.width/2, y: r.y + r.height/2 };
      }
    }
    return null;
  });
  
  if (pos) {
    const fcP = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
    await page.mouse.click(pos.x, pos.y);
    await page.waitForTimeout(1000);
    const fc = await fcP;
    if (fc) {
      await fc.setFiles(IMAGES.map(f => path.join(W, f)));
      await page.waitForTimeout(3000);
      console.log('✅ 5장\n');
    }
  }
  
  // 4. 해시태그 (Enter 이벤트 포함)
  console.log('[4] 해시태그');
  await page.evaluate(t => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) {
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        s.call(inp, t);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
        return;
      }
    }
  }, HASHTAGS);
  await page.waitForTimeout(1500);
  
  const tagCheck = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감'))
        return inp.value.split('#').filter(t => t.trim().length > 0).length;
    }
    return 0;
  });
  console.log('태그:', tagCheck + '개 ' + (tagCheck >= 30 ? '✅' : '❌'));
  
  // 5. 저장
  console.log('\n[5] 저장');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  
  // 저장 확인 (autosave_message)
  let toast = '';
  for (let i = 0; i < 30; i++) {
    toast = await page.evaluate(() => {
      const el = document.querySelector('[class*="autosave"]');
      return el ? (el.innerText || '').trim() : '';
    });
    if (toast) break;
    await page.waitForTimeout(1000);
  }
  console.log('토스트:', toast || '(30초 대기 완료)');
  
  if (toast) {
    console.log('\n✅ 저장 완료!');
    console.log('📌 발행만 누르시면 됩니다!');
  } else {
    console.log('\n❌ 저장 미확인');
  }
  
  // 브라우저 유지 (연결 끊지 않음)
  // await b.close(); 제거
})();
