// aicut 블로그 포스팅 이미지 스타일 확인
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222').catch(() => null);
  if (!b) { console.log('CDP 실패'); process.exit(1); }
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();

  // "유튜브 편집 대행 비용" 포스팅
  await p.goto('https://blog.naver.com/PostView.naver?blogId=aicut&logNo=224302829331', {
    waitUntil: 'domcontentloaded', timeout: 15000
  }).catch(() => {});
  await p.waitForTimeout(3000);

  console.log('URL:', p.url());

  // mainFrame 확인
  const mf = p.frame({ name: 'mainFrame' }) || p.frame({ url: /PostView/ });
  if (mf) {
    const body = await mf.evaluate(() => document.body.innerText.substring(0, 3000)).catch(() => '');
    console.log('=== 포스팅 본문 ===');
    console.log(body);

    // 이미지 정보 찾기
    const imgs = await mf.evaluate(() => {
      return Array.from(document.querySelectorAll('img[src*="blogfiles"], img[src*="post"], img[src*="files"]'))
        .map(img => ({ src: img.src.substring(0, 100), alt: img.alt?.substring(0, 50), w: img.width, h: img.height }))
        .slice(0, 10);
    }).catch(() => []);
    console.log('\n=== 이미지 목록 ===');
    imgs.forEach((img, i) => console.log(`[${i}] w:${img.w} h:${img.h} alt:${img.alt} src:${img.src}`));
  } else {
    console.log('mainFrame 없음');
    const body = await p.evaluate(() => document.body.innerText.substring(0, 1000)).catch(() => '');
    console.log(body);
  }

  try { await p.close().catch(() => {}); } catch (e) {}
  try { await b.close().catch(() => {}); } catch (e) {}
})();
