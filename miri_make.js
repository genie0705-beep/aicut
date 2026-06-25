const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 블로그 이미지 스펙: 1000x600px, 카드뉴스 형태
// 미리캔버스에서 블로그 썸네일 크기로 새 디자인 생성 후 5장 순서대로 제작

const CARDS = [
  {
    no: 1,
    title: 'KPI Summary',
    bg: '다크 네이비 (#0D1630)',
    mainText: '매물 영상,\n올리고 싶은 만큼\n올리게 됐어요.',
    kpi: ['월 20편 정시 납품', '주 14h→2h 단축', '구독자 3배 성장'],
    accent: '민트/퍼플'
  },
  {
    no: 2,
    title: 'Problem',
    bg: '아이보리 (#FDFAF2)',
    mainText: '💡 이런 상황 반복됐어요',
    points: [
      '❌ 매달 편집자를 새로 구해야 했다',
      '❌ 매번 같은 설명을 처음부터 반복했다',
      '❌ 납품이 밀려 월 5~6편밖에 못 올렸다'
    ],
    quote: '"편집 때문에 포기하는 달이 많았어요."'
  },
  {
    no: 3,
    title: 'Reason',
    bg: '다크 네이비 (#0D1630)',
    mainText: '💡 에이컷을 선택한 이유',
    points: [
      '01  부동산 매물 영상 포트폴리오 직접 확인',
      '02  매물 자막 템플릿 시스템에 저장',
      '03  약정 없이 첫 달 테스트 가능'
    ],
    sub: '온보딩 한 번, 이후엔 원본만 업로드.'
  },
  {
    no: 4,
    title: 'Result Before/After',
    bg: '아이보리 (#FDFAF2)',
    mainText: '💡 도입 후 달라진 것들',
    before: ['월 5~6편 발행', '주 14시간 영상 업무', '매달 편집자 교체', '납품 평균 6일 지연'],
    after: ['월 20편 정시 납품', '주 2시간으로 단축', '전담 에디터 고정', '영업일 2~3일 납품'],
    highlight: '구독자 3배 성장'
  },
  {
    no: 5,
    title: 'CTA',
    bg: '다크 네이비 (#0D1630)',
    mainText: '편집 때문에 쌓이는 영상,\n이제 밀리지 않습니다.',
    sub: '부동산 영상 전담 편집팀\n월정액 · 48시간 납품 · 수정 무제한',
    cta: '무료 상담 신청 → aicut.co.kr',
    note: '계약 강제 없음 · 첫 달 언제든 해지 가능'
  }
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('miricanvas.com'));

  console.log('미리캔버스 접속 확인');
  await sleep(1000);

  // "디자인 만들기" 버튼 클릭 → 커스텀 사이즈 1000x600
  const makeBtn = await page.$('button:has-text("디자인 만들기")');
  if (makeBtn) {
    await makeBtn.click();
    console.log('"디자인 만들기" 클릭');
    await sleep(3000);
  }

  // 팝업/드롭다운 확인
  const popupState = await page.evaluate(() => {
    const modals = document.querySelectorAll('[class*="modal"], [class*="popup"], [class*="dropdown"]');
    const visibleBtns = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t).slice(0, 30);
    return { modalCount: modals.length, buttons: visibleBtns };
  });
  console.log('현재 버튼들:', JSON.stringify(popupState.buttons.slice(0, 15)));

  await sleep(1000);
  
  // 직접 사이즈 입력 옵션 찾기
  const customSizeEl = await page.$('button:has-text("직접 입력"), input[placeholder*="가로"], [class*="custom-size"]');
  if (customSizeEl) {
    await customSizeEl.click();
    console.log('커스텀 사이즈 클릭');
    await sleep(1000);
    
    // 가로 1000
    const widthInput = await page.$('input[placeholder*="가로"], input[placeholder*="width"]');
    if (widthInput) {
      await widthInput.triple_click();
      await widthInput.type('1000');
    }
    // 세로 600
    const heightInput = await page.$('input[placeholder*="세로"], input[placeholder*="height"]');
    if (heightInput) {
      await heightInput.triple_click();
      await heightInput.type('600');
    }
    
    const applyBtn = await page.$('button:has-text("적용"), button:has-text("만들기")');
    if (applyBtn) await applyBtn.click();
    await sleep(3000);
  }

  console.log('에디터 상태 확인 중...');
  const editorUrl = page.url();
  console.log('URL:', editorUrl);

  await b.close();
})().catch(e => console.error('Error:', e.message))
.finally(() => setTimeout(() => process.exit(0), 3000));
