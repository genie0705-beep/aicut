const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const fs = require('fs');
const path = require('path');
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  // === 1. 대표 이미지 재생성 (폰트 크기 축소) ===
  console.log('=== 1. 대표 이미지 폰트 조정 ===');
  
  const thumbHTML = '<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><style>'
    + '*{margin:0;padding:0;box-sizing:border-box}'
    + 'body{width:700px;height:700px;overflow:hidden;font-family:\"Apple SD Gothic Neo\",\"Noto Sans KR\",\"Malgun Gothic\",sans-serif}'
    + '.card{width:700px;height:700px;background:linear-gradient(145deg,#0D1630 0%,#1a1f4e 100%);display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;position:relative;overflow:hidden}'
    + '.g{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,0.4) 0%,transparent 65%);width:500px;height:500px;top:50%;left:50%;transform:translate(-50%,-50%)}'
    + '.tag{color:#c4b5fd;font-size:22px;font-weight:700;letter-spacing:2px;margin-bottom:24px;z-index:2;position:relative}'
    + '.main{color:#fff;font-size:56px;font-weight:900;line-height:1.15;letter-spacing:-1px;z-index:2;position:relative;word-break:keep-all;text-align:center;margin-bottom:20px}'
    + '.main em{color:#a78bfa;font-style:normal;display:block}'
    + '.sub{color:rgba(255,255,255,0.7);font-size:22px;font-weight:500;line-height:1.5;z-index:2;position:relative;word-break:keep-all;margin-bottom:30px}'
    + '.cta{background:linear-gradient(135deg,#8b5cf6,#06b6d4);color:#fff;font-size:24px;font-weight:800;padding:14px 40px;border-radius:50px;z-index:2;position:relative;letter-spacing:1px}'
    + '.brand{position:absolute;right:36px;bottom:30px;color:rgba(255,255,255,0.3);font-size:18px;font-weight:900;letter-spacing:3px;z-index:2}'
    + '</style></head><body>'
    + '<div class=\"card\"><div class=\"g\"></div>'
    + '<div class=\"tag\">AI \uC2DC\uB300\uC758 \uC601\uC0C1 \uD3B8\uC9D1</div>'
    + '<div class=\"main\">\"AI \uC601\uC0C1 \uD3B8\uC9D1\uC774 \uB300\uC138?\"<em>\uADF8\uB798\uB3C4 \uC804\uBB38 \uC5D0\uB514\uD130\uAC00<br>\uD544\uC694\uD55C \uC774\uC720</em></div>'
    + '<div class=\"sub\">AI \uD234\uACFC \uC804\uB2F4 \uC5D0\uB514\uD130\uC758 \uCD5C\uC801 \uC870\uD569</div>'
    + '<div class=\"cta\">\uBB34\uB8CC \uC0C1\uB2F4 \u2192</div>'
    + '<div class=\"brand\">AICUT</div></div></body></html>';
  
  const b1 = await chromium.launch({ headless: true });
  const genPage = await b1.newPage({ viewport: { width: 700, height: 700 } });
  const fp = path.join(WORKSPACE, '_temp_thumb.html');
  fs.writeFileSync(fp, thumbHTML, 'utf-8');
  await genPage.goto('file:///' + fp.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  await genPage.evaluate(() => document.fonts.ready);
  await genPage.waitForTimeout(3000);
  await genPage.screenshot({ path: path.join(WORKSPACE, 'aicut_blog_ai_thumb.png'), fullPage: false });
  fs.unlinkSync(fp);
  console.log('✅ 대표 이미지 재생성 (폰트 76→56px)');
  await b1.close();
  
  // === 2. 에디터에서 이미지 센터 정렬 강화 ===
  console.log('\n=== 2. 이미지 센터 정렬 ===');
  const b2 = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pgs = b2.contexts()[0].pages();
  let pg;
  for (const p of pgs) { if (p.url().includes('PostWriteForm')) { pg = p; break; } }
  if (!pg) { console.log('no editor'); process.exit(1); }
  
  await pg.bringToFront();
  await pg.waitForTimeout(1000);
  
  // 첫 번째 thumb 이미지 교체 (새 폰트 사이즈)
  // 기존 thumb 찾아서 삭제
  await pg.evaluate(() => {
    const imgs = document.querySelectorAll('.se-components-wrap img');
    // alt가 'aicut_blog_ai_thumb.png'인 이미지 찾기
    for (const img of imgs) {
      if (img.alt === 'aicut_blog_ai_thumb.png') {
        let el = img;
        while (el && !el.classList.contains('se-component')) { el = el.parentElement; }
        if (el) { el.remove(); break; }
      }
    }
  });
  await pg.waitForTimeout(500);
  
  // 맨 앞에 새 thumb 등록
  await pg.mouse.click(400, 200);
  await pg.waitForTimeout(300);
  await pg.keyboard.press('Home');
  await pg.waitForTimeout(300);
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(300);
  await pg.keyboard.press('ArrowUp');
  await pg.waitForTimeout(500);
  
  const fcPromise = pg.waitForEvent('filechooser', { timeout: 10000 });
  await pg.mouse.click(36, 74);
  const fc = await fcPromise.catch(() => null);
  if (fc) {
    await fc.setFiles([path.join(WORKSPACE, 'aicut_blog_ai_thumb.png')]);
    await pg.waitForTimeout(2000);
    console.log('✅ thumb 교체 완료');
  }
  
  // === 모든 이미지 센터 정렬 강제 적용 ===
  await pg.evaluate(() => {
    // 모든 이미지 컴포넌트 찾기
    const wrap = document.querySelector('.se-components-wrap');
    const imgs = wrap.querySelectorAll('img');
    
    imgs.forEach(img => {
      // 이미지 자체
      img.style.display = 'block';
      img.style.margin = '0 auto';
      img.style.width = '100%';
      
      // 부모 체인 올라가면서 정렬 설정
      let el = img.parentElement;
      while (el && el !== wrap) {
        // 모든 중간 요소에 center 정렬
        el.style.textAlign = 'center';
        if (el.style.margin && el.style.margin === '0px') {
          el.style.margin = '0 auto';
        }
        el = el.parentElement;
      }
      
      // figure나 se-section-image 찾기
      const section = img.closest('.se-section-image') || img.closest('.se-section');
      if (section) {
        section.style.textAlign = 'center';
        section.style.margin = '10px auto';
      }
      
      // 모듈 레벨
      const mod = img.closest('.se-module') || img.closest('[class*="module"]');
      if (mod) {
        mod.style.textAlign = 'center';
      }
    });
  });
  await pg.waitForTimeout(500);
  console.log('✅ 모든 이미지 센터 정렬 강제 적용');
  
  // 저장
  await pg.evaluate(() => document.querySelector('.save_btn__bzc5B')?.click());
  await pg.waitForTimeout(3000);
  console.log('✅ 저장');
  
  // 검증
  const v = await pg.evaluate(() => {
    const txt = document.querySelector('.se-content')?.innerText || '';
    const imgs = document.querySelectorAll('.se-components-wrap img').length;
    const imgsX = Array.from(document.querySelectorAll('.se-components-wrap img')).map(i => Math.round(i.getBoundingClientRect().x));
    return { len: txt.length, imgs, positions: imgsX, hashtags: txt.includes('#AI') };
  });
  console.log('\n=== 검증 ===');
  console.log('본문:', v.len + '자, 이미지:', v.imgs + '장');
  console.log('이미지 x위치:', v.positions.join(', '));
  console.log('(모두 동일하면 센터 정렬 정상)');
  console.log('해시태그:', v.hashtags ? '✅' : '❌');
  
  await pg.screenshot({ path: 'blog_ai_fixed.png' });
  await b2.close();
})();
