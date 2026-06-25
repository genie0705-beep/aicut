const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const fs = require('fs');

(async () => {
  const html = '<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><style>'
    + '*{margin:0;padding:0;box-sizing:border-box}'
    + 'body{width:800px;height:450px;overflow:hidden;font-family:\"Apple SD Gothic Neo\",\"Noto Sans KR\",\"Malgun Gothic\",sans-serif}'
    + '.card{width:800px;height:450px;background:linear-gradient(145deg,#0D1630 0%,#1a1f4e 100%);display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;position:relative;overflow:hidden}'
    + '.g{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,0.35) 0%,transparent 65%);width:500px;height:500px;top:50%;left:50%;transform:translate(-50%,-50%)}'
    + '.tag{color:#c4b5fd;font-size:22px;font-weight:700;letter-spacing:2px;margin-bottom:24px;z-index:2;position:relative}'
    + '.main{color:#fff;font-size:62px;font-weight:900;line-height:1.1;letter-spacing:-2px;z-index:2;position:relative;word-break:keep-all;text-align:center;margin-bottom:20px}'
    + '.main em{color:#a78bfa;font-style:normal;display:block}'
    + '.sub{color:rgba(255,255,255,0.7);font-size:22px;font-weight:500;line-height:1.5;z-index:2;position:relative;word-break:keep-all}'
    + '.brand{position:absolute;right:40px;bottom:30px;color:rgba(255,255,255,0.3);font-size:18px;font-weight:900;letter-spacing:3px;z-index:2}'
    + '</style></head><body>'
    + '<div class=\"card\"><div class=\"g\"></div>'
    + '<div class=\"tag\">AI 시대의 영상 편집</div>'
    + '<div class=\"main\">\"AI 영상 편집이 대세?\"<em>그래도 전문 에디터가 필요한 이유</em></div>'
    + '<div class=\"sub\">AI 툴과 전담 에디터의 최적 조합</div>'
    + '<div class=\"brand\">AICUT</div></div></body></html>';
  
  fs.writeFileSync('_temp_thumb_800.html', html);
  const b = await chromium.launch({ headless: true });
  const page = await b.newPage({ viewport: { width: 800, height: 450 } });
  await page.goto('file:///C:/Users/paul/.openclaw/workspace/_temp_thumb_800.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'aicut_blog_ai_thumb.png', fullPage: false });
  console.log('✅ 800x450 대표 이미지 생성 완료');
  fs.unlinkSync('_temp_thumb_800.html');
  await b.close();
})();
