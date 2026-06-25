const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');

const POST = `영상 편집 의뢰하면 가장 많이 듣는 말 👂

"이번 달에 올리려고 했는데 편집이 밀려서..."

에이컷은 이 문제를 월정액으로 해결했어요.
전담 에디터가 매달 정해진 날짜에 납품 → 업로드 일정 절대 안 밀림 🗓️

#영상편집 #콘텐츠제작 #마케팅 #숏폼`;

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  try { await page.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e) {}
  await new Promise(r => setTimeout(r, 3000));

  // "새로운 소식이 있나요?" 클릭으로 입력창 활성화
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const btn = btns.find(b => b.innerText?.trim() === '새로운 소식이 있나요?');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // 입력창 대기
  let box = null;
  try { box = await page.waitForSelector('[contenteditable="true"]', { timeout: 5000 }); } catch(e) {}
  if (!box) { console.log('입력창 없음'); await b.close(); return; }

  await box.click();
  await new Promise(r => setTimeout(r, 300));

  // 줄바꿈 포함 타이핑
  const lines = POST.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]) await page.keyboard.type(lines[i], { delay: 20 });
    if (i < lines.length - 1) {
      await page.keyboard.down('Shift');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Shift');
      await new Promise(r => setTimeout(r, 30));
    }
  }

  const len = await page.evaluate(() => document.querySelector('[contenteditable="true"]')?.innerText.trim().length || 0);
  console.log(`입력 완료: ${len}자`);
  console.log('✅ 게시 버튼만 눌러주세요!');

  await b.close();
})().catch(e => console.error('ERR:', e.message));
