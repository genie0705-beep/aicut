const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
const CAPTION = '2026 월드컵 열기, 숏폼 마케팅으로 잡는 방법 ⚽\n\n릴스 15초, 쇼츠 30초, 틱톡 15초 — 각 플랫폼 특성에 맞게 최적화하세요. 경기 종료 후 30분이 골든타임입니다.\n\n바쁜 시즌, 영상 편집은 에이컷에 맡기세요 📱\n\n#월드컵 #월드컵마케팅 #숏폼마케팅 #릴스마케팅 #영상편집아웃소싱 #에이컷 #릴스알고리즘 #스포츠마케팅 #인스타마케팅 #영상편집';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  let page = ctx.pages().find(p => p.url().includes('instagram.com/create'));
  if (!page) page = ctx.pages().find(p => p.url().includes('instagram'));
  if (!page) { console.log('인스타 탭 없음'); await ctx.close(); return; }

  await page.bringToFront();

  // create 페이지가 아니면 이동
  if (!page.url().includes('/create')) {
    await page.goto('https://www.instagram.com/create/', { timeout: 20000 }).catch(() => {});
    await sleep(4000);
  }

  const url = page.url();

  if (url.includes('/create/style') || url.includes('create/details')) {
    // 이미 이미지가 선택된 상태
    console.log('이미지 선택됨:', url.substring(0, 60));

    // style → details
    if (url.includes('/style')) {
      console.log('다음(style→details)...');
      const nextBtn = page.locator('div[role="button"]').filter({ hasText: /다음|Next/ }).first();
      if (await nextBtn.isVisible().catch(() => false)) {
        await nextBtn.click();
        await sleep(3000);
        console.log('URL:', page.url().substring(0, 60));
      }
    }

    // details: 캡션 + 공유
    if (page.url().includes('/details')) {
      console.log('캡션 입력...');
      const textarea = page.locator('textarea[aria-label*="문구"], textarea, [contenteditable="true"]').first();
      if (await textarea.isVisible().catch(() => false)) {
        await textarea.click();
        await sleep(500);
        await textarea.fill(CAPTION);
        console.log('캡션 완료');
      }
      await sleep(2000);

      console.log('공유...');
      const shareBtn = page.locator('div[role="button"]').filter({ hasText: /공유|Share/ }).first();
      if (await shareBtn.isVisible().catch(() => false)) {
        await shareBtn.click();
        await sleep(5000);
        console.log('✅ 공유 완료');
      } else {
        console.log('공유 버튼 못 찾음');
      }
    }
  } else {
    // 처음: 이미지 선택
    console.log('이미지 선택...');
    const imgPath = path.join(__dirname, 'aicut_worldcup_main.png');
    if (!fs.existsSync(imgPath)) { console.log('파일 없음'); await ctx.close(); return; }

    await page.setInputFiles('input[type="file"]', imgPath);
    await sleep(3000);
    console.log('이미지 선택 완료, URL:', page.url().substring(0, 60));

    // style → 다음
    const nextBtn = page.locator('div[role="button"]').filter({ hasText: /다음|Next/ }).first();
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await sleep(3000);
      console.log('URL:', page.url().substring(0, 60));
    }

    // details: 캡션 + 공유
    if (page.url().includes('/details')) {
      console.log('캡션 입력...');
      const textarea = page.locator('textarea').first();
      if (await textarea.isVisible().catch(() => false)) {
        await textarea.click();
        await sleep(500);
        await textarea.fill(CAPTION);
        console.log('캡션 완료');
      }
      await sleep(2000);

      console.log('공유...');
      const shareBtn = page.locator('div[role="button"]').filter({ hasText: /공유|Share/ }).first();
      if (await shareBtn.isVisible().catch(() => false)) {
        await shareBtn.click();
        await sleep(5000);
        console.log('✅ 공유 완료');
      } else {
        console.log('공유 버튼 못 찾음');
      }
    }
  }

  console.log('최종 URL:', page.url().substring(0, 80));
  await ctx.close();
})().catch(e => console.error('ERR:', e.message));
