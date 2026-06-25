const { chromium } = require('playwright');
const path = require('path');
const IMG_DIR = path.join(__dirname, 'blog_images');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const pages = context.pages();
  const adPage = pages.find(p => p.url().includes('keyword-planner'));
  await adPage.setViewportSize({ width: 1400, height: 900 });

  // "전체 다운로드" 버튼 클릭 (CSV/Excel 다운로드)
  const dlBtn = await adPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const btn = btns.find(b => b.textContent.trim().includes('전체 다운로드'));
    if (btn) { const r = btn.getBoundingClientRect(); return { x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2) }; }
    return null;
  });
  console.log('[DL BTN]', dlBtn);

  // 다운로드 트리거
  if (dlBtn) {
    const [download] = await Promise.all([
      adPage.waitForEvent('download', { timeout: 15000 }),
      adPage.mouse.click(dlBtn.x, dlBtn.y)
    ]);
    const dlPath = path.join(IMG_DIR, 'kw_data.xlsx');
    await download.saveAs(dlPath);
    console.log('[DOWNLOADED]', dlPath);
  }

  // 대안: innerText 기반 전체 파싱
  const fullText = await adPage.evaluate(() => document.body.innerText);
  const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // 키워드 패턴 파싱: "추가" 다음 줄이 키워드
  const kwRows = [];
  for (let i = 0; i < lines.length - 8; i++) {
    if (lines[i] === '추가') {
      const kw = lines[i+1];
      const pc = lines[i+2];
      const mob = lines[i+3];
      const comp = lines[i+8] || '';
      if (kw && kw.length > 1 && kw !== '연관키워드') {
        kwRows.push([kw, pc, mob, comp]);
      }
    }
  }
  console.log('[KW ROWS SAMPLE]', kwRows.slice(0, 5));
  console.log('[TOTAL ROWS]', kwRows.length);

  // 검색량 파싱
  const kwData = kwRows.map(([kw, pc, mob, comp]) => {
    const pcN = pc === '< 10' ? 5 : parseInt(pc) || 0;
    const mobN = mob === '< 10' ? 5 : parseInt(mob) || 0;
    return { kw, pc, mob, total: pcN + mobN, comp };
  });

  console.log('\n[TOP 30]:');
  kwData.sort((a,b) => b.total - a.total).slice(0,30)
    .forEach(k => console.log(`${k.kw.padEnd(20)} PC:${k.pc.padStart(6)} 모바일:${k.mob.padStart(6)} 경쟁:${k.comp}`));

  await browser.close();
})().catch(e => console.error(e.message));
