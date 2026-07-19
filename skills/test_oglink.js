const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));

  // 1. CTA 텍스트 줄 삭제 — 비어있는 새 줄로 대체
  // (OG링크 컴포넌트 추가를 위해 공간 확보)
  
  // 2. OG 링크 버튼 클릭 → URL 입력 → 확인
  // 카카오톡 채널 링크
  await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    // 빈 줄 추가 후 포커스
    se._editingService.writeTextWithSoftLineBreak('\n\n\n');
  });
  await wp.waitForTimeout(500);
  
  // 링크 버튼 찾기
  const btnInfo = await wp.evaluate(() => {
    const btns = document.querySelectorAll('button');
    return Array.from(btns)
      .filter(b => b.textContent.includes('링크') || b.className.includes('oglink'))
      .map(b => ({ text: b.textContent.trim().substring(0,20), cls: b.className.substring(0,60), rect: b.getBoundingClientRect() }));
  });
  console.log('링크 버튼:', JSON.stringify(btnInfo, null, 2));
  
  await b.close();
}
main().catch(e => console.error('에러:', e.message));
