// details 페이지 — 이미지 영역 클릭해서 추가 모드 찾기
const { chromium } = require('playwright');
const path = require('path');

const W = 'C:\\Users\\paul\\.openclaw\\workspace';
const ADD_FILES = [
  path.join(W, 'aicut_blog_fp_card1.png'),
  path.join(W, 'aicut_blog_fp_card2.png'),
  path.join(W, 'aicut_blog_fp_card3.png'),
  path.join(W, 'aicut_blog_fp_cta.png'),
];

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('/create/details/')) {
      page = p;
      break;
    }
  }
  if (!page) { console.log('details 탭 없음'); await b.disconnect(); return; }
  
  console.log('현재:', page.url());
  
  // 이미지 영역 자세히 진단
  const imgArea = await page.evaluate(() => {
    // 이미지 관련 div/컨테이너 구조
    const result = [];
    
    // 모든 div 중에서 이미지를 포함하는 영역 찾기
    document.querySelectorAll('div').forEach(el => {
      const imgs = el.querySelectorAll('img');
      if (imgs.length > 0 && el.offsetParent !== null) {
        result.push({
          tag: el.tagName,
          role: el.getAttribute('role') || '',
          cls: (typeof el.className === 'string' ? el.className : '').slice(0, 60),
          imgCount: imgs.length,
          firstImgAlt: (imgs[0]?.alt || '').slice(0, 30),
          clickable: el.getAttribute('role') === 'button' || el.tagName === 'BUTTON' || el.tagName === 'A',
        });
      }
    });
    
    // 하단 filmstrip/thumbnail 영역
    const lists = document.querySelectorAll('[role="list"], [role="listbox"]');
    result.push({ _section: 'lists', count: lists.length });
    lists.forEach((list, i) => {
      result.push({ _list_idx: i, children: list.children.length, childTags: Array.from(list.children).slice(0,5).map(c => c.tagName).join(',') });
    });
    
    return result;
  });
  
  console.log('=== 이미지 영역 ===');
  imgArea.forEach(a => console.log(`  ${JSON.stringify(a)}`));
  
  // 이미지 영역 클릭 시도
  console.log('\n=== 이미지 영역 클릭 시도 ===');
  
  // div[role="list"] 안의 항목들
  const listItems = await page.$$('[role="list"] > *, [role="listbox"] > *');
  console.log(`list items: ${listItems.length}개`);
  
  // 이미지 자체를 클릭
  await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    // 가장 큰 이미지 (게시물 미리보기)
    for (const img of imgs) {
      if (img.offsetWidth > 200 && img.offsetHeight > 200) {
        img.click();
        console.log('큰 이미지 클릭됨');
        return;
      }
    }
    // 첫 번째 visible 이미지
    for (const img of imgs) {
      if (img.offsetParent !== null) {
        img.click();
        console.log('첫 visible 이미지 클릭됨');
        return;
      }
    }
  });
  await page.waitForTimeout(2000);
  
  // 모달/새 화면 확인
  const afterClick = await page.evaluate(() => {
    // 새로 나타난 버튼들
    const btns = Array.from(document.querySelectorAll('button')).map(b => ({ 
      text: (b.innerText || '').slice(0,30), 
      aria: b.getAttribute('aria-label') || '',
      hasSVG: !!b.querySelector('svg'),
    }));
    return btns.filter(b => b.text || b.aria);
  });
  console.log('클릭 후 버튼들:', JSON.stringify(afterClick, null, 2));
  console.log('URL:', page.url());
  
  await page.screenshot({ path: 'debug_ig_fp_clicked.png', fullPage: true });
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));
