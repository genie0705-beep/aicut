const { chromium } = require('playwright');
const path = require('path');

const CAPTION = [
  '피부과 실장님, 직원분들,',
  '숏폼 촬영 너무 어렵죠? 😅',
  '',
  '"원장님 촬영하는 것도 어색한데',
  '직원들한테 시키기도 미안하고',
  '편집은 누가 하죠?"',
  '',
  '맞아요. 촬영도 어렵고 편집은 더 어렵습니다.',
  '',
  '하지만 걱정 마세요.',
  '촬영은 5분이면 충분합니다.',
  '편집은 저희가 다 해드립니다.',
  '',
  '찍은 영상만 보내주세요.',
  '자막, BGM, 색보정까지 다 해드려요.',
  '',
  '👉 자세한 내용은 블로그에서 확인하세요!',
  '',
  '#피부과 #병원마케팅 #숏폼마케팅 #릴스마케팅'
].join('\n');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const ig = pages.find(p => p.url().includes('instagram.com/aicut'));
  
  if (!ig) { console.log('인스타그램 페이지 없음'); await b.close(); return; }

  await ig.bringToFront();

  // 피드 업로드 버튼 찾기 (+ 버튼)
  const r = await ig.evaluate(() => {
    // + 버튼 찾기
    const svgs = document.querySelectorAll('svg');
    for (const svg of svgs) {
      const ariaLabel = svg.getAttribute('aria-label') || '';
      if (ariaLabel.includes('새 게시물') || ariaLabel.includes('New post')) {
        svg.closest('[role="button"], button, [tabindex]')?.click();
        return 'clicked: ' + ariaLabel;
      }
    }
    
    // 대체: sidebar의 + 버튼
    const links = document.querySelectorAll('a[href*="/create"], a[href*="/new"]');
    if (links.length > 0) { links[0].click(); return 'clicked create link'; }
    
    return 'no button found';
  });
  
  console.log('업로드 버튼:', r);
  await ig.waitForTimeout(3000);

  // 상태 확인
  const state = await ig.evaluate(() => {
    // 파일 선택 input 찾기
    const fileInput = document.querySelector('input[type="file"]');
    const title = document.title;
    const dialogs = document.querySelectorAll('[role="dialog"], [role="presentation"]');
    return {
      title,
      hasFileInput: !!fileInput,
      dialogCount: dialogs.length,
      url: location.href
    };
  });
  console.log('상태:', JSON.stringify(state, null, 2));

  await b.close();
}
main().catch(e => console.error('에러:', e.message));
