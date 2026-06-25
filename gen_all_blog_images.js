// 블로그 이미지 시리즈 일괄 생성 — AICUT 통합 톤앤매너
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const DIR = 'C:/Users/paul/.openclaw/workspace';
const IMAGES = [
  { html: 'blog_img_shop.html', out: 'blog_img_shop.png', label: '🛒 쇼핑몰·이커머스 (다크/퍼플)' },
  { html: 'blog_img_realestate.html', out: 'blog_img_realestate.png', label: '🏢 부동산 중개사 (라이트/시안)' },
  { html: 'blog_img_lawyer.html', out: 'blog_img_lawyer.png', label: '⚖️ 변호사·전문직 (다크/퍼플)' },
  { html: 'blog_img_hospital.html', out: 'blog_img_hospital.png', label: '🏥 병원·의원 (라이트/핑크)' },
  { html: 'blog_img_edu.html', out: 'blog_img_edu.png', label: '📚 온라인 강의·교육 (다크/그린)' },
  { html: 'blog_img_realestate2.html', out: 'blog_img_realestate2.png', label: '🏢 부동산 중개법인 고객사례 (라이트/시안)' },
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  await page.setViewportSize({ width: 700, height: 700 });

  console.log('🎨 AICUT 블로그 이미지 시리즈 생성 시작');
  console.log('='.repeat(50));
  console.log('');

  for (const img of IMAGES) {
    const filePath = 'file:///' + DIR + '/' + img.html;
    try {
      await page.goto(filePath, { waitUntil: 'networkidle', timeout: 15000 });
      // 폰트 로딩 대기 (Google Fonts)
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(500);
      const outPath = path.join(DIR, img.out);
      await page.screenshot({ path: outPath, fullPage: false });
      const size = fs.statSync(outPath).size;
      console.log('✅ ' + img.out + ' (' + Math.round(size/1024) + 'KB) — ' + img.label);
    } catch(e) {
      console.log('❌ ' + img.out + ' 실패: ' + (e.message || '').substring(0, 60));
    }
  }

  await page.close();
  await b.close();
  console.log('');
  console.log('🎉 블로그 이미지 ' + IMAGES.length + '장 생성 완료!');
  console.log('저장 위치: ' + DIR);
})().catch(e => console.error('Fatal:', e.message));
