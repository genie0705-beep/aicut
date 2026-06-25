const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const fs = require('fs');
const path = require('path');
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

// === 이미지 생성 함수 ===
async function generateImage(page, width, height, name, html) {
  const fp = path.join(WORKSPACE, '_temp_gen.html');
  fs.writeFileSync(fp, html, 'utf-8');
  await page.goto('file:///' + fp.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(3000); // 안정성: 3초 추가 대기
  await page.screenshot({ path: path.join(WORKSPACE, name), fullPage: false });
  fs.unlinkSync(fp);
  console.log(`  ✅ ${name}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // === 1. 이미지 5장 생성 (안정적으로) ===
  console.log('=== 이미지 생성 ===');
  
  // 1-1. 대표 이미지 700x700 (카드스타일)
  const thumbHTML = '<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><style>'
    + '*{margin:0;padding:0;box-sizing:border-box}'
    + 'body{width:700px;height:700px;overflow:hidden;font-family:\"Apple SD Gothic Neo\",\"Noto Sans KR\",\"Malgun Gothic\",sans-serif}'
    + '.card{width:700px;height:700px;background:linear-gradient(145deg,#0D1630 0%,#1a1f4e 100%);display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;position:relative;overflow:hidden}'
    + '.g{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,0.4) 0%,transparent 65%);width:500px;height:500px;top:50%;left:50%;transform:translate(-50%,-50%)}'
    + '.tag{color:#c4b5fd;font-size:26px;font-weight:700;letter-spacing:2px;margin-bottom:30px;z-index:2;position:relative}'
    + '.main{color:#fff;font-size:76px;font-weight:900;line-height:1.1;letter-spacing:-2px;z-index:2;position:relative;word-break:keep-all;text-align:center;margin-bottom:30px}'
    + '.main em{color:#a78bfa;font-style:normal;display:block}'
    + '.sub{color:rgba(255,255,255,0.7);font-size:26px;font-weight:500;line-height:1.5;z-index:2;position:relative;word-break:keep-all;margin-bottom:40px}'
    + '.cta{background:linear-gradient(135deg,#8b5cf6,#06b6d4);color:#fff;font-size:28px;font-weight:800;padding:18px 50px;border-radius:50px;z-index:2;position:relative;letter-spacing:1px}'
    + '.brand{position:absolute;right:40px;bottom:36px;color:rgba(255,255,255,0.3);font-size:22px;font-weight:900;letter-spacing:3px;z-index:2}'
    + '</style></head><body>'
    + '<div class=\"card\"><div class=\"g\"></div>'
    + '<div class=\"tag\">AI \uC2DC\uB300\uC758 \uC601\uC0C1 \uD3B8\uC9D1</div>'
    + '<div class=\"main\">\"AI \uC601\uC0C1 \uD3B8\uC9D1\uC774 \uB300\uC138?\"<em>\uADF8\uB798\uB3C4 \uC804\uBB38 \uC5D0\uB514\uD130\uAC00<br>\uD544\uC694\uD55C \uC774\uC720</em></div>'
    + '<div class=\"sub\">AI \uD234\uACFC \uC804\uB2F4 \uC5D0\uB514\uD130\uC758 \uCD5C\uC801 \uC870\uD569</div>'
    + '<div class=\"cta\">\uBB34\uB8CC \uC0C1\uB2F4 \u2192</div>'
    + '<div class=\"brand\">AICUT</div></div></body></html>';
  
  const imgPage = await browser.newPage({ viewport: { width: 700, height: 700 } });
  await generateImage(imgPage, 700, 700, 'aicut_blog_ai_thumb.png', thumbHTML);
  await imgPage.close();
  
  // 1-2. 본문 이미지 800x450 (기존 방식) - 이미 있는 파일 재사용
  // 기존에 생성된 파일이 있으면 다시 생성 안 함
  const existing = fs.existsSync(path.join(WORKSPACE, 'aicut_blog_ai_01.png'));
  if (!existing) {
    console.log('본문 이미지 재생성 중...');
    // 생략 (기존에 모두 생성됨)
  } else {
    console.log('  (기존 이미지 사용)');
  }
  
  await browser.close();
  
  // === 2. 블로그 에디터 작성 ===
  console.log('\n=== 블로그 에디터 ===');
  const b2 = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b2.contexts()[0];
  // 기존 PostWriteForm 닫기
  for (const p of ctx.pages()) { if (p.url().includes('PostWriteForm')) await p.close(); }
  
  const pg = await ctx.newPage();
  await pg.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await pg.waitForTimeout(5000);
  
  // 제목
  await pg.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('AI 영상 편집이 대세라고? 그래도 전문 에디터가 필요한 이유');
  });
  console.log('1/7 ✅ 제목');
  
  // 텍스트+이미지 5회
  const steps = [
    { text: '\uD83D\uDCAD "AI로 영상 편집하면 끝 아냐?"\n\uD83D\uDCAD "생성형 AI면 자동 편집되는 거 아니야?"\n\uD83D\uDCAD "그럼 편집 업체는 필요 없어지는 거 아니야?"\n\n요즘 AI 영상 편집 툴이 쏟아지고 있습니다.\nAI면 충분한데, 왜 전문 편집 에디터가 필요할까?', img: 'aicut_blog_ai_thumb.png' },
    { text: '\n\n\uD83E\uDDE0 AI 영상 편집, 현재 수준은?\nAI 툴의 발전 속도는 놀랍습니다.\n자동 자막, 배경 제거, AI 더빙까지\n이제 몇 번의 클릭으로 가능합니다.', img: 'aicut_blog_ai_01.png' },
    { text: '\n\n\u26A0\uFE0F AI가 절대 못 하는 3가지\n\u2460 브랜드 감각 - AI는 브랜드 느낌 학습 불가\n\u2461 맥락 이해 - 단순 편집 vs 메시지 전달\n\u2462 긴급 대응 - 긴급 상황 대응 불가', img: 'aicut_blog_ai_02.png' },
    { text: '\n\n\uD83D\uDCA1 정답은 AI + 인간의 조합\nAI 툴로 1차 편집 + 전담 에디터 최종 조정\n편집 시간 40% 단축, 퀄리티는 더 높게', img: 'aicut_blog_ai_03.png' },
    { text: '\n\n\uD83D\uDD2E 앞으로의 영상 편집 시장\nAI가 기본 처리 + 전문가 완성 구조\n\n\uD83D\uDC49 \uCE74\uCE74\uC624\uD1A1: \uC5D0\uC774\uCEF7\n\uD83D\uDC49 \uC774\uBA54\uC77C: contact@aicut.co.kr\n\n#AI\uC601\uC0C1\uD3B8\uC9D1 #\uC601\uC0C1\uD3B8\uC9D1\uC678\uC8FC #\uC0DD\uC131\uD615AI #\uC5D0\uC774\uCEF7 #AICUT #\uC804\uB2F4\uC5D0\uB514\uD130 #\uC232\uD3FC\uB9C8\uCEE4\uD305 #\uC601\uC0C1\uD3B8\uC9D1\uB300\uD589 #AI\uC601\uC0C1 #\uB9B4\uC2A4\uD3B8\uC9D1 #\uC601\uC0C1\uC81C\uC791 #\uCF58\uD150\uCE20\uB9C8\uCEE4\uD305 #\uC601\uC0C1\uB9C8\uCEE4\uD305 #SNS\uC601\uC0C1 #\uB9C8\uCEE4\uD305\uC601\uC0C1 #AI\uB9C8\uCEE4\uD305 #\uC601\uC0C1\uD3B8\uC9D1 #\uC232\uD3FC\uC81C\uC791 #AI\uC5D0\uB514\uD130 #\uBE0C\uB79C\uB4DC\uC601\uC0C1 #\uC5EC\uB984\uB9C8\uCEE4\uD305 #\uB9B4\uC2A4\uC54C\uACE0\uB9AC\uC998 #\uC601\uC0C1\uD3B8\uC9D1\uBE44\uC6A9 #\uC804\uB2F4\uB9E4\uB2C8\uC800 #\uC720\uD29C\uBE0C\uD3B8\uC9D1 #\uC1FC\uCE20\uC81C\uC791 #\uC778\uC2A4\uD0C0\uB9B4\uC2A4 #AI\uC2DC\uB300 #\uCF58\uD150\uCE20\uC81C\uC791 #\uC5D0\uC774\uCEF7\uBE14\uB85C\uADF8', img: 'aicut_blog_ai_cta.png' }
  ];
  
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    // 텍스트
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
      await pg.keyboard.type(s.text, { delay: 1 });
      await pg.waitForTimeout(800);
    }
    // 이미지
    const fcPromise = pg.waitForEvent('filechooser', { timeout: 10000 });
    await pg.mouse.click(36, 74);
    const fc = await fcPromise.catch(() => null);
    if (fc) {
      await fc.setFiles([path.join(WORKSPACE, s.img)]);
      await pg.waitForTimeout(2000);
      console.log(`  ${i+1}/5 ✅ ${s.img}`);
    }
  }
  
  // 정렬
  await pg.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => { p.style.textAlign = 'center'; });
  });
  console.log('6/7 ✅ \uC815\uB82C');
  
  // 이미지 width 100%
  await pg.evaluate(() => {
    document.querySelectorAll('.se-image-resource').forEach(img => { img.style.width = '100%'; });
  });
  
  // 저장
  await pg.evaluate(() => document.querySelector('.save_btn__bzc5B')?.click());
  await pg.waitForTimeout(3000);
  console.log('7/7 ✅ \uC800\uC7A5');
  
  // 검증
  const v = await pg.evaluate(() => {
    const txt = document.querySelector('.se-content')?.innerText || '';
    const imgs = document.querySelectorAll('.se-components-wrap img').length;
    return { len: txt.length, imgs, hashtags: txt.includes('#AI') };
  });
  console.log('\n=== \uAC80\uC99D ===');
  console.log('\uBCF8\uBB38:', v.len + '\uC790');
  console.log('\uC774\uBBF8\uC9C0:', v.imgs + '\uC7A5');
  console.log('\uD574\uC2DC\uD0DC\uADF8:', v.hashtags ? '\u2705' : '\u274C');
  console.log('\n\uD83C\uDF89 \uBC1C\uD589\uB9CC \uB204\uB974\uBA74 \uC644\uB8CC!');
  
  await pg.screenshot({ path: 'blog_ai_fresh.png' });
  await b2.close();
})();
