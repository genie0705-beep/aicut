// 유튜버 블로그 — 새 탭에서 재작성
const { chromium } = require('playwright');
const path = require('path');
const { TITLE, buildBodyHTML } = require('./_blog_creator_content.js');

const W = 'C:\\Users\\paul\\.openclaw\\workspace';
const IMAGES = [
  path.join(W, 'aicut_blog_youtuber_main.png'),
  path.join(W, 'aicut_blog_youtuber_card1.png'),
  path.join(W, 'aicut_blog_youtuber_card2.png'),
  path.join(W, 'aicut_blog_youtuber_card3.png'),
  path.join(W, 'aicut_blog_youtuber_cta.png'),
];

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  
  // postwrite 새로 열기
  await p.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'networkidle', timeout: 30000 });
  await p.waitForTimeout(4000);
  
  // 팝업 → 새로 작성
  await p.evaluate(() => {
    const popup = document.querySelector('.se-popup-container.__se-pop-layer');
    if (popup) {
      const btn = Array.from(popup.querySelectorAll('button')).find(b => b.innerText.includes('새로 작성'));
      if (btn) btn.click();
    }
  });
  await p.waitForTimeout(2000);
  
  // 1. 제목
  await p.evaluate((t) => {
    SmartEditor._editors['blogpc001'].setDocumentTitle(t);
  }, TITLE);
  console.log('1. 제목 ✅');
  
  // 2. 본문 붙여넣기
  const html = buildBodyHTML();
  await p.evaluate((h) => {
    return navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([h], { type: 'text/html' }),
        'text/plain': new Blob([h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()], { type: 'text/plain' })
      })
    ]);
  }, html);
  await p.waitForTimeout(500);
  await p.evaluate(() => { const ce = document.querySelector('[contenteditable]'); if(ce) ce.focus(); });
  await p.waitForTimeout(300);
  await p.keyboard.press('Control+V');
  await p.waitForTimeout(6000);
  
  // 3. 이미지 컴포넌트 확인
  const compIds = await p.evaluate(() => {
    return Array.from(document.querySelectorAll('.se-component.se-image')).map(c => ({ id: c.id, broken: c.innerText.includes('존재하지 않는 이미지') }));
  });
  console.log(`2. 붙여넣기 ✅ (이미지 ${compIds.length}개)`);
  
  // 4. 이미지 교체 (ID 기반으로 정확하게)
  console.log('3. 이미지 교체...');
  for (let i = 0; i < Math.min(IMAGES.length, compIds.length); i++) {
    const compId = compIds[i].id;
    console.log(`   ${i+1}/${IMAGES.length} (${compId})...`);
    
    // 이미지 영역 클릭
    try { await p.click(`#${compId} .se-section-image`, { timeout: 3000 }); } 
    catch(e) { try { await p.click(`#${compId}`, { timeout: 3000 }); } catch(e2) { console.log('      클릭 실패'); continue; } }
    await p.waitForTimeout(1000);
    
    // 교체 버튼 클릭 + file chooser
    const fcPromise = p.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
    try { await p.click('.se-image-replacement-toolbar-button', { timeout: 3000 }); }
    catch(e) { console.log('      교체 버튼 없음'); continue; }
    await p.waitForTimeout(500);
    
    const fc = await fcPromise;
    if (fc) {
      await fc.setFiles([IMAGES[i]]);
      console.log('      ✅');
      await p.waitForTimeout(4000);
    } else {
      console.log('      ❌ file chooser 없음');
    }
    
    // 선택 해제
    try { await p.click('.se-component.se-text:first-child', { timeout: 1000 }); } catch(e) {}
    await p.waitForTimeout(500);
  }
  
  // 최종
  const final = await p.evaluate(() => {
    const comps = document.querySelectorAll('.se-component.se-image');
    return {
      total: comps.length,
      ok: Array.from(comps).filter(c => !!c.querySelector('img')).length,
      broken: Array.from(comps).filter(c => c.innerText.includes('존재하지 않는 이미지')).length,
    };
  });
  console.log(`\n4. 최종: ${final.ok}/${final.total} 정상`);
  
  // 저장
  await p.evaluate(() => {
    const btn = document.querySelector('.save_btn__bzc5B');
    if (btn) btn.click();
  });
  console.log('5. 저장 ✅');
  
  await b.disconnect();
  console.log('\n✅ 재작성 완료! 브라우저 확인 바랍니다.');
}

main().catch(e => console.error('❌', e.message));
