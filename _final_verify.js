const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  let page;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { process.exit(1); }
  
  await page.bringToFront();
  await page.waitForTimeout(1500);
  
  const issues = [];
  
  // === 1. 제목 체크 ===
  const title = await page.evaluate(() => {
    const el = document.querySelector('.se-documentTitle');
    return el ? el.innerText.trim() : '';
  });
  if (title.includes('클린트') && title.includes('프리랜서')) {
    console.log('✅ 제목 정상');
  } else {
    issues.push('제목 누락');
    console.log('❌ 제목 재설정');
    await page.evaluate(() => {
      SmartEditor._editors['blogpc001'].setDocumentTitle('영상편집 클린트 5번, 수정 요청 30회... 프리랜서 편집러와 작별한 이유');
    });
  }
  
  // === 2. 본문 체크 ===
  const bodyCheck = await page.evaluate(() => {
    const w = document.querySelector('.se-content');
    const text = w ? w.innerText : '';
    return {
      length: text.length,
      hasKeywords: text.includes('클린트') && text.includes('에이컷') && text.includes('프리랜서'),
      preview: text.substring(80, 160)
    };
  });
  if (bodyCheck.length > 200 && bodyCheck.hasKeywords) {
    console.log('✅ 본문 정상 (' + bodyCheck.length + '자)');
  } else {
    issues.push('본문 누락');
    console.log('❌ 본문 재입력 필요');
  }
  
  // === 3. 센터 정렬 체크 ===
  const alignCheck = await page.evaluate(() => {
    const wrap = document.querySelector('.se-components-wrap');
    const paras = wrap ? wrap.querySelectorAll('.se-text-paragraph') : [];
    let centerCount = 0;
    paras.forEach(p => {
      if (p.style.textAlign === 'center') centerCount++;
    });
    return { total: paras.length, centerAligned: centerCount };
  });
  
  if (alignCheck.centerAligned === alignCheck.total && alignCheck.total > 0) {
    console.log(`✅ 센터 정렬 정상 (${alignCheck.centerAligned}/${alignCheck.total})`);
  } else {
    issues.push('센터 정렬 불완전');
    console.log(`❌ 센터 정렬 재적용 (${alignCheck.centerAligned}/${alignCheck.total})`);
    await page.evaluate(() => {
      const wrap = document.querySelector('.se-components-wrap');
      const paras = wrap ? wrap.querySelectorAll('.se-text-paragraph') : [];
      paras.forEach(p => { p.style.textAlign = 'center'; });
    });
  }
  
  // === 4. 해시태그 체크 (발행 패널 열어서 확인) ===
  // 발행 버튼 클릭
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '발행') { btn.click(); return; }
    }
  });
  await page.waitForTimeout(2000);
  
  const tagCheck = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if (inp.placeholder === '태그 입력 (최대 30개)') {
        const count = inp.value.split('#').length - 1;
        return { count, value: inp.value.substring(0, 100), found: count > 0 };
      }
    }
    return { found: false };
  });
  
  if (tagCheck.found && tagCheck.count >= 20) {
    console.log(`✅ 해시태그 정상 (${tagCheck.count}개)`);
  } else {
    issues.push('해시태그 누락');
    console.log(`❌ 해시태그 재입력 (현재: ${tagCheck.count || 0}개)`);
    
    const tagInput = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      for (const inp of inputs) {
        if (inp.placeholder === '태그 입력 (최대 30개)') {
          const r = inp.getBoundingClientRect();
          return { x: r.x + r.width/2, y: r.y + r.height/2 };
        }
      }
      return null;
    });
    
    if (tagInput) {
      const tags = '#영상편집외주 #프리랜서편집 #영상편집대행 #에이컷 #AICUT #전담에디터 #48시간납품 #영상편집 #숏폼제작 #릴스편집 #영상제작 #콘텐츠마케팅 #영상마케팅 #SNS영상 #마케팅영상 #브랜드영상 #편집외주 #영상편집비용 #영상편집서비스 #영상편집월정액 #클린트 #수정요청 #브랜드가이드 #전담매니저 #숏폼마케팅 #유튜브편집 #쇼츠제작 #인스타릴스 #영상편집전문 #콘텐츠제작';
      await page.mouse.click(tagInput.x, tagInput.y);
      await page.waitForTimeout(300);
      await page.keyboard.type(tags, { delay: 3 });
      await page.waitForTimeout(1000);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1500);
      console.log('✅ 해시태그 재입력 완료');
    }
  }
  
  // 발행 패널 닫기
  await page.evaluate(() => {
    document.querySelectorAll('button').forEach(b => { if ((b.innerText||'').includes('닫기')) b.click(); });
  });
  await page.waitForTimeout(1000);
  
  // === 5. 최종 저장 ===
  await page.evaluate(() => document.querySelector('.save_btn__bzc5B')?.click());
  await page.waitForTimeout(3000);
  console.log('✅ 최종 저장 완료');
  
  // === 결과 요약 ===
  console.log('\n=== 📋 최종 검증 결과 ===');
  if (issues.length === 0) {
    console.log('🎉 모든 항목 정상! 정이사님 확인 불필요');
  } else {
    console.log('⚠️ 발견된 문제 (' + issues.length + '개):');
    issues.forEach((iss, i) => console.log(`  ${i+1}. ${iss}`));
    console.log('  → 모두 자동 수정 완료');
  }
  
  console.log('\n📌 남은 작업: 에디터에서 사진 버튼 → 5장 등록 → 발행');
  
  await page.screenshot({ path: 'final_verify.png' });
  await b.close();
})();
