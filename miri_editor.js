const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 카드 5장 텍스트 내용
const CARDS = [
  {
    no: 1,
    bg: '#0D1630',
    textColor: '#FFFFFF',
    headline: '매물 영상,\n올리고 싶은 만큼\n올리게 됐어요.',
    sub: '월 20편 정시 납품  |  주 14h→2h  |  구독자 3배',
    tag: '고객사례 · 부동산 중개법인'
  },
  {
    no: 2,
    bg: '#FDFAF2',
    textColor: '#2D2D2D',
    headline: '💡 이런 상황 반복됐어요',
    sub: '❌ 매달 편집자를 새로 구해야 했다\n❌ 매번 같은 설명을 처음부터 반복했다\n❌ 납품이 밀려 월 5~6편밖에 못 올렸다',
    tag: '"편집 때문에 포기하는 달이 많았어요."'
  },
  {
    no: 3,
    bg: '#0D1630',
    textColor: '#FFFFFF',
    headline: '💡 에이컷을 선택한 이유',
    sub: '01  부동산 매물 영상 포트폴리오 직접 확인\n02  매물 자막 템플릿 시스템에 저장\n03  약정 없이 첫 달 테스트 가능',
    tag: '온보딩 한 번, 이후엔 원본만 업로드.'
  },
  {
    no: 4,
    bg: '#FDFAF2',
    textColor: '#2D2D2D',
    headline: '💡 도입 후 달라진 것들',
    sub: 'BEFORE → AFTER\n월 5~6편 → 월 20편 정시 납품\n주 14시간 → 주 2시간으로 단축\n납품 6일 지연 → 영업일 2~3일 납품',
    tag: '구독자 도입 전 대비  3배  성장'
  },
  {
    no: 5,
    bg: '#0D1630',
    textColor: '#FFFFFF',
    headline: '편집 때문에 쌓이는 영상,\n이제 밀리지 않습니다.',
    sub: '부동산 영상 전담 편집팀\n월정액 · 48시간 납품 · 수정 무제한',
    tag: '무료 상담 신청 → aicut.co.kr'
  }
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('miricanvas.com') && p.url().includes('design'));

  if (!page) {
    page = pages.find(p => p.url().includes('miricanvas.com'));
  }

  console.log('에디터 URL:', page.url());
  await sleep(2000);

  // 현재 에디터에서 직접 사이즈 변경 시도 (우측 상단 크기 변경 버튼)
  const sizeInfo = await page.evaluate(() => {
    // 캔버스 크기 표시 버튼 탐색
    const allEls = Array.from(document.querySelectorAll('button, span, div'))
      .filter(el => {
        const text = el.innerText || '';
        return text.match(/\d+\s*[xX×]\s*\d+/) || text.includes('px') || text.includes('크기');
      })
      .map(el => ({ tag: el.tagName, text: (el.innerText || '').trim().substring(0, 50), cls: el.className.substring(0, 50) }))
      .slice(0, 10);
    return allEls;
  });
  console.log('사이즈 관련:', JSON.stringify(sizeInfo));

  // 방법2: 현재 편집 화면에서 텍스트 추가로 카드 내용 입력
  // 먼저 현재 캔버스 상태 확인
  const canvasState = await page.evaluate(() => {
    const canvas = document.querySelector('canvas, [class*="canvas"], [class*="editor-area"], [class*="design"]');
    const toolbar = document.querySelector('[class*="toolbar"], [class*="topbar"]');
    return {
      hasCanvas: !!canvas,
      canvasCls: canvas ? canvas.className.substring(0, 60) : 'none',
      toolbarText: toolbar ? toolbar.innerText.substring(0, 100) : 'none'
    };
  });
  console.log('캔버스 상태:', JSON.stringify(canvasState));

  // 텍스트 버튼 클릭
  const textBtns = await page.$$('button');
  let textBtn = null;
  for (const btn of textBtns) {
    const txt = await btn.evaluate(el => el.innerText.trim());
    if (txt === '텍스트') { textBtn = btn; break; }
  }

  if (textBtn) {
    await textBtn.click({ force: true });
    console.log('텍스트 패널 클릭');
    await sleep(2000);

    // 텍스트 패널 내 옵션 확인
    const panelState = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button, [role="button"]'))
        .map(el => el.innerText.trim().substring(0, 30))
        .filter(t => t && t.length > 1)
        .slice(0, 20);
    });
    console.log('텍스트 패널:', panelState);
  }

  await b.close();
})().catch(e => console.error('Error:', e.message))
.finally(() => setTimeout(() => process.exit(0), 2000));
