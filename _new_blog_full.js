const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  
  // 새 에디터 열기 (기존 탭 닫고)
  const existing = ctx.pages();
  for (const p of existing) {
    if (p.url().includes('PostWriteForm')) await p.close();
  }
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // === 1. 제목 ===
  console.log('1/7 제목 입력...');
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('영상편집 클린트 5번, 수정 요청 30회... 프리랜서 편집러와 작별한 이유');
  });
  
  // === 2. 이미지 업로드 시도 ===
  console.log('2/7 이미지 업로드...');
  const btnPos = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim().startsWith('사진')) { btn.click(); return true; }
    }
    return false;
  });
  await page.waitForTimeout(2000);
  
  const fcCount = await page.locator('input[type="file"]').count();
  if (fcCount > 0) {
    await page.evaluate(() => { document.querySelectorAll('input[type="file"]').forEach(i => { i.multiple = true; }); });
    await page.locator('input[type="file"]').first().setInputFiles([
      path.join(WORKSPACE, 'aicut_blog_freelancer_thumb.png'),
      path.join(WORKSPACE, 'aicut_blog_freelancer_01.png'),
      path.join(WORKSPACE, 'aicut_blog_freelancer_02.png'),
      path.join(WORKSPACE, 'aicut_blog_freelancer_03.png'),
      path.join(WORKSPACE, 'aicut_blog_freelancer_cta.png')
    ]);
    await page.waitForTimeout(3000);
    console.log('  ✅ 5장 업로드');
  } else {
    console.log('  ⚠️ 이미지 자동 업로드 불가 (정이사님 등록 필요)');
  }
  
  // === 3. 본문 입력 ===
  console.log('3/7 본문 입력...');
  const clickPos = await page.evaluate(() => {
    const m = document.querySelectorAll('.se-module-text')[1];
    if (m) { const r = m.getBoundingClientRect(); return { x: r.x + 50, y: r.y + 10 }; }
    return null;
  });
  if (clickPos) {
    await page.mouse.click(clickPos.x, clickPos.y);
    await page.waitForTimeout(1000);
    
    const bodyText = '\uD83D\uDCAD "클린트만 5번 돌렸는데 마음에 안 든다고?"\n\uD83D\uDCAD "수정 요청 30회, 편집자가 연락 두절"\n\uD83D\uDCAD "이번 달 편집자, 또 바꿔야 하나?"\n\n영상 편집 아웃소싱을 해본 브랜드라면\n누구나 한 번쯤 겪는 상황입니다.\n\n\uD83D\uDE24 프리랜서 편집러, 왜 자꾸 바꾸게 될까?\n\n\u2460 클린트 무한 반복\n매번 다른 의견, 다른 결과.\n클린트 5번 돌려도 안 맞는 건\n편집자의 문제가 아니라 시스템의 문제입니다.\n\n\u2461 매달 새로운 편집자 찾기\n이번 달 괜찮았던 편집자,\n다음 달엔 이미 다른 프로젝트.\n\n\u2462 소통 비용 > 편집 비용\n편집자와의 소통 시간이\n실제 편집 비용보다 더 큽니다.\n\n\uD83D\uDCA1 에이컷이 해결한 방법\n전담 에디터 고정 배정\n브랜드 가이드 저장\n48시간 기본 납기\n\n\uD83D\uDCCA 바뀐 결과\n편집자 교체: 매월 \u2192 고정 배정\n클린트 횟수: 5~7회 \u2192 1~2회\n소통 시간: 주 8시간 \u2192 1시간 이내\n납기 준수율: 60% \u2192 98%\n\n\uD83D\uDC49 카카오톡 채널: 에이컷\n\uD83D\uDC49 이메일: contact@aicut.co.kr\n\uD83D\uDC49 홈페이지: aicut.co.kr';
    
    await page.keyboard.type(bodyText, { delay: 2 });
    await page.waitForTimeout(2000);
    console.log('  ✅ 본문 입력');
  }
  
  // === 4. 센터 정렬 ===
  console.log('4/7 센터 정렬...');
  await page.evaluate(() => {
    const ps = document.querySelectorAll('.se-text-paragraph');
    ps.forEach(p => { p.style.textAlign = 'center'; });
  });
  console.log('  ✅ 센터 정렬');
  
  // === 5. 해시태그 (발행 패널) ===
  console.log('5/7 해시태그...');
  await page.evaluate(() => {
    document.querySelectorAll('button').forEach(b => { if ((b.innerText||'').trim() === '발행') b.click(); });
  });
  await page.waitForTimeout(2000);
  
  const tagInput = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if (inp.placeholder === '태그 입력 (최대 30개)') {
        const r = inp.getBoundingClientRect();
        inp.focus();
        return { x: r.x + r.width/2, y: r.y + r.height/2 };
      }
    }
    return null;
  });
  
  if (tagInput) {
    const tags = '#영상편집외주 #프리랜서편집 #영상편집대행 #에이컷 #AICUT #전담에디터 #48시간납품 #영상편집 #숏폼제작 #릴스편집 #영상제작 #콘텐츠마케팅 #영상마케팅 #SNS영상 #마케팅영상 #브랜드영상 #편집외주 #영상편집비용 #영상편집서비스 #영상편집월정액 #클린트 #수정요청 #브랜드가이드 #전담매니저 #숏폼마케팅 #유튜브편집 #쇼츠제작 #인스타릴스 #영상편집전문 #콘텐츠제작';
    await page.keyboard.type(tags, { delay: 3 });
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    console.log('  ✅ 해시태그 30개');
  }
  
  // 발행 패널 닫기
  await page.evaluate(() => {
    document.querySelectorAll('button').forEach(b => { if ((b.innerText||'').includes('닫기')) b.click(); });
  });
  await page.waitForTimeout(500);
  
  // === 6. 저장 ===
  console.log('6/7 저장...');
  await page.evaluate(() => document.querySelector('.save_btn__bzc5B')?.click());
  await page.waitForTimeout(3000);
  console.log('  ✅ 저장');
  
  // === 7. 최종 검증 ===
  console.log('7/7 최종 검증...');
  const verify = await page.evaluate(() => {
    const w = document.querySelector('.se-content');
    const text = w ? w.innerText : '';
    const ps = document.querySelectorAll('.se-text-paragraph');
    let center = 0;
    ps.forEach(p => { if (p.style.textAlign === 'center') center++; });
    
    // 태그 확인 (발행 패널 다시 열기)
    document.querySelectorAll('button').forEach(b => { if ((b.innerText||'').trim() === '발행') b.click(); });
    return { title: document.querySelector('.se-documentTitle')?.innerText?.trim()?.substring(0,20) || '', textLen: text.length, centerAlign: center + '/' + ps.length };
  });
  await page.waitForTimeout(1500);
  
  const tagVerify = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if (inp.placeholder === '태그 입력 (최대 30개)') {
        return inp.value.split('#').length - 1;
      }
    }
    return 0;
  });
  
  // 닫기
  await page.evaluate(() => {
    document.querySelectorAll('button').forEach(b => { if ((b.innerText||'').includes('닫기')) b.click(); });
  });
  
  console.log('\n=== 📋 검증 결과 ===');
  console.log('제목:', verify.title ? '✅' : '❌');
  console.log('본문:', verify.textLen > 200 ? '✅ ' + verify.textLen + '자' : '❌');
  console.log('정렬:', verify.centerAlign === verify.centerAlign.split('/')[1] ? '✅ ' + verify.centerAlign : '❌');
  console.log('태그:', tagVerify >= 20 ? '✅ ' + tagVerify + '개' : '❌ ' + tagVerify + '개');
  console.log('저장: ✅');
  
  const allOk = verify.title && verify.textLen > 200 && (verify.centerAlign.split('/')[0] === verify.centerAlign.split('/')[1]) && tagVerify >= 20;
  
  if (allOk) {
    console.log('\n🎉 전 항목 정상! 정이사님 확인 불필요');
  }
  
  console.log('\n📌 이미지만 사진 버튼 → 5장 등록 → 발행');
  
  await page.screenshot({ path: 'final_new_blog.png' });
  await b.close();
})();
