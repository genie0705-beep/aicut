const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 반응형 소재 3개 (기존 2.61% 소재 방향 참고)
const NEW_CREATIVES = [
  {
    titles: ['영상편집 전담팀 에이컷', '숏폼 릴스 48시간 납품', '기업 유튜브 편집 대행'],
    desc: '전담 에디터 고정 배정. 브랜드 가이드 1회 저장 후 소스만 주시면 바로 납품합니다.'
  },
  {
    titles: ['월정액 영상편집 에이컷', '프리랜서 없이 전담팀으로', '재계약률 92% 에이컷'],
    desc: '매달 편집자 구하는 시간 없애세요. 전담팀이 48시간 안에 납품, 수정 무제한.'
  },
  {
    titles: ['쇼핑몰 영상편집 에이컷', '숏폼 월정액 편집 서비스', '48시간 납품 전담팀'],
    desc: '이커머스·유튜브·숏폼 전담 편집. 소스만 주시면 전담팀이 처리합니다.'
  }
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages.find(p => p.url().includes('ads.naver.com'));

  console.log('광고센터 접속:', page.url());
  await sleep(1000);

  // 소재 탭 확인
  const tabState = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button,[role="tab"]'))
      .map(el => el.innerText?.trim()).filter(t=>t).slice(0,10);
    return tabs;
  });
  console.log('탭:', tabState);

  // "새 소재" 버튼 클릭
  const newBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText?.trim() === '새 소재' || b.innerText?.trim().includes('새 소재'));
    if (btn) { btn.click(); return '새 소재 클릭'; }
    return '없음';
  });
  console.log(newBtn);
  await sleep(3000);

  await page.screenshot({ path: 'naver_new_creative.png' });

  const state = await page.evaluate(() => ({
    url: location.href,
    btns: Array.from(document.querySelectorAll('button')).map(b=>b.innerText?.trim()).filter(t=>t&&t.length<20).slice(0,15),
    inputs: Array.from(document.querySelectorAll('input,textarea')).map(i=>({ph:i.placeholder,type:i.type})).slice(0,10)
  }));
  console.log('URL:', state.url);
  console.log('버튼:', state.btns);
  console.log('inputs:', JSON.stringify(state.inputs));

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
