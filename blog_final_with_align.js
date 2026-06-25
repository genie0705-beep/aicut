const { chromium } = require('playwright');
const fs = require('fs');

const IMG_DIR = 'C:\\Users\\paul\\.openclaw\\workspace';
const IMAGES = [
  'aicut_worldcup_main.png',
  'aicut_worldcup_01.png',
  'aicut_worldcup_02.png',
  'aicut_worldcup_03.png',
  'aicut_worldcup_cta.png'
];

// 텍스트 블록 (이모지 포함, 각 2~3줄)
const TEXT_BLOCKS = [
  ['2026 월드컵이 한창입니다. 경기장의 열기가 그대로 SNS로 이어지면서 숏폼 콘텐츠의 소비량이 폭발적으로 증가하고 있습니다. 특히 응원 릴스, 경기 하이라이트, 선수 인터뷰 영상이 가장 빠르게 확산되는 콘텐츠로 자리잡았습니다.'],
  ['릴스는 15~30초, 완전 시청률이 핵심입니다. 유튜브 쇼츠는 30~60초로 좋아요율, 틱톡은 15~60초로 재시청과 공유율이 중요합니다. 월드컵 콘텐츠는 각 플랫폼 특성에 맞게 최적화해야 조회수가 극대화됩니다.'],
  ['경기 종료 후 30분이 골든타임입니다. 승리 세리머니, 결정적 장면, 선수 인터뷰를 빠르게 편집해서 발행하세요. 실시간 반응 콘텐츠가 월드컵 숏폼의 핵심입니다.'],
  ['에이컷 자체 분석 결과, 월드컵 시즌 숏폼 참여율은 일반 피드 대비 평균 3.7배 높았습니다. 주 3~4회 꾸준히 발행한 계정의 팔로워 증가율이 5.8배 차이났습니다.'],
  ['바쁜 시즌, 매일 콘텐츠를 기획·촬영·편집하는 것은 한계가 있습니다. 촬영 원본만 보내주세요. 에이컷이 릴스·쇼츠·틱톡에 최적화된 숏폼으로 편집해 드립니다.\n\n카카오톡: pf.kakao.com/_GIesX/chat\n이메일: master@aicut.co.kr\n홈페이지: aicut.co.kr\n\n#릴스알고리즘 #월드컵 #월드컵마케팅 #숏폼마케팅 #AI영상편집 #영상편집아웃소싱 #에이컷 #릴스 #쇼츠 #틱톡 #스포츠마케팅 #응원릴스 #경기하이라이트 #숏폼콘텐츠 #인스타그램릴스 #유튜브쇼츠 #틱톡마케팅 #여름마케팅 #하반기준비 #영상편집 #영상제작 #마케팅전략 #콘텐츠마케팅 #SNS마케팅 #디지털마케팅 #브랜디드콘텐츠 #영상외주 #AICUT #무료상담 #6월마케팅']
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log('=== 블로그 작성 + 가운데 정렬 적용 ===\n');
  
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  await ctx.grantPermissions(['clipboard-write', 'clipboard-read']);
  
  // Redirect=Write 탭 (새 글) 또는 Redirect=Update 탭 찾기
  let page = ctx.pages().find(p => p.url().includes('Redirect=Write'));
  if (!page) page = ctx.pages().find(p => p.url().includes('Redirect=Update'));
  
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(5000);
  } else {
    await page.bringToFront();
    await page.waitForTimeout(3000);
  }
  
  const pf = page.frames().find(f => f.url().includes('PostWriteForm') || f.url().includes('PostUpdateForm'));
  if (!pf) { console.log('에디터 프레임 없음'); await ctx.close(); return; }
  console.log('에디터 접근 ✅');
  
  // Step 0: 초기화
  console.log('\n0. 초기화...');
  await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se.setDocumentTitle('2026 월드컵, 숏폼 마케팅으로 응원 열기 올리는 법');
    se._canvasScrollingService.focusToFirstComp();
  });
  await sleep(2000);
  console.log('   ✅ 초기화 완료');
  
  // 이미지 base64 미리 로드
  const imgB64s = IMAGES.map(name => {
    const buf = fs.readFileSync(IMG_DIR + '\\' + name);
    return buf.toString('base64');
  });
  
  // Step 1~5: 텍스트 + 이미지 교차 입력
  for (let i = 0; i < TEXT_BLOCKS.length; i++) {
    console.log(`\n${i+1}. 텍스트 블록 + 이미지...`);
    
    // (A) 텍스트 입력
    for (const line of TEXT_BLOCKS[i]) {
      await pf.evaluate((text) => {
        SmartEditor._editors['blogpc001']._editingService.write(text);
      }, line);
      await sleep(200);
    }
    console.log(`   ✅ 텍스트 입력`);
    
    // (B) 이미지 paste (마지막 텍스트 블록엔 CTA 이미지)
    if (i < IMAGES.length) {
      await page.evaluate((b64img) => {
        const binary = atob(b64img);
        const arr = new Uint8Array(binary.length);
        for (let j = 0; j < binary.length; j++) arr[j] = binary.charCodeAt(j);
        navigator.clipboard.write([new ClipboardItem({ 'image/png': new Blob([arr], { type: 'image/png' }) })]);
      }, imgB64s[i]);
      await sleep(500);
      
      await pf.evaluate(() => {
        const ce = document.querySelector('[contenteditable="true"]');
        if (ce) { ce.focus(); const r = document.createRange(); r.selectNodeContents(ce); r.collapse(false);
          window.getSelection().removeAllRanges(); window.getSelection().addRange(r); }
      });
      await sleep(300);
      await page.keyboard.press('Control+v');
      await sleep(3000);
      console.log(`   ✅ 이미지 붙여넣기 (${IMAGES[i]})`);
    }
  }
  
  // Step 6: 가운데 정렬 적용
  console.log('\n6. 가운데 정렬 적용...');
  const alignResult = await pf.evaluate(() => {
    const wrap = document.querySelector('.se-components-wrap .se-content') || 
                 document.querySelector('.se-components-wrap') ||
                 document.querySelector('.se-content');
    
    const allParas = document.querySelectorAll('.se-text-paragraph');
    let count = 0;
    allParas.forEach(p => {
      // 좌측 정렬 클래스 제거
      p.classList.remove('se-text-paragraph-align-left');
      // 가운데 정렬 클래스 추가
      p.classList.add('se-text-paragraph-align-center');
      // 스타일 설정
      p.style.textAlign = 'center';
      // span 내부의 se-ff-normal 등 유지하면서 정렬
      const span = p.querySelector('span');
      if (span) {
        span.style.textAlign = 'center';
        span.style.display = 'block';
      }
      count++;
    });
    
    // 변경 알림
    wrap?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    
    return { total: allParas.length, updated: count };
  });
  console.log(`   ✅ ${alignResult.updated}/${alignResult.total} paragraph 정렬 적용`);
  
  await sleep(2000);
  
  // Step 7: 정렬 확인
  console.log('\n7. 정렬 상태 확인...');
  const alignCheck = await pf.evaluate(() => {
    const paras = document.querySelectorAll('.se-text-paragraph');
    let center = 0, left = 0, other = 0;
    paras.forEach(p => {
      const cls = p.className;
      if (cls.includes('align-center')) center++;
      else if (cls.includes('align-left')) left++;
      else other++;
    });
    return { total: paras.length, center, left, other, sampleClass: paras[0]?.className?.substring(0, 80) || 'none' };
  });
  console.log(`   가운데 정렬: ${alignCheck.center}/${alignCheck.total}`);
  console.log(`   샘플 class: ${alignCheck.sampleClass}`);
  
  // Step 8: 최종 컴포넌트 구조 확인
  console.log('\n8. 최종 구조 확인...');
  const final = await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const wrap = document.querySelector('.se-components-wrap');
    const comps = wrap?.querySelectorAll('.se-component');
    const order = [];
    comps?.forEach(c => {
      const cls = c.className;
      if (cls.includes('se-image')) order.push('img');
      else if (cls.includes('se-text')) order.push('txt');
      else if (cls.includes('se-documentTitle')) order.push('title');
      else order.push('?');
    });
    return {
      title: se.getDocumentTitle(),
      textLen: se.getContentText().length,
      order: order.join(' → '),
      total: comps?.length || 0,
      imgs: wrap?.querySelectorAll('.se-component.se-image').length || 0,
      txts: wrap?.querySelectorAll('.se-component.se-text').length || 0
    };
  });
  console.log(`   구조: ${final.order}`);
  console.log(`   textLen: ${final.textLen}`);
  
  // 저장 시도
  console.log('\n9. 저장...');
  let saved = false;
  for (let a = 0; a < 10; a++) {
    saved = await page.evaluate(() => {
      const all = document.querySelectorAll('button, em, a, span');
      for (const el of all) {
        if ((el.textContent || '').trim() === '저장' && el.offsetParent !== null) {
          el.click(); return true;
        }
      }
      return false;
    });
    if (saved) break;
    await sleep(1000);
  }
  console.log(`   저장: ${saved ? '✅' : '⚠️ 자동 저장 의존'}`);
  
  console.log('\n✅ 완료');
  await ctx.close();
})().catch(e => console.error('FATAL:', e.message));
