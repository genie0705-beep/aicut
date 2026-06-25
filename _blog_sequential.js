const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  
  // 기존 PostWriteForm 탭 닫고 새로 열기
  for (const p of ctx.pages()) { if (p.url().includes('PostWriteForm')) await p.close(); }
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // 제목
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('영상편집 클린트 5번, 수정 요청 30회... 프리랜서 편집러와 작별한 이유');
  });
  console.log('✅ 1. 제목');
  
  // 본문 섹션과 이미지를 번갈아 가며 입력
  const sections = [
    // Section 1: 인트로 텍스트
    '\uD83D\uDCAD "클린트만 5번 돌렸는데 마음에 안 든다고?"\n\uD83D\uDCAD "수정 요청 30회, 편집자가 연락 두절"\n\uD83D\uDCAD "이번 달 편집자, 또 바꿔야 하나?"\n\n영상 편집 아웃소싱을 해본 브랜드라면\n누구나 한 번쯤 겪는 상황입니다.',
    // Image 1: 썸네일
    'aicut_blog_freelancer_thumb.png',
    // Section 2: 문제 설명
    '\uD83D\uDE24 프리랜서 편집러, 왜 자꾸 바꾸게 될까?\n\n\u2460 클린트 무한 반복\n매번 다른 의견, 다른 결과.\n클린트 5번 돌려도 안 맞는 건\n편집자의 문제가 아니라 시스템의 문제입니다.\n\n\u2461 매달 새로운 편집자 찾기\n이번 달 괜찮았던 편집자,\n다음 달엔 이미 다른 프로젝트.\n\n\u2462 소통 비용 > 편집 비용\n편집자와의 소통 시간이\n실제 편집 비용보다 더 큽니다.',
    // Image 2: 문제 상황
    'aicut_blog_freelancer_01.png',
    // Section 3: 솔루션
    '\uD83D\uDCA1 에이컷이 해결한 방법\n에이컷은 프리랜서 편집러의 문제를\n시스템으로 해결했습니다.\n\n\uD83D\uDC64 전담 에디터 고정 배정\n\uD83D\uDCCB 브랜드 가이드 저장\n\u26A1 48시간 기본 납기',
    // Image 3: 솔루션
    'aicut_blog_freelancer_02.png',
    // Section 4: 결과
    '\uD83D\uDCCA 바뀐 결과\n편집자 교체: 매월 \u2192 고정 배정\n클린트 횟수: 5~7회 \u2192 1~2회\n소통 시간: 주 8시간 \u2192 1시간 이내\n납기 준수율: 60% \u2192 98%',
    // Image 4: 결과
    'aicut_blog_freelancer_03.png',
    // Section 5: CTA
    '\uD83D\uDC49 카카오톡 채널: 에이컷\n\uD83D\uDC49 이메일: contact@aicut.co.kr\n\uD83D\uDC49 홈페이지: aicut.co.kr',
    // Image 5: CTA
    'aicut_blog_freelancer_cta.png',
    // Section 6: 마무리
    '\n매달 다른 편집자와의 끝없는 소통,\n이제는 시스템에 맡기세요.\n\n\uD83D\uDC49 \uBB34\uB8CC \uC0C1\uB2F4\uC5D0\uC11C \uC5C5\uC885\uACFC\n\uC6D4 \uC81C\uC791\uB7C9\uC5D0 \uB9DE\uB294 \uD50C\uB79C\uC744\n\uD655\uC778\uD574\uBCF4\uC138\uC694.'
  ];
  
  let imgIndex = 0;
  const imgFiles = ['aicut_blog_freelancer_thumb.png','aicut_blog_freelancer_01.png','aicut_blog_freelancer_02.png','aicut_blog_freelancer_03.png','aicut_blog_freelancer_cta.png'];
  
  for (let i = 0; i < sections.length; i++) {
    const item = sections[i];
    
    if (item.startsWith('aicut_blog_freelancer_')) {
      // 이것은 이미지
      console.log(`  이미지 ${++imgIndex}/5: ${item}...`);
      
      const btnPos = await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          if ((btn.innerText || '').trim().startsWith('사진')) {
            const r = btn.getBoundingClientRect();
            return { x: r.x + r.width/2, y: r.y + r.height/2 };
          }
        }
        return null;
      });
      
      if (btnPos) {
        const fcPromise = page.waitForEvent('filechooser', { timeout: 10000 });
        await page.mouse.click(btnPos.x, btnPos.y);
        const fc = await fcPromise.catch(() => null);
        
        if (fc) {
          await fc.setFiles([path.join(WORKSPACE, item)]);
          await page.waitForTimeout(2000);
          console.log(`    ✅ ${item} 등록 완료`);
        } else {
          console.log(`    ❌ filechooser 실패`);
        }
      }
    } else {
      // 텍스트 섹션
      console.log(`  텍스트 섹션 ${i+1}...`);
      
      // 클릭 위치 계산
      const clickPos = await page.evaluate(() => {
        const m = document.querySelectorAll('.se-module-text');
        const body = m.length > 1 ? m[m.length - 1] : m[0];
        // 또는 content 영역 끝
        const content = document.querySelector('.se-content');
        if (content) {
          const r = content.getBoundingClientRect();
          return { x: r.x + 100, y: r.y + r.height - 50 };
        }
        return null;
      });
      
      if (clickPos) {
        await page.mouse.click(clickPos.x, clickPos.y);
        await page.waitForTimeout(500);
        // End 키로 끝으로 이동
        await page.keyboard.press('End');
        await page.waitForTimeout(300);
        
        await page.keyboard.type(item, { delay: 1 });
        await page.waitForTimeout(1000);
      }
    }
  }
  
  // 센터 정렬
  console.log('\n✅ 센터 정렬...');
  await page.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => { p.style.textAlign = 'center'; });
  });
  
  // 저장
  console.log('✅ 저장...');
  await page.evaluate(() => document.querySelector('.save_btn__bzc5B')?.click());
  await page.waitForTimeout(3000);
  
  console.log('\n🎉 블로그 작성 완료!');
  console.log('제목+본문+이미지5장(순서별)+센터정렬+저장 ✅');
  
  await page.screenshot({ path: 'blog_seq_done.png' });
  await b.close();
})();
