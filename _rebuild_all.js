const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pgs = b.contexts()[0].pages();
  let pg;
  for (const p of pgs) { if (p.url().includes('PostWriteForm')) { pg = p; break; } }
  if (!pg) { process.exit(1); }
  
  await pg.bringToFront();
  await pg.waitForTimeout(1000);
  
  // 제목
  await pg.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('AI 영상 편집이 대세라고? 그래도 전문 에디터가 필요한 이유');
  });
  console.log('1/7 ✅ 제목');
  
  // 텍스트+이미지 번갈아가며 5회
  const data = [
    { text: '\n\uD83D\uDCAD "AI로 영상 편집하면 끝 아냐?"\n\uD83D\uDCAD "생성형 AI면 자동 편집되는 거 아니야?"\n\uD83D\uDCAD "그럼 편집 업체는 필요 없어지는 거 아니야?"\n\n요즘 AI 영상 편집 툴이 쏟아지고 있습니다.\nAI면 충분한데, 왜 전문 편집 에디터가 필요할까?', img: 'aicut_blog_ai_thumb.png' },
    { text: '\n\n\uD83E\uDDE0 AI 영상 편집, 현재 수준은?\nAI 툴의 발전 속도는 놀랍습니다.\n자동 자막, 배경 제거, AI 더빙까지\n이제 몇 번의 클릭으로 가능합니다.', img: 'aicut_blog_ai_01.png' },
    { text: '\n\n\u26A0\uFE0F AI가 절대 못 하는 3가지\n\u2460 브랜드 감각 - AI는 브랜드 느낌 학습 불가\n\u2461 맥락 이해 - 단순 편집 vs 메시지 전달\n\u2462 긴급 대응 - 긴급 상황 대응 불가', img: 'aicut_blog_ai_02.png' },
    { text: '\n\n\uD83D\uDCA1 정답은 AI + 인간의 조합\nAI 툴로 1차 편집 + 전담 에디터 최종 조정\n편집 시간 40% 단축, 퀄리티는 더 높게', img: 'aicut_blog_ai_03.png' },
    { text: '\n\n\uD83D\uDD2E 앞으로의 영상 편집 시장\nAI가 기본 처리 + 전문가 완성 구조\n\n\uD83D\uDC49 카카오톡: 에이컷\n\uD83D\uDC49 이메일: contact@aicut.co.kr\n\n#AI영상편집 #영상편집외주 #생성형AI #에이컷 #AICUT #전담에디터 #숏폼마케팅 #영상편집대행 #AI영상 #릴스편집 #영상제작 #콘텐츠마케팅 #영상마케팅 #SNS영상 #마케팅영상 #AI마케팅 #영상편집 #숏폼제작 #AI에디터 #브랜드영상 #여름마케팅 #릴스알고리즘 #영상편집비용 #전담매니저 #유튜브편집 #쇼츠제작 #인스타릴스 #AI시대 #콘텐츠제작 #에이컷블로그', img: 'aicut_blog_ai_cta.png' }
  ];
  
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    
    // 텍스트 입력
    const pos = await pg.evaluate(() => {
      const c = document.querySelector('.se-content');
      if (c) { const r = c.getBoundingClientRect(); return { x: r.x + 100, y: r.y + r.height - 30 }; }
      return null;
    });
    if (pos) {
      await pg.mouse.click(pos.x, pos.y);
      await pg.waitForTimeout(200);
      await pg.keyboard.press('End');
      await pg.waitForTimeout(200);
      await pg.keyboard.type(d.text, { delay: 1 });
      await pg.waitForTimeout(800);
    }
    
    // 이미지 등록
    const fcPromise = pg.waitForEvent('filechooser', { timeout: 10000 });
    await pg.mouse.click(36, 74);
    const fc = await fcPromise.catch(() => null);
    if (fc) {
      await fc.setFiles([path.join(WORKSPACE, d.img)]);
      await pg.waitForTimeout(1500);
      console.log(`  ${i+1}/5 \u2705 ${d.img}`);
    }
  }
  
  // 정렬
  await pg.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => { p.style.textAlign = 'center'; });
  });
  console.log('6/7 ✅ 정렬');
  
  // 이미지 width 100%
  await pg.evaluate(() => {
    document.querySelectorAll('.se-image-resource').forEach(img => { img.style.width = '100%'; });
  });
  
  // 저장
  await pg.evaluate(() => document.querySelector('.save_btn__bzc5B')?.click());
  await pg.waitForTimeout(3000);
  console.log('7/7 ✅ 저장');
  
  // 검증
  const v = await pg.evaluate(() => {
    const txt = document.querySelector('.se-content')?.innerText || '';
    const imgs = document.querySelectorAll('.se-components-wrap img').length;
    return { len: txt.length, imgs, hashtags: txt.includes('#AI') };
  });
  console.log('\n=== 검증 ===');
  console.log('본문:', v.len + '자');
  console.log('이미지:', v.imgs + '장');
  console.log('해시태그:', v.hashtags ? '✅' : '❌');
  console.log('\n\uD83C\uDF89 발행만 누르면 완료!');
  
  await pg.screenshot({ path: 'blog_ai_final_v2.png' });
  await b.close();
})();
