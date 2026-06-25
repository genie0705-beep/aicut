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

// 각 텍스트 블록 (image 사이에 들어갈 내용)
const TEXT_BLOCKS = [
  // Block 1 (after main image)
  [
    '2026 월드컵이 한창입니다. 경기장의 열기가 그대로 SNS로 이어지면서 숏폼 콘텐츠의 소비량이 폭발적으로 증가하고 있습니다.',
    '특히 응원 릴스, 경기 하이라이트, 선수 인터뷰 영상이 가장 빠르게 확산되는 콘텐츠로 자리잡았습니다.',
  ],
  // Block 2 (after 01 image)
  [
    '릴스는 15~30초, 완전 시청률이 핵심입니다. 유튜브 쇼츠는 30~60초로 좋아요율, 틱톡은 15~60초로 재시청과 공유율이 중요합니다.',
    '월드컵 콘텐츠는 각 플랫폼 특성에 맞게 최적화해야 조회수가 극대화됩니다.',
  ],
  // Block 3 (after 02 image)
  [
    '경기 종료 후 30분이 골든타임입니다. 승리 세리머니, 결정적 장면, 선수 인터뷰를 빠르게 편집해서 발행하세요.',
    '실시간 반응 콘텐츠가 월드컵 숏폼의 핵심입니다.',
  ],
  // Block 4 (after 03 image)
  [
    '에이컷 자체 분석 결과, 월드컵 시즌 숏폼 참여율은 일반 피드 대비 평균 3.7배 높았습니다.',
    '주 3~4회 꾸준히 발행한 계정의 팔로워 증가율이 5.8배 차이났습니다.',
  ],
  // Block 5 (after CTA image)
  [
    '바쁜 시즌, 매일 콘텐츠를 기획·촬영·편집하는 것은 한계가 있습니다. 촬영 원본만 보내주세요.',
    '에이컷이 릴스·쇼츠·틱톡에 최적화된 숏폼으로 편집해 드립니다.',
    '',
    '카카오톡: pf.kakao.com/_GIesX/chat',
    '이메일: master@aicut.co.kr',
    '홈페이지: aicut.co.kr',
    '',
    '#릴스알고리즘 #월드컵 #월드컵마케팅 #숏폼마케팅 #AI영상편집 #영상편집아웃소싱 #에이컷 #릴스 #쇼츠 #틱톡 #스포츠마케팅 #응원릴스 #경기하이라이트 #숏폼콘텐츠 #인스타그램릴스 #유튜브쇼츠 #틱톡마케팅 #여름마케팅 #하반기준비 #영상편집 #영상제작 #마케팅전략 #콘텐츠마케팅 #SNS마케팅 #디지털마케팅 #브랜디드콘텐츠 #영상외주 #AICUT #무료상담 #6월마케팅'
  ]
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log('=== 4-0-1 구조 블로그 작성 ===\n');
  
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  await ctx.grantPermissions(['clipboard-write', 'clipboard-read']);
  
  // 페이지 준비
  let page = ctx.pages().find(p => p.url().includes('Redirect=Update'));
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/aicut?Redirect=Update&logNo=224326578253', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(5000);
  } else {
    await page.bringToFront();
    await page.waitForTimeout(3000);
  }
  
  const pf = page.frames().find(f => f.url().includes('PostUpdateForm'));
  if (!pf) { console.log('PostUpdateForm 없음'); await ctx.close(); return; }
  
  // Step 0: 초기화
  console.log('0. 에디터 초기화...');
  await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se.setDocumentTitle('2026 월드컵, 숏폼 마케팅으로 응원 열기 올리는 법');
    se._canvasScrollingService.focusToFirstComp();
  });
  await sleep(2000);
  
  // 이미지 base64 미리 로드
  const imgB64s = IMAGES.map(name => {
    const buf = fs.readFileSync(IMG_DIR + '\\' + name);
    return buf.toString('base64');
  });
  
  // Step 1~5: 텍스트 + 이미지 교차 입력 (4-0-1 구조)
  for (let i = 0; i < TEXT_BLOCKS.length; i++) {
    console.log(`\n--- Step ${i+1}: 텍스트 블록 ${i+1} ---`);
    
    // (A) 텍스트 입력: write()로 각 줄 입력
    const lines = TEXT_BLOCKS[i];
    for (let li = 0; li < lines.length; li++) {
      await pf.evaluate((text) => {
        const es = SmartEditor._editors['blogpc001']._editingService;
        es.write(text);
      }, lines[li]);
      if (li < lines.length - 1) {
        await pf.evaluate(() => {
          SmartEditor._editors['blogpc001']._editingService.lineBreak();
        });
      }
      await sleep(200);
    }
    console.log(`   ✅ 텍스트 입력 (${lines.length}줄)`);
    
    // (B) 이미지 paste (마지막 블록 제외 - CTA 이미지는 마지막)
    if (i < IMAGES.length) {
      console.log(`   이미지 붙여넣기: ${IMAGES[i]}...`);
      
      // 클립보드에 image/png 적재
      await page.evaluate((b64img) => {
        const binary = atob(b64img);
        const arr = new Uint8Array(binary.length);
        for (let j = 0; j < binary.length; j++) arr[j] = binary.charCodeAt(j);
        const blob = new Blob([arr], { type: 'image/png' });
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      }, imgB64s[i]);
      await sleep(500);
      
      // contenteditable에 포커스 + 커서 끝으로
      await pf.evaluate(() => {
        const ce = document.querySelector('[contenteditable="true"]');
        if (ce) {
          ce.focus();
          const r = document.createRange();
          r.selectNodeContents(ce);
          r.collapse(false);
          const s = window.getSelection();
          s.removeAllRanges();
          s.addRange(r);
        }
      });
      await sleep(300);
      
      // Ctrl+V (메인 페이지 레벨)
      await page.keyboard.press('Control+v');
      await sleep(3000);
      console.log(`   ✅ 이미지 붙여넣기 완료`);
    }
  }
  
  // Step 6: 최종 확인
  await sleep(2000);
  const final = await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const wrap = document.querySelector('.se-components-wrap');
    const comps = wrap?.querySelectorAll('.se-component');
    const compList = [];
    comps?.forEach(c => {
      const cls = c.className;
      if (cls.includes('se-image')) compList.push('image');
      else if (cls.includes('se-text')) compList.push('text');
      else if (cls.includes('se-documentTitle')) compList.push('title');
      else compList.push(cls.substring(0, 20));
    });
    return {
      title: se.getDocumentTitle(),
      textLen: se.getContentText().length,
      compOrder: compList,
      totalComps: comps?.length || 0,
      imgs: wrap?.querySelectorAll('.se-component.se-image').length || 0,
      texts: wrap?.querySelectorAll('.se-component.se-text').length || 0
    };
  });
  
  console.log('\n=== 최종 결과 ===');
  console.log(JSON.stringify(final, null, 2));
  console.log('\n컴포넌트 순서:', final.compOrder.join(' → '));
  
  // 저장 시도
  console.log('\n--- 저장 시도 ---');
  let saved = false;
  for (let a = 0; a < 10; a++) {
    saved = await page.evaluate(() => {
      const all = document.querySelectorAll('button, em, a, span');
      for (const el of all) {
        const t = (el.textContent || '').trim();
        if (t === '저장' && el.offsetParent !== null) {
          el.click(); return true;
        }
      }
      return false;
    });
    if (saved) break;
    await sleep(1000);
  }
  console.log(`저장: ${saved ? '✅' : '⚠️ 자동 저장 의존'}`);
  
  await ctx.close();
  console.log('\n✅ 완료');
})().catch(e => console.error('FATAL:', e.message));
