const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const TITLES = [
  '영상편집 전담팀 에이컷',
  '숏폼 릴스 48시간 납품',
  '기업 유튜브 편집 대행'
];
const DESCS = [
  '전담 에디터 고정 배정. 브랜드 가이드 1회 저장 후 소스만 주시면 바로 납품합니다.',
  '프리랜서 그만 찾으세요. 전담팀이 48시간 납품, 수정 무제한.'
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 반응형 소재 라디오 클릭
  const r1 = await page.evaluate(() => {
    const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
    // 반응형 소재 라디오
    const radio = radios.find((r, i) => i === 0);
    if (radio) { radio.click(); return '반응형 선택'; }
    return '없음';
  });
  console.log(r1);
  await sleep(1000);

  // 반응형 소재 레이블 클릭
  const r2 = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label, span, div'));
    const label = labels.find(el => el.innerText?.trim() === '반응형 소재');
    if (label) { label.click(); return '반응형 소재 레이블 클릭'; }
    return '없음';
  });
  console.log(r2);
  await sleep(1000);
  await page.screenshot({ path: 'naver_responsive.png' });

  // 모달 스크롤 다운해서 제목/설명 입력창 찾기
  await page.evaluate(() => {
    const modal = document.querySelector('[class*="modal_body"], [class*="dialog"], .sc-');
    const scrollEl = document.querySelector('[style*="overflow"]') || document.documentElement;
    scrollEl.scrollTop = 400;
  });
  await sleep(500);

  // maxLength=15인 입력창 = 제목, maxLength=45 = 설명
  const inputInfo = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, textarea')).map(el => ({
      tag: el.tagName,
      ph: el.placeholder.substring(0,30),
      maxLen: el.maxLength,
      val: el.value.substring(0,30),
      rect: { x: Math.round(el.getBoundingClientRect().x), y: Math.round(el.getBoundingClientRect().y), w: Math.round(el.getBoundingClientRect().width) }
    })).filter(el => el.maxLen === 15 || el.maxLen === 45 || el.rect.w > 200).slice(0,15);
  });
  console.log('입력창:', JSON.stringify(inputInfo, null, 2));

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
