const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 인스타 카드 이미지 생성 (1080×1080)
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:1080px;height:1080px;overflow:hidden;font-family:'Noto Sans KR',sans-serif;
      background:linear-gradient(160deg,#0D1630,#1a1f4e,#2d1b69);
      display:flex;justify-content:center;align-items:center}
    .card{width:1080px;height:1080px;position:relative;overflow:hidden;display:flex;flex-direction:column;
      justify-content:center;align-items:center;text-align:center;padding:80px}
    .glow{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(92,61,232,0.5) 0%,transparent 60%);
      width:691px;height:691px;top:50%;left:50%;transform:translate(-50%,-50%)}
    .badge{display:inline-block;background:rgba(167,139,250,0.15);color:#a78bfa;
      font-size:20px;font-weight:700;padding:10px 28px;
      border:1px solid rgba(167,139,250,0.3);border-radius:30px;margin-bottom:32px;z-index:2;position:relative}
    .main{color:#fff;font-size:52px;font-weight:800;line-height:1.4;z-index:2;position:relative;
      margin-bottom:20px;word-break:keep-all;letter-spacing:-1px}
    .main em{color:#a78bfa;font-style:normal}
    .sub{color:rgba(255,255,255,0.6);font-size:22px;font-weight:500;line-height:1.5;z-index:2;position:relative;
      margin-bottom:36px}
    .cta{background:linear-gradient(135deg,#5c3de8,#7c5cf6);color:#fff;font-size:22px;
      font-weight:700;padding:16px 52px;border-radius:50px;z-index:2;position:relative;display:inline-block}
  </style></head><body><div class="card">
    <div class="glow"></div>
    <div class="badge">📜 제헌절 특집</div>
    <div class="main">2026 제헌절,<br>19년 만의 <em>공휴일</em><br>3일 연휴 즐기기</div>
    <div class="sub">7월 17일 금요일, 가족·연인과 함께하는<br>서울 행사·축제 총정리</div>
    <div class="cta">AICUT 자세히 보기 →</div>
  </div></body></html>`;
  
  const tmpFile = path.join(__dirname, '_tmp_insta.html');
  fs.writeFileSync(tmpFile, html);
  
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1080, height: 1080 });
  await page.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);
  const outFile = 'insta_constitution_2026.png';
  await page.screenshot({ path: path.join(__dirname, outFile), fullPage: false });
  await page.close();
  fs.unlinkSync(tmpFile);
  
  console.log('✅ 인스타 카드 생성 완료:', outFile);
  console.log('파일:', path.join(__dirname, outFile));
  
  // 인스타그램 업로드
  const insta = ctx.pages().find(p => p.url().includes('instagram.com'));
  if (insta) {
    await insta.bringToFront();
    await insta.waitForTimeout(1000);
    
    // 만들기 버튼 → 게시물
    const createLink = await insta.$('a[href*="create"], a[href*="upload"]');
    if (createLink) {
      await createLink.click();
      console.log('만들기 클릭');
      await insta.waitForTimeout(2000);
      
      // 게시물 선택
      const postOption = await insta.$('a[href*="create/select"], button:has-text("게시물"), span:has-text("게시물")');
      if (postOption) {
        await postOption.click();
        console.log('게시물 선택');
        await insta.waitForTimeout(2000);
        
        // 파일 업로드
        const fileInput = await insta.$('input[type="file"]');
        if (fileInput) {
          await fileInput.setInputFiles(path.join(__dirname, outFile));
          console.log('파일 업로드됨, 다음 단계 대기...');
          await insta.waitForTimeout(3000);
        }
      }
    }
  }
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
