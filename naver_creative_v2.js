const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const TITLES = [
  '영상편집 전담팀 에이컷',
  '숏폼 릴스 48시간 납품',
  '기업 유튜브 편집 대행'
];
const DESCS = [
  '전담 에디터 고정 배정. 소스만 주시면 48시간 납품합니다.',
  '프리랜서 그만 찾으세요. 전담팀 수정 무제한.'
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));

  // 광고그룹 페이지로 이동
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(4000);
  console.log('광고그룹 페이지 이동 완료');

  // 소재 탭 클릭
  const tabClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText?.trim() === '소재');
    if (btn) { btn.click(); return '소재 탭 클릭'; }
    return '없음';
  });
  console.log(tabClicked);
  await sleep(2000);

  // 새 소재 버튼 클릭
  const newBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText?.trim() === '새 소재');
    if (btn) { btn.click(); return '새 소재 클릭'; }
    return '없음';
  });
  console.log(newBtn);
  await sleep(3000);

  await page.screenshot({ path: 'naver_modal_open.png' });

  // 모달 내 반응형 소재 라디오 선택
  const radioClick = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    const label = labels.find(l => l.innerText?.includes('반응형 소재'));
    if (label) { label.click(); return '반응형 소재 선택'; }
    // radio 직접 클릭
    const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
    if (radios[0]) { radios[0].click(); return '라디오 0 클릭'; }
    return '없음';
  });
  console.log(radioClick);
  await sleep(1000);

  // 모달 내 스크롤 다운
  await page.evaluate(() => window.scrollBy(0, 300));
  await sleep(500);

  // maxLength=15인 입력창 찾기 (제목), maxLength=45 (설명)
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input,textarea'))
      .map(el => ({
        maxLen: el.maxLength,
        rect: {
          x: Math.round(el.getBoundingClientRect().x),
          y: Math.round(el.getBoundingClientRect().y),
          w: Math.round(el.getBoundingClientRect().width),
          h: Math.round(el.getBoundingClientRect().height)
        },
        val: el.value
      }))
      .filter(el => el.maxLen === 15 || el.maxLen === 45)
      .slice(0, 10);
  });
  console.log('제목/설명 입력창:', JSON.stringify(inputs));

  if (inputs.length > 0) {
    // 첫 번째 제목 입력
    await page.mouse.click(inputs[0].rect.x + 10, inputs[0].rect.y + 10);
    await page.keyboard.type(TITLES[0]);
    console.log('제목 1 입력:', TITLES[0]);
    await sleep(500);
  }

  await page.screenshot({ path: 'naver_modal_input.png' });
  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
