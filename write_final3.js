const { chromium } = require('playwright');

const TITLE = '피부과 영상 마케팅, 숏폼 편집 하나로 해결되는 이유 | 여름 시즌 준비';

// 모든 텍스트를 하나의 HTML로 (한 번에 삽입)
const FULL_HTML = [
  "<h2>☀️ 요즘 병원 마케팅, '숏폼'이 전부다</h2>",
  '<p>"원장님, 인스타그램 하세요?"</p>',
  '<p>요즘 병원·의원에 가면 꼭 듣는 질문입니다.</p>',
  '<p>환자들이 병원을 고를 때</p>',
  '<p>인스타그램이나 유튜브 숏폼을 먼저 본다고 해요.</p>',
  '<p>실제로 릴스·쇼츠에 병원 소개 영상을 올리면</p>',
  '<p>일반 텍스트보다 문의율이 3배 이상 높습니다.</p>',
  '<p>하지만 문제는 영상 찍고 편집하는 게 너무 어렵다는 거예요.</p>',
  '<p>간호사님한테 폰으로 찍어달라 하기도 애매하고,</p>',
  '<p>의료광고 규제 때문에 뭐라도 잘못 나갈까 겁나고요.</p>',
  '<p>그래서 준비했습니다.</p>',
  '<p>피부과·치과·한의원·성형외과에서</p>',
  '<p>바로 써먹을 수 있는 영상 마케팅 전략을 알려드릴게요.</p>',
  '<p><br></p>',
  "<h2>📋 직접 찍고 직접 편집하면 생기는 일</h2>",
  '<p>많은 병원 원장님들이 영상 마케팅을 시작했다가</p>',
  '<p>금방 포기하는 이유, 알고 계신가요?</p>',
  '<p><b>첫째, 촬영 시간이 너무 낭비됩니다.</b></p>',
  '<p>원장님이 직접 영상을 찍으려면</p>',
  '<p>진료 시간 내야 하고, 스크립트도 짜야 합니다.</p>',
  '<p><b>둘째, 편집 프로그램이 너무 어렵습니다.</b></p>',
  '<p>프리미어 프로나 파이널 컷을</p>',
  '<p>배우려면 최소 3개월은 걸려요.</p>',
  '<p><b>셋째, 의료광고 규제를 다 외우기 어렵습니다.</b></p>',
  '<p>식약처 심의 기준, 네이버 정책까지 고려하면</p>',
  '<p>영상 하나 올리기도 부담스럽습니다.</p>',
  '<p>이런 고민, 저희가 다 해결해드립니다.</p>',
  '<p><br></p>',
  "<h2>✅ 의료광고 규제, 전문 에디터가 체크합니다</h2>",
  '<p>"의료광고, 영상 올려도 돼요?"</p>',
  '<p>네, 가능합니다.</p>',
  '<p>단, <b>몇 가지 규정을 꼭 지켜야 해요.</b></p>',
  '<p>🔹 체험담·효과를 과장하지 않을 것</p>',
  '<p>🔹 \'확실한 효과\'처럼 단정적 표현 금지</p>',
  '<p>🔹 치료 전·후 사진은 진실하게 표시</p>',
  '<p>🔹 의료법·약사법·식품위생법 준수 내용만</p>',
  '<p>처음엔 하나하나 신경 쓰이는 게 정상입니다.</p>',
  '<p>하지만 <b>경험이 많은 편집 에디터</b>가 있으면</p>',
  '<p>이런 규제를 완벽하게 지키면서도</p>',
  '<p><b>마케팅 효과는 극대화</b>할 수 있어요.</p>',
  '<p>에이컷은 병원 영상 편집 전문 에디터가</p>',
  '<p>의료광고 규제를 모두 숙지하고 작업합니다.</p>',
  '<p><br></p>',
  "<h2>🎯 여름 시즌, 피부과·의원 마케팅 전략</h2>",
  '<p>7월 중순, 무더위가 절정인 지금.</p>',
  '<p>피부과·의원에 딱 맞는 <b>여름 시즌 콘텐츠</b>를 소개합니다.</p>',
  '<p>✔️ 선크림·자외선 차단 영상</p>',
  '<p>여름 필수 아이템, 병원에서 추천하면 신뢰도 UP</p>',
  '<p>✔️ 다이어트·체형 관리 시즌 영상</p>',
  '<p>여름 휴가 전 관리법, 환자 공감 얻기 좋음</p>',
  '<p>✔️ 원장님 브랜딩 숏폼</p>',
  '<p>신뢰감 있는 전문가 이미지, 숏폼으로 각인</p>',
  '<p>✔️ 시술 소개 60초 요약</p>',
  '<p>궁금증을 해소하는 숏폼, 예약 전환율 UP</p>',
  '<p>이런 영상들을 <b>매주 2~3개씩 꾸준히 올리면</b></p>',
  '<p>3개월 후에는 병원 인스타그램이</p>',
  '<p>지역 내에서 가장 믿음직한 채널로 자리잡습니다.</p>',
  '<p><br></p>',
  "<h2>📸 병원에 딱 맞는 영상, 어떻게 만드나요?</h2>",
  '<p>에이컷의 병원 영상 작업 프로세스를 소개합니다.</p>',
  '<p><b>STEP 1:</b> 원장님·실장님께서 촬영 영상 전송</p>',
  '<p>핸드폰으로 3~5분만 찍어 보내주세요.</p>',
  '<p>대본도 콘티도 필요 없습니다.</p>',
  '<p><b>STEP 2:</b> 에이컷 에디터가 1~2일 내 편집 완료</p>',
  '<p>숏폼 2~3개, 혹은 일반 영상 1개로 맞춤 편집</p>',
  '<p>의료광고 규제 체크까지 완벽하게!</p>',
  '<p><b>STEP 3:</b> 검토 후 수정 요청 (무제한)</p>',
  '<p>마음에 들 때까지 수정 가능합니다.</p>',
  '<p><b>STEP 4:</b> 완료된 영상 다운로드 후 게시</p>',
  '<p>원장님은 그냥 올리기만 하면 끝!</p>',
  '<p>복잡한 편집 프로그램, 이제 안녕입니다.</p>',
  '<p><br></p>',
  "<h2>🔥 하반기 마케팅, 준비된 병원이 이깁니다</h2>",
  '<p>벌써 7월입니다.</p>',
  '<p>하반기 병원 마케팅 전략, 세워두셨나요?</p>',
  '<p>상반기에는 블로그나 인스타로</p>',
  '<p>텍스트 위주 마케팅을 했다면,</p>',
  '<p><b>하반기에는 영상 마케팅</b>을 추가해보세요.</p>',
  '<p>영상 하나가 환자의 마음을 움직입니다.</p>',
  '<p>직접 찍고, 전문가가 편집하는</p>',
  '<p><b>가장 효율적인 병원 마케팅</b>, 지금 시작하세요.</p>',
  '<p>문의는 아래 연락처로 편하게 주세요!</p>',
  '<p><br></p>',
  '<p>📞 카카오톡 상담: https://pf.kakao.com/_GIesX/chat</p>',
  '<p>📧 이메일: master@aicut.co.kr</p>',
  '<p>🌐 홈페이지: https://aicut.co.kr</p>',
  '<p><br></p>',
  '<p>#병원영상편집 #의료마케팅 #피부과마케팅 #숏폼마케팅 #영상편집외주 #병원마케팅 #의료광고 #원장님마케팅 #인스타마케팅 #영상마케팅 #에이컷 #영상편집 #숏폼편집 #릴스마케팅 #여름마케팅 #하반기마케팅 #병원SNS #의료숏폼 #치과마케팅 #한의원마케팅 #성형외과마케팅 #병원인스타 #의료영상 #전문가편집 #마케팅전략 #지역마케팅 #무더위 #피부관리 #여름피부 #의료콘텐츠</p>',
].join('\n');

