const { chromium } = require('playwright');
const fs = require('fs');

const TITLE = '피부과 영상 마케팅, 숏폼 편집 하나로 해결되는 이유 | 여름 시즌 준비';
const IMG_DIR = 'C:\\Users\\paul\\.openclaw\\workspace\\';
const IMG_FILES = [
  'aicut_blog_hospital_main.png',
  'aicut_blog_hospital_01.png',
  'aicut_blog_hospital_02.png',
  'aicut_blog_hospital_03.png',
  'aicut_blog_hospital_cta.png',
];

// 본문 블록 (반응형 모바일 최적화, 평균 24자, 모두 text-align:center)
const BLOCKS = [
  // ── 섹션 1 ──
  { type: 'paragraph', text: '', style: { textAlign: 'center' } },
  { type: 'heading2', text: '☀️ 요즘 병원 마케팅, \'숏폼\'이 전부다', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '"원장님, 인스타그램 하세요?"', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '요즘 병원·의원에 가면 꼭 듣는 질문입니다.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '환자들이 병원을 고를 때', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '<b>인스타그램이나 유튜브 숏폼</b>을 먼저 본다고 해요.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '실제로 릴스·쇼츠에 병원 소개 영상을 올리면', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '일반 텍스트보다 문의율이 3배 이상 높습니다.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '하지만 문제는 <b>영상 찍고 편집하는 게 너무 어렵다</b>는 거예요.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '간호사님한테 폰으로 찍어달라 하기도 애매하고,', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '<b>의료광고 규제</b> 때문에 뭐라도 잘못 나갈까 겁나고요.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '그래서 준비했습니다.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '<b>피부과·치과·한의원·성형외과</b>에서', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '바로 써먹을 수 있는 <b>영상 마케팅 전략</b>을 알려드릴게요.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '', style: { textAlign: 'center' } },
  // ── 섹션 2 ──
  { type: 'heading2', text: '📋 직접 찍고 직접 편집하면 생기는 일', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '많은 병원 원장님들이 영상 마케팅을 시작했다가', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '금방 포기하는 이유, 알고 계신가요?', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '<b>첫째, 촬영 시간이 너무 낭비됩니다.</b>', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '원장님이 직접 영상을 찍으려면', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '진료 시간 내야 하고, 스크립트도 짜야 합니다.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '<b>둘째, 편집 프로그램이 너무 어렵습니다.</b>', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '프리미어 프로나 파이널 컷을', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '배우려면 최소 3개월은 걸려요.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '<b>셋째, 의료광고 규제를 다 외우기 어렵습니다.</b>', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '식약처 심의 기준, 네이버 정책까지 고려하면', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '영상 하나 올리기도 부담스럽습니다.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '이런 고민, 저희가 다 해결해드립니다.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '', style: { textAlign: 'center' } },
  // ── 섹션 3 ──
  { type: 'heading2', text: '✅ 의료광고 규제, 전문 에디터가 체크합니다', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '"의료광고, 영상 올려도 돼요?"', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '네, 가능합니다.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '단, <b>몇 가지 규정을 꼭 지켜야 해요.</b>', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '🔹 체험담·효과를 과장하지 않을 것', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '🔹 \'확실한 효과\'처럼 단정적 표현 금지', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '🔹 치료 전·후 사진은 진실하게 표시', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '🔹 의료법·약사법·식품위생법 준수 내용만', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '처음엔 하나하나 신경 쓰이는 게 정상입니다.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '하지만 <b>경험이 많은 편집 에디터</b>가 있으면', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '이런 규제를 완벽하게 지키면서도', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '<b>마케팅 효과는 극대화</b>할 수 있어요.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '에이컷은 병원 영상 편집 전문 에디터가', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '의료광고 규제를 모두 숙지하고 작업합니다.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '', style: { textAlign: 'center' } },
  // ── 섹션 4 ──
  { type: 'heading2', text: '🎯 여름 시즌, 피부과·의원 마케팅 전략', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '7월 중순, 무더위가 절정인 지금.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '피부과·의원에 딱 맞는 <b>여름 시즌 콘텐츠</b>를 소개합니다.', style: { textAlign: 'center' } },
  { type: 'heading3', text: '✔️ 선크림·자외선 차단 영상', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '여름 필수 아이템, 병원에서 추천하면 신뢰도 UP', style: { textAlign: 'center' } },
  { type: 'heading3', text: '✔️ 다이어트·체형 관리 시즌 영상', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '여름 휴가 전 관리법, 환자 공감 얻기 좋음', style: { textAlign: 'center' } },
  { type: 'heading3', text: '✔️ 원장님 브랜딩 숏폼', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '신뢰감 있는 전문가 이미지, 숏폼으로 각인', style: { textAlign: 'center' } },
  { type: 'heading3', text: '✔️ 시술 소개 60초 요약', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '궁금증을 해소하는 숏폼, 예약 전환율 UP', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '이런 영상들을 <b>매주 2~3개씩 꾸준히 올리면</b>', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '3개월 후에는 병원 인스타그램이', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '지역 내에서 가장 믿음직한 채널로 자리잡습니다.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '', style: { textAlign: 'center' } },
  // ── 섹션 5 ──
  { type: 'heading2', text: '📸 병원에 딱 맞는 영상, 어떻게 만드나요?', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '에이컷의 병원 영상 작업 프로세스를 소개합니다.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '<b>STEP 1:</b> 원장님·실장님께서 촬영 영상 전송', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '핸드폰으로 3~5분만 찍어 보내주세요.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '대본도 콘티도 필요 없습니다.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '<b>STEP 2:</b> 에이컷 에디터가 1~2일 내 편집 완료', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '숏폼 2~3개, 혹은 일반 영상 1개로 맞춤 편집', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '의료광고 규제 체크까지 완벽하게!', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '<b>STEP 3:</b> 검토 후 수정 요청 (무제한)', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '마음에 들 때까지 수정 가능합니다.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '<b>STEP 4:</b> 완료된 영상 다운로드 후 게시', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '원장님은 그냥 올리기만 하면 끝!', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '복잡한 편집 프로그램, 이제 안녕입니다.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '', style: { textAlign: 'center' } },
  // ── 섹션 6 ──
  { type: 'heading2', text: '🔥 하반기 마케팅, 준비된 병원이 이깁니다', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '벌써 7월입니다.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '하반기 병원 마케팅 전략, 세워두셨나요?', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '상반기에는 블로그나 인스타로', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '텍스트 위주 마케팅을 했다면,', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '<b>하반기에는 영상 마케팅</b>을 추가해보세요.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '영상 하나가 환자의 마음을 움직입니다.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '직접 찍고, 전문가가 편집하는', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '<b>가장 효율적인 병원 마케팅</b>, 지금 시작하세요.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '문의는 아래 연락처로 편하게 주세요!', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '', style: { textAlign: 'center' } },
  // ── CTA ──
  { type: 'paragraph', text: '<b>📞 카카오톡 상담:</b> https://pf.kakao.com/_GIesX/chat', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '<b>📧 이메일:</b> master@aicut.co.kr', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '<b>🌐 홈페이지:</b> https://aicut.co.kr', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '', style: { textAlign: 'center' } },
  // ── 해시태그 ──
  { type: 'paragraph', text: '#병원영상편집 #의료마케팅 #피부과마케팅 #숏폼마케팅 #영상편집외주 #병원마케팅 #의료광고 #원장님마케팅 #인스타마케팅 #영상마케팅 #에이컷 #영상편집 #숏폼편집 #릴스마케팅 #여름마케팅 #하반기마케팅 #병원SNS #의료숏폼 #치과마케팅 #한의원마케팅 #성형외과마케팅 #병원인스타 #의료영상 #전문가편집 #마케팅전략 #지역마케팅 #무더위 #피부관리 #여름피부 #의료콘텐츠', style: { textAlign: 'center' } },
];

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const write = pages.find(p => p.url().includes('Redirect=Write'));
  if (!write) { console.log('❌ No write tab'); process.exit(1); }

  const frameEl = await write.$('#mainFrame');
  if (!frameEl) { console.log('❌ No iframe'); process.exit(1); }
  const frame = await frameEl.contentFrame();
  if (!frame) { console.log('❌ Cannot access iframe'); process.exit(1); }

  console.log('✅ iframe 접근 성공');

  // 1. 제목 설정
  await frame.evaluate((title) => {
    const ed = SmartEditor._editors['blogpc001'];
    ed.setDocumentTitle(title);
  }, TITLE);
  console.log('✅ 제목 설정 완료:', TITLE);

  // 2. 본문 블록 설정 (기존 내용은 제거됨)
  await frame.evaluate((blocks) => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    data.document.blocks = blocks;
    ed.setDocumentData(data);
  }, BLOCKS);
  console.log('✅ 본문 블록 설정 완료 (', BLOCKS.length, '블록)');

  // 3. canvas 업데이트 (React 반영)
  await frame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    // title 필드 보이게
    const titleEl = document.querySelector('div[contenteditable].se-text-editor');
    if (titleEl) {
      titleEl.style.display = 'block';
      titleEl.style.visibility = 'visible';
    }
    // canvas 리렌더링 트리거
    const canvas = document.querySelector('.se-canvas');
    if (canvas) {
      // 강제 리렌더링을 위한 이벤트
      canvas.dispatchEvent(new Event('resize', { bubbles: true }));
    }
  });
  console.log('✅ canvas 업데이트');
  
  // 4. 캡처 확인
  await frame.waitForTimeout(2000);
  const titleText = await frame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    return ed.getDocumentTitle();
  });
  console.log('✅ 설정된 제목:', titleText);

  // 5. 이미지 업로드
  for (let i = 0; i < IMG_FILES.length; i++) {
    const imgPath = IMG_DIR + IMG_FILES[i];
    console.log(`\n📸 이미지 ${i+1}/5 업로드: ${IMG_FILES[i]}`);
    
    // 사진 버튼 클릭
    const photoBtn = await frame.$('.se-image-toolbar-button');
    if (!photoBtn) {
      console.log(`  ⚠️ 사진 버튼 없음, 다른 방식 시도`);
      // 대체: 파일 input 직접 찾기
      const fileInput = await frame.$('input[type="file"]');
      if (fileInput) {
        await fileInput.setInputFiles(imgPath);
        console.log('  ✅ 파일 input으로 업로드');
      } else {
        console.log('  ❌ 업로드 실패');
      }
    } else {
      await photoBtn.click();
      await frame.waitForTimeout(1000);
      
      // 파일 선택
      const fileChooser = await frame.$('input[type="file"]');
      if (fileChooser) {
        await fileChooser.setInputFiles(imgPath);
        console.log('  ✅ 파일 선택됨, 업로드 대기...');
        await frame.waitForTimeout(6000);
      }
    }
    
    // canvas 클릭으로 메뉴 닫기
    const canvas = await frame.$('.se-canvas');
    if (canvas) await canvas.click();
    await frame.waitForTimeout(500);
  }
  
  console.log('\n✅ 모든 작업 완료!');
  console.log('제목:', TITLE);
  console.log('본문:', BLOCKS.filter(b => b.text.length > 0).length, '블록');
  
  // 이미지 정렬 확인
  const alignInfo = await frame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const imgs = data.document.blocks.filter(b => b.type === 'image');
    return imgs.map(b => ({ type: b.type, align: b.align, url: (b.url||'').substring(0,30) }));
  });
  console.log('이미지 정렬:', JSON.stringify(alignInfo));
  
  process.exit(0);
}

main().catch(e => { console.error('❌ 오류:', e.message); process.exit(1); });
