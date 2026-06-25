const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const DIR = 'C:/Users/paul/.openclaw/workspace';
const IMAGES = [
  { html: 'body_shop_stat1.html', out: 'body_shop_stat1.png', label: '🛒 쇼핑몰 전환율80%' },
  { html: 'body_shop_stat2.html', out: 'body_shop_stat2.png', label: '🛒 쇼핑몰 숏폼도달' },
  { html: 'body_edu_stat1.html', out: 'body_edu_stat1.png', label: '📚 교육 제작시간70%' },
  { html: 'body_edu_check.html', out: 'body_edu_check.png', label: '📚 교육 체크리스트' },
  { html: 'body_lawyer_stat1.html', out: 'body_lawyer_stat1.png', label: '⚖️ 변호사 의뢰인40%' },
  { html: 'body_lawyer_stat2.html', out: 'body_lawyer_stat2.png', label: '⚖️ 변호사 블로그vs숏폼' },
  { html: 'body_lawyer_check.html', out: 'body_lawyer_check.png', label: '⚖️ 변호사 텍스트vs영상' },
  { html: 'body_realestate2_result.html', out: 'body_realestate2_result.png', label: '🏢 부동산 월20편' },
  { html: 'body_realestate2_rate.html', out: 'body_realestate2_rate.png', label: '🏢 부동산 재계약률95%' },
  { html: 'body_hospital_stat.html', out: 'body_hospital_stat.png', label: '🏥 병원 원장님영상' },
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 700, height: 400 });

  console.log('🎨 블로그 본문 이미지 생성\n');
  for (const img of IMAGES) {
    try {
      await page.goto('file:///' + DIR + '/' + img.html, { waitUntil: 'networkidle', timeout: 15000 });
      // 폰트 로딩 대기 (Google Fonts)
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(500);
      const outPath = path.join(DIR, img.out);
      await page.screenshot({ path: outPath, fullPage: false });
      const size = fs.statSync(outPath).size;
      console.log('✅ ' + img.out + ' (' + Math.round(size/1024) + 'KB) — ' + img.label);
    } catch(e) {
      console.log('❌ ' + img.out + ' — ' + (e.message || '').substring(0, 60));
    }
  }

  await page.close();
  await b.close();
  console.log('\n🎉 본문 이미지 ' + IMAGES.length + '장 생성 완료!');
})();