async function waitForSE(page) {
  for (let i = 0; i < 20; i++) {
    const fe = await page.$('#mainFrame');
    if (fe) {
      const f = await fe.contentFrame();
      if (f) {
        try {
          const ok = await f.evaluate(() => typeof SmartEditor?._editors?.['blogpc001'] !== 'undefined');
          if (ok) return f;
        } catch(e) { /* retry */ }
      }
    }
    await page.waitForTimeout(1500);
  }
  return null;
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 새 탭
  const page = await ctx.newPage();
  page.on('dialog', async d => { await d.accept(); });
  
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('🔄 새 에디터 로딩...');
  
  const f = await waitForSE(page);
  if (!f) { console.log('❌ 로드 실패'); process.exit(1); }

  // 0. 팝업 정리
  await f.evaluate(() => {
    document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove());
  });
  console.log('✅ 팝업 정리');
  await f.waitForTimeout(500);

  // 1. 제목 설정
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅ 제목 설정');

  // 2. SE4 본문에 텍스트 삽입 (insertHTML 방식)
  await f.evaluate((html) => {
    const ed = SmartEditor._editors['blogpc001'];
    
    // 1) 데이터 모델 설정
    const data = ed.getDocumentData();
    data.document.blocks = [];
    data.document.removedImages = [];
    
    // div로 파싱
    const div = document.createElement('div');
    div.innerHTML = html;
    
    let currentBlock = null;
    Array.from(div.children).forEach(child => {
      const tag = child.tagName.toLowerCase();
      const text = child.innerHTML;
      
      if (tag === 'h2') {
        data.document.blocks.push({ type: 'heading2', text: text, style: { textAlign: 'center' } });
      } else if (tag === 'p') {
        if (text === '<br>' || text === '') {
          data.document.blocks.push({ type: 'paragraph', text: '', style: { textAlign: 'center' } });
        } else {
          data.document.blocks.push({ type: 'paragraph', text: text, style: { textAlign: 'center' } });
        }
      }
    });
    
    ed.setDocumentData(data);
    
    // 2) Canvas 강제 업데이트 - React 리렌더링이 안 되면 데이터 기준 저장됨
    const canvas = document.querySelector('.se-canvas');
    if (canvas) {
      // 강제 리플로우
      canvas.style.display = 'none';
      setTimeout(() => {
        canvas.style.display = '';
        // Scroll 이벤트로 리렌더링 트리거
        canvas.dispatchEvent(new Event('scroll', { bubbles: true }));
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
    
    // 3) 제목 영역 다시 표시
    const titleEl = document.querySelector('.se-components-wrap');
    if (titleEl) {
      titleEl.style.display = 'block';
    }
  }, FULL_HTML);
  
  console.log('✅ 본문 데이터 설정 완료');
  await f.waitForTimeout(2000);
  
  // 3. 이미지 업로드
  const IMG_DIR = 'C:\\Users\\paul\\.openclaw\\workspace\\';
  for (const imgFile of [
    'aicut_blog_hospital_main.png',
    'aicut_blog_hospital_01.png',
    'aicut_blog_hospital_02.png',
    'aicut_blog_hospital_03.png',
    'aicut_blog_hospital_cta.png',
  ]) {
    console.log(`📸 ${imgFile}`);
    await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup').forEach(el => el.remove()));
    
    await f.evaluate(() => document.querySelector('.se-image-toolbar-button')?.click());
    await f.waitForTimeout(1500);
    
    const fi = await f.$('input[type="file"]');
    if (fi) {
      await fi.setInputFiles(IMG_DIR + imgFile);
      console.log('  ✅ 업로드 대기...');
      await f.waitForTimeout(8000);
    }
  }
  
  // 4. 이미지 정렬 센터
  await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    let imgCount = 0;
    data.document.blocks.forEach(b => {
      if (b.type === 'image') { b.align = 'center'; imgCount++; }
    });
    ed.setDocumentData(data);
    console.log('이미지 정렬:', imgCount);
  });
  
  console.log('✅ 이미지 업로드 완료');
  
  // 5. 저장
  await f.waitForTimeout(500);
  const sBtn = await f.$('button:has-text("저장"), span:has-text("저장")');
  if (sBtn) { await sBtn.click(); console.log('💾 저장 완료'); }
  await f.waitForTimeout(2000);
  
  // 6. 확인
  const check = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const blocks = data.document.blocks;
    const canvas = document.querySelector('.se-canvas');
    const counts = {};
    blocks.forEach(b => { counts[b.type] = (counts[b.type]||0)+1; });
    let chars = 0;
    blocks.forEach(b => { if (b.text) chars += b.text.length; });
    return {
      title: ed.getDocumentTitle(),
      total: blocks.length,
      counts,
      chars,
      canvasTextLen: (canvas?.innerText || '').length,
    };
  });
  
  console.log('\n📊 결과:', JSON.stringify(check, null, 2));
  
  if (check.chars > 1500) {
    console.log('\n✅ 텍스트 1,500자 이상 정상 입력 완료!');
  } else {
    console.log('\n⚠️ 텍스트 양 부족:', check.chars, '자');
  }
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
