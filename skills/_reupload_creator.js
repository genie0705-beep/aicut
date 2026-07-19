// 유튜버 블로그 — 깨진 이미지 3장 재등록
const { chromium } = require('playwright');
const path = require('path');

const W = 'C:\\Users\\paul\\.openclaw\\workspace';
const FILES = {
  card1: path.join(W, 'aicut_blog_youtuber_card1.png'),
  card2: path.join(W, 'aicut_blog_youtuber_card2.png'),
  cta: path.join(W, 'aicut_blog_youtuber_cta.png'),
};

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('postwrite')) {
      page = p;
      break;
    }
  }
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
  }
  
  console.log('postwrite 탭:', page.url());
  
  // 현재 깨진 이미지 컴포넌트 확인
  const brokenInfo = await page.evaluate(() => {
    const comps = document.querySelectorAll('.se-component.se-image');
    return Array.from(comps).map((c, i) => ({
      idx: i,
      id: c.id,
      broken: c.innerText.includes('존재하지 않는 이미지'),
      hasImg: !!c.querySelector('img'),
    }));
  });
  console.log('이미지 상태:', JSON.stringify(brokenInfo));
  
  // 깨진 컴포넌트들만 교체
  const brokenComps = brokenInfo.filter(c => c.broken);
  console.log(`\n깨진 이미지: ${brokenComps.length}개`);
  
  // 깨진 순서대로 매핑 (card1, card2, cta)
  const fileMap = [FILES.card1, FILES.card2, FILES.cta];
  
  for (let i = 0; i < Math.min(brokenComps.length, fileMap.length); i++) {
    const comp = brokenComps[i];
    const imgFile = fileMap[i];
    const fileName = Object.keys(FILES).find(k => FILES[k] === imgFile);
    
    console.log(`\n${i+1}. ${fileName} (id=${comp.id})...`);
    
    // 컴포넌트 클릭
    try {
      await page.click(`#${comp.id} .se-section-image`, { timeout: 3000 });
    } catch(e) {
      try { await page.click(`#${comp.id}`, { timeout: 3000 }); } catch(e2) { continue; }
    }
    await page.waitForTimeout(1000);
    
    // 교체 버튼 + file chooser
    const fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
    try {
      await page.click('.se-image-replacement-toolbar-button', { timeout: 3000 });
    } catch(e) {
      console.log('   ❌ 교체 버튼 없음');
      continue;
    }
    await page.waitForTimeout(500);
    
    const fc = await fcPromise;
    if (fc) {
      await fc.setFiles([imgFile]);
      console.log('   ✅ 업로드 완료');
      await page.waitForTimeout(4000);
    } else {
      console.log('   ❌ file chooser 없음');
      continue;
    }
    
    // 선택 해제
    try { await page.click('.se-component.se-text:first-child', { timeout: 1000 }); } catch(e) {}
    await page.waitForTimeout(500);
  }
  
  // 최종 확인
  const final = await page.evaluate(() => {
    const comps = document.querySelectorAll('.se-component.se-image');
    return {
      total: comps.length,
      ok: Array.from(comps).filter(c => !!c.querySelector('img')).length,
      broken: Array.from(comps).filter(c => c.innerText.includes('존재하지 않는 이미지')).length,
    };
  });
  console.log(`\n최종: ${final.ok}/${final.total} 정상 (깨짐 ${final.broken})`);
  
  // 저장
  await page.evaluate(() => {
    const btn = document.querySelector('.save_btn__bzc5B');
    if (btn) btn.click();
  });
  console.log('💾 저장 완료');
  
  await page.waitForTimeout(2000);
  await b.disconnect();
  console.log('\n✅ 완료! 브라우저 확인 바랍니다.');
}

main().catch(e => console.error('❌', e.message));
