const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 카드 5장 내용
const CARDS = [
  {
    no: 1,
    bg: '#0D1630',
    titleText: '매물 영상,\n올리고 싶은 만큼\n올리게 됐어요.',
    bodyText: '월 20편 정시 납품  |  주 14h→2h  |  구독자 3배',
    tag: '고객사례 · 부동산 중개법인'
  },
  {
    no: 2,
    bg: '#FDFAF2',
    titleText: '💡 이런 상황 반복됐어요',
    bodyText: '❌ 매달 편집자를 새로 구해야 했다\n❌ 매번 같은 설명을 처음부터 반복했다\n❌ 납품이 밀려 월 5~6편밖에 못 올렸다',
    tag: '"편집 때문에 포기하는 달이 많았어요."'
  },
  {
    no: 3,
    bg: '#0D1630',
    titleText: '💡 에이컷을 선택한 이유',
    bodyText: '01  부동산 매물 영상 포트폴리오 직접 확인\n02  매물 자막 템플릿 시스템에 저장\n03  약정 없이 첫 달 테스트 가능',
    tag: '온보딩 한 번, 이후엔 원본만 업로드.'
  },
  {
    no: 4,
    bg: '#FDFAF2',
    titleText: '💡 도입 후 달라진 것들',
    bodyText: 'BEFORE → AFTER\n월 5~6편 → 월 20편 정시 납품\n주 14시간 → 주 2시간으로 단축\n납품 6일 지연 → 영업일 2~3일 납품',
    tag: '구독자 도입 전 대비  3배  성장'
  },
  {
    no: 5,
    bg: '#0D1630',
    titleText: '편집 때문에 쌓이는 영상,\n이제 밀리지 않습니다.',
    bodyText: '부동산 영상 전담 편집팀\n월정액 · 48시간 납품 · 수정 무제한',
    tag: '무료 상담 신청 → aicut.co.kr'
  }
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('miricanvas.com') && p.url().includes('design'));

  await sleep(1000);

  // "새 디자인 만들기" 클릭
  const result = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const makeBtn = btns.find(b => b.innerText.trim().includes('새 디자인 만들기'));
    if (makeBtn) { makeBtn.click(); return '새 디자인 만들기 클릭'; }
    return '버튼 없음: ' + btns.map(b => b.innerText.trim()).filter(t=>t).join(' | ');
  });
  console.log(result);
  await sleep(4000);

  await page.screenshot({ path: 'miri_newdesign.png' });
  const url = page.url();
  console.log('새 URL:', url);

  // 현재 버튼 상태
  const btns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t=>t).slice(0,20)
  );
  console.log('버튼:', btns);

  await b.close();
})().catch(e => console.error('Error:', e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));
