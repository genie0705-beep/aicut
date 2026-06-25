const { chromium } = require('playwright');
const path = require('path');

const IMAGE_PATH = 'C:/Users/paul/.openclaw/workspace/insta_cards/card6_shopping.png';
const CAPTION = `쇼핑몰 영상 콘텐츠, 기획은 되는데 편집에서 막히고 있나요?

매달 새 편집자 찾고, 브랜드 톤 매번 설명하고, 시즌 캠페인은 납품이 밀리고.

에이컷은 전담 에디터 고정 배정으로
한 번 온보딩 후엔 소스만 넘기면 됩니다.

✅ 전담 에디터 — 매달 교체 없음
✅ 브랜드 톤 고정 — 한 번 설정으로 끝
✅ 48시간 납품 — 시즌 캠페인도 OK

무료 상담 → 프로필 링크

#쇼핑몰마케팅 #영상편집외주 #이커머스마케팅 #스마트스토어마케팅 #영상편집월정액 #에이컷 #AICUT #전담편집팀 #48시간납품 #콘텐츠마케팅 #SNS영상 #숏폼편집 #영상제작외주 #브랜드영상 #쇼핑몰운영`;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('instagram.com'));
  if (!page) page = pages[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  console.log('현재 탭:', page.url());
  await sleep(1000);
  await page.screenshot({ path: 'insta_state.png' });

  // 현재 보이는 버튼/링크
  const state = await page.evaluate(() => ({
    btns: Array.from(document.querySelectorAll('button,[role="button"]'))
      .map(el => el.getAttribute('aria-label') || el.innerText?.trim().substring(0,30))
      .filter(t=>t&&t.length>1).slice(0,20),
    svgLabels: Array.from(document.querySelectorAll('svg'))
      .map(el => el.getAttribute('aria-label')).filter(t=>t).slice(0,10),
    links: Array.from(document.querySelectorAll('a'))
      .map(el => ({ text: el.innerText?.trim().substring(0,20), href: el.href.substring(0,60) }))
      .filter(el=>el.text).slice(0,15)
  }));
  console.log('버튼:', state.btns);
  console.log('SVG labels:', state.svgLabels);

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
