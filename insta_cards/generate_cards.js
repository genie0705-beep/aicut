const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const cards = [
  { html: 'card1.html', out: 'card1_납기편집.png' },
  { html: 'card2.html', out: 'card2_AI에디터.png' },
  { html: 'card3.html', out: 'card3_비용비교.png' },
  { html: 'card4.html', out: 'card4_병원마케팅.png' },
  { html: 'card5.html', out: 'card5_부동산유튜브.png' },
];

const DIR = 'C:/Users/paul/.openclaw/workspace/insta_cards';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  await page.setViewportSize({ width: 1080, height: 1080 });

  for (const card of cards) {
    const filePath = `file:///${DIR}/${card.html}`;
    await page.goto(filePath, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const outPath = path.join(DIR, card.out);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`✅ ${card.out} 저장 완료`);
  }

  await b.close();
  console.log('\n모든 카드 이미지 생성 완료!');
  console.log(`저장 위치: ${DIR}`);
})().catch(e => console.error('Fatal:', e.message));
