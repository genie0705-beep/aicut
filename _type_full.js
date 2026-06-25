const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  let page;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { console.log('no editor'); process.exit(1); }
  
  await page.bringToFront();
  await page.waitForTimeout(1000);
  
  // Click body
  const pos = await page.evaluate(() => {
    const m = document.querySelectorAll('.se-module-text')[1];
    if (m) { const r = m.getBoundingClientRect(); return { x: r.x + 50, y: r.y + 10 }; }
    return null;
  });
  if (!pos) { console.log('no body module'); process.exit(1); }
  
  await page.mouse.click(pos.x, pos.y);
  await page.waitForTimeout(1000);
  
  // Select all and delete
  await page.keyboard.down('Control');
  await page.keyboard.press('a');
  await page.keyboard.up('Control');
  await page.waitForTimeout(300);
  await page.keyboard.press('Delete');
  await page.waitForTimeout(500);
  
  // Type body text
  const t1 = '\uD83D\uDCAD "클린트만 5번 돌렸는데 마음에 안 든다고?"\n';
  const t2 = '\uD83D\uDCAD "수정 요청 30회, 편집자가 연락 두절"\n';
  const t3 = '\uD83D\uDCAD "이번 달 편집자, 또 바꿔야 하나?"\n\n';
  const t4 = '영상 편집 아웃소싱을 해본 브랜드라면\n누구나 한 번쯤 겪는 상황입니다.\n\n';
  const t5 = '\uD83D\uDE24 프리랜서 편집러, 왜 자꾸 바꾸게 될까?\n\n';
  const t6 = '\u2460 클린트 무한 반복\n매번 다른 의견, 다른 결과. 클린트 5번 돌려도 안 맞는 건 편집자의 문제가 아니라 시스템의 문제입니다.\n\n';
  const t7 = '\u2461 매달 새로운 편집자 찾기\n이번 달 괜찮았던 편집자, 다음 달엔 이미 다른 프로젝트. 이 과정이 매달 반복됩니다.\n\n';
  const t8 = '\u2462 소통 비용 > 편집 비용\n편집자와의 소통 시간이 실제 편집 비용보다 더 큽니다.\n\n';
  const t9 = '\uD83D\uDCA1 에이컷이 해결한 방법 (전담 에디터 시스템)\n에이컷은 프리랜서 편집러의 문제를 시스템으로 해결했습니다.\n\n';
  const t10 = '\uD83D\uDC64 전담 에디터 고정 배정 / \uD83D\uDCCB 브랜드 가이드 저장 / \u26A1 48시간 기본 납기\n\n';
  const t11 = '\uD83D\uDCCA 바뀐 결과\n편집자 교체 주기: 매월 \u2192 고정 배정\n클린트 횟수: 5~7회 \u2192 1~2회\n소통 시간: 주 8시간 \u2192 1시간 이내\n납기 준수율: 60% \u2192 98%\n\n';
  const t12 = '\uD83D\uDC40 지금 확인해보세요\n\uD83D\uDC49 카카오톡 채널: 에이컷\n\uD83D\uDC49 이메일: contact@aicut.co.kr\n\uD83D\uDC49 홈페이지: aicut.co.kr';
  
  const fullText = t1 + t2 + t3 + t4 + t5 + t6 + t7 + t8 + t9 + t10 + t11 + t12;
  
  console.log('Typing ' + fullText.length + ' chars...');
  console.log('Text preview: ' + fullText.substring(0, 50));
  
  await page.keyboard.type(fullText, { delay: 2 });
  await page.waitForTimeout(3000);
  
  const check = await page.evaluate(() => {
    const w = document.querySelector('.se-content');
    const t = w ? w.innerText : '';
    return { length: t.length, hasContent: t.length > 200, preview: t.substring(0, 150) };
  });
  console.log('Result:', JSON.stringify(check));
  
  if (check.hasContent) {
    // Save
    await page.evaluate(() => document.querySelector('.save_btn__bzc5B')?.click());
    await page.waitForTimeout(3000);
    console.log('\u2705 저장 완료!');
  }
  
  await page.screenshot({ path: 'final_body_typed.png' });
  await b.close();
})();
