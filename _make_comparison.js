const { chromium } = require('playwright');
const { makeTemplateImage } = require('./skills/image_gen.js');
const fs = require('fs');
const path = require('path');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

async function main() {
  // 1. Generate a new image using TEMPLATES (same style as freelancer)
  console.log('Generating new image...');
  await makeTemplateImage('cardDark', '😤 영상 때문에 빡친 사람들 #1',
    '"클린트 5번, 수정 30회"\n프리랜서 편집러와\n작별한 이유',
    '영상편집 아웃소싱, 더 이상 매달 새로운 편집자를 찾지 마세요',
    'AICUT 무료상담 →',
    '_compare_new.png');
  
  // 2. Load original and new images into a comparison canvas
  console.log('Creating comparison image...');
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // Create comparison HTML: original(800x450) + new(800x450) side by side
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#1a1a2e;padding:30px;font-family:sans-serif;color:#fff;text-align:center;}
h2{font-size:18px;margin-bottom:20px;color:#a78bfa;}
.row{display:flex;justify-content:center;gap:20px;margin-bottom:30px;}
.col{text-align:center;}
.label{font-size:13px;color:#888;margin-bottom:8px;}
img{border:2px solid #333;border-radius:4px;}
</style></head><body>
<h2>기준(원본) vs 새 템플릿 생성</h2>
<div class="row">
  <div class="col">
    <div class="label">📌 기준 (aicut_blog_freelancer_02.png)</div>
    <img src="aicut_blog_freelancer_02.png" width="400" height="225">
  </div>
  <div class="col">
    <div class="label">🆕 새 템플릿 생성 (_compare_new.png)</div>
    <img src="_compare_new.png" width="400" height="225">
  </div>
</div>
</body></html>`;

  fs.writeFileSync(path.join(W, '_compare.html'), html);
  
  await page.setViewportSize({width:900, height:400});
  await page.goto('file:///' + path.join(W, '_compare.html').replace(/\\/g, '/'), {waitUntil:'networkidle', timeout:15000});
  await page.waitForTimeout(1000);
  
  await page.screenshot({path: path.join(W, '_comparison.png'), fullPage: false});
  console.log('Comparison saved: _comparison.png');
  
  await page.close();
  await b.close();
  fs.unlinkSync(path.join(W, '_compare.html'));
  
  // 3. Also create main image comparison (700x700)
  console.log('Creating main comparison...');
  await makeTemplateImage('main', '🏢 분양 마케팅',
    '분양대행사\n브로셔만 들다가\n영상 마케팅으로\n하반기 매출 2배 올린 썰',
    '직접 부딪힌 3개월, 솔직한 후기',
    'AICUT 무료상담 →',
    '_compare_main_new.png');
  
  const b2 = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx2 = b2.contexts()[0];
  const p2 = await ctx2.newPage();
  
  const html2 = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#1a1a2e;padding:20px;font-family:sans-serif;color:#fff;text-align:center;}
h2{font-size:18px;margin-bottom:20px;color:#a78bfa;}
.row{display:flex;justify-content:center;gap:20px;}
.col{text-align:center;}
.label{font-size:13px;color:#888;margin-bottom:8px;}
img{border:2px solid #333;border-radius:4px;}
</style></head><body>
<h2>대표 이미지: 기준 vs 새 템플릿</h2>
<div class="row">
  <div class="col">
    <div class="label">📌 기준 (_ref_aicut_blog_worker.png)</div>
    <img src="_ref_aicut_blog_worker.png" width="350" height="350">
  </div>
  <div class="col">
    <div class="label">🆕 새 템플릿 생성 (_compare_main_new.png)</div>
    <img src="_compare_main_new.png" width="350" height="350">
  </div>
</div>
</body></html>`;
  
  fs.writeFileSync(path.join(W, '_compare2.html'), html2);
  
  await p2.setViewportSize({width:800, height:500});
  await p2.goto('file:///' + path.join(W, '_compare2.html').replace(/\\/g, '/'), {waitUntil:'networkidle', timeout:15000});
  await p2.waitForTimeout(1000);
  
  await p2.screenshot({path: path.join(W, '_comparison_main.png'), fullPage: false});
  console.log('Main comparison saved: _comparison_main.png');
  
  await p2.close();
  await b2.close();
  fs.unlinkSync(path.join(W, '_compare2.html'));
  
  console.log('=== DONE ===');
}

main().catch(console.error);
