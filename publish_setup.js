// 발행 패널 카테고리 좌표 기반 클릭
const { chromium } = require('playwright');
const path = require('path');
const IMG_DIR = path.join(__dirname, 'blog_images');
const CATEGORY_NAME = '고객사례 도입이야기';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const pages = context.pages();
  const editorPage = pages.find(p => p.url().includes('Redirect=Write'));
  const mainFrame = editorPage.frame({ name: 'mainFrame' });

  // 발행 패널 열기
  await mainFrame.evaluate(() => {
    const btn = document.querySelector('.publish_btn__m9KHH');
    if (btn) btn.click();
  });
  await sleep(2000);
  
  // 스크린샷 크기 확인
  const viewport = editorPage.viewportSize();
  console.log('[INFO] Viewport:', viewport);
  
  await editorPage.screenshot({ path: path.join(IMG_DIR, 'panel_measure.png') });

  // 발행 패널 스크린샷(1200x680 기준)에서:
  // 카테고리 드롭다운 위치: 대략 x=998, y=65 (패널 우측 상단)
  // 뷰포트 실제 크기에 따라 조정 필요
  
  // 카테고리 드롭다운 클릭
  console.log('[STEP 1] Click category dropdown...');
  // 패널이 우측에 있으므로 x 좌표는 오른쪽
  await editorPage.mouse.click(998, 65);
  await sleep(1500);
  await editorPage.screenshot({ path: path.join(IMG_DIR, 'panel_cat_open.png') });

  // 드롭다운이 열렸는지 확인 후 옵션 클릭
  // 기존 카테고리: "영상편집 팁" 위치 아래에 다른 옵션들이 나타남
  // "고객사례 도입이야기"가 없으면 새로 만들어야 함
  
  // 현재 열린 드롭다운에서 카테고리 목록 확인
  const catListCheck = await mainFrame.evaluate(() => {
    // 드롭다운 열린 후 나타나는 리스트
    const lists = Array.from(document.querySelectorAll('ul, ol, [role="listbox"], [class*="dropdown"], [class*="DropDown"]'));
    const visibleLists = lists.filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.x > 700; // 우측 패널
    });
    return visibleLists.map(el => ({
      tag: el.tagName,
      cls: el.className.substring(0,50),
      text: el.innerText.substring(0,100),
      rect: { x: Math.round(el.getBoundingClientRect().x), y: Math.round(el.getBoundingClientRect().y) }
    }));
  });
  console.log('[INFO] Visible lists (right side):', JSON.stringify(catListCheck, null, 2));

  // 카테고리 추가 필요 여부 확인
  // 현재는 "영상편집 팁"만 있고 "고객사례 도입이야기"는 없으므로
  // 발행 패널에서 카테고리 추가 버튼이 있는지 확인
  
  // 일단 발행 패널 닫고 카테고리 먼저 생성
  await editorPage.keyboard.press('Escape');
  await sleep(500);
  
  // 네이버 블로그 카테고리 관리 API
  // POST /api/category/add 시도
  const addCatResult = await mainFrame.evaluate(async (catName) => {
    try {
      // 카테고리 목록 먼저 가져오기
      const listResp = await fetch('/api/categoryList.naver?blogId=aicut', {
        credentials: 'include'
      });
      const listText = await listResp.text();
      return { list: listText.substring(0, 200) };
    } catch(e) {
      return { error: e.message };
    }
  }, CATEGORY_NAME);
  console.log('[INFO] Category API result:', JSON.stringify(addCatResult));

  await browser.close();
})().catch(e => console.error('[ERROR]', e.message));
