const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 소재 1: 전담팀 방향
const CREATIVE = {
  titles: ['영상편집 전담팀 에이컷', '숏폼 릴스 48시간 납품', '기업 유튜브 편집 대행'],
  descs: [
    '전담 에디터 고정 배정. 브랜드 가이드 1회 저장 후 소스만 주시면 바로 납품합니다.',
    '프리랜서 그만 찾으세요. 전담팀이 48시간 납품, 수정 무제한.'
  ]
};

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 모달 내 사이트 이름 확인 (이미 "에이컷" 입력됨)
  const siteInput = await page.$('input[placeholder="에이컷"]') ||
    await page.$('[placeholder*="사이트"]') ||
    await page.$('input[maxlength="10"]');

  // 제목 입력창 찾기 (반응형 소재: 제목 최대 15개)
  const titleInputs = await page.$$('input[placeholder*="제목"], input[maxlength="15"], .title-input input');
  console.log('제목 입력창 수:', titleInputs.length);

  // 모달 내 전체 입력창 파악
  const inputs = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"], .modal, [class*="modal"], [class*="popup"]');
    const target = modal || document;
    return Array.from(target.querySelectorAll('input, textarea')).map(el => ({
      tag: el.tagName,
      ph: el.placeholder,
      maxLen: el.maxLength,
      val: el.value,
      cls: el.className.substring(0, 40),
      type: el.type
    })).slice(0, 20);
  });
  console.log('모달 inputs:', JSON.stringify(inputs, null, 2));

  await page.screenshot({ path: 'naver_creative_modal.png' });
  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
