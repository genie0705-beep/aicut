const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const fs = require('fs');

(async () => {
  // 첫 번째 대표 이미지: 700x700 정사각형, 기존 포스팅 스타일
  const html = '<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><style>'
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
    + '<div class=\"tag\">AI 시대의 영상 편집</div>'
    + '<div class=\"main\">\"AI 영상 편집이 대세?\"<em>그래도 전문 에디터가<br>필요한 이유</em></div>'
    + '<div class=\"sub\">AI 툴과 전담 에디터의 최적 조합</div>'
    + '<div class=\"cta\">무료 상담 →</div>'
    + '<div class=\"brand\">AICUT</div></div></body></html>';
  
  fs.writeFileSync('_temp_thumb700.html', html);
  const b = await chromium.launch({ headless: true });
  const page = await b.newPage({ viewport: { width: 700, height: 700 } });
  await page.goto('file:///C:/Users/paul/.openclaw/workspace/_temp_thumb700.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'aicut_blog_ai_thumb.png', fullPage: false });
  console.log('✅ 700x700 대표 이미지 생성 (기존 포스팅 스타일)');
  fs.unlinkSync('_temp_thumb700.html');
  await b.close();
})();
