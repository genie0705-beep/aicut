// 키보드로 커서 이동하며 이미지 삽입
const { chromium } = require('playwright');
const path = require('path');
const IMG_DIR = path.join(__dirname, 'blog_images');

const IMAGES = [
  path.join(IMG_DIR, '01_summary.png'),
  path.join(IMG_DIR, '02_problem.png'),
  path.join(IMG_DIR, '03_reason.png'),
  path.join(IMG_DIR, '04_result.png'),
  path.join(IMG_DIR, '05_cta.png'),
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function insertImageAtCurrentPosition(editorPage, imgPath) {
  // 사진 버튼 클릭 (data-se-btn 속성 확인)
  const [fileChooser] = await Promise.all([
    editorPage.waitForEvent('filechooser', { timeout: 10000 }),
    editorPage.frames()[1].evaluate(() => {
      // 사진 버튼 찾기 - 다양한 방법 시도
      const methods = [
        () => document.querySelector('.se-image-toolbar-button'),
        () => {
          const btns = document.querySelectorAll('button');
          return Array.from(btns).find(b => b.textContent.trim() === '사진' || b.getAttribute('data-se-btn') === 'image');
        },
        () => document.querySelector('[class*="image"][class*="toolbar"]'),
      ];
      for (const method of methods) {
        const btn = method();
        if (btn) { btn.click(); return btn.className; }
      }
      return null;
    })
  ]);
  await fileChooser.setFiles(imgPath);
  await sleep(5000);
}

(async () => {
  console.log('[INFO] Connecting to Edge CDP...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const pages = context.pages();
  const editorPage = pages.find(p => p.url().includes('Redirect=Write'));
  if (!editorPage) { console.log('[ERROR] No editor page'); await browser.close(); process.exit(1); }

  const f1 = editorPage.frames()[1];

  // 먼저 현재 상태 스크린샷
  await editorPage.screenshot({ path: path.join(IMG_DIR, 'img_insert_start.png') });
  
  // Ctrl+Home으로 에디터 맨 위로
  await editorPage.mouse.click(590, 300); // 에디터 본문 클릭
  await sleep(500);
  await editorPage.keyboard.press('Control+Home');
  await sleep(500);
  await editorPage.screenshot({ path: path.join(IMG_DIR, 'img_insert_top.png') });

  // 각 이미지는 해당 섹션 텍스트 앞에 삽입
  // 전략: Ctrl+Home 후 → Enter로 빈 줄 만들기 → Home → 이미지 삽입 → 텍스트 삽입
  // 하지만 텍스트가 이미 있으므로 각 섹션 앞에 커서 위치 찾기
  
  // Ctrl+F 로 텍스트 찾기가 에디터에서 작동하는지 확인
  // 대신 Ctrl+Home 후 섹션 수만큼 이동
  
  // 맨 위(제목)에서 시작 → 첫 본문 줄로 이동
  await editorPage.keyboard.press('Control+Home');
  await sleep(300);
  await editorPage.keyboard.press('Tab'); // 제목 → 본문
  await sleep(300);
  
  // 현재 위치: 본문 첫 줄 시작
  // 이미지 1 삽입 (💡 고객사례 Summary 앞)
  console.log('[STEP 1] Inserting image 1 at the very beginning of body...');
  await editorPage.keyboard.press('Home');
  await sleep(200);
  
  try {
    await insertImageAtCurrentPosition(editorPage, IMAGES[0]);
    console.log('[INFO] Image 1 inserted');
    // 이미지 삽입 후 Enter
    await editorPage.keyboard.press('End');
    await editorPage.keyboard.press('Enter');
    await sleep(300);
  } catch(e) {
    console.log('[WARN] Image 1 failed:', e.message.substring(0,60));
  }
  await editorPage.screenshot({ path: path.join(IMG_DIR, 'img_after_1.png') });

  // 나머지 이미지들: 각 섹션 헤더 바로 앞에 삽입
  // Ctrl+F는 에디터에서 막혀있을 수 있으므로 
  // 섹션 구분은 "💡" 이모지로 검색 (브라우저 내장 검색 Ctrl+F)
  
  const anchors = [
    '이런 상황이었어요',
    '에이컷을 알게 된 계기', 
    '도입 첫 달, 달라진',
    '같은 고민을',
  ];
  
  for (let i = 0; i < anchors.length; i++) {
    console.log(`\n[STEP ${i+2}] Finding "${anchors[i]}"...`);
    
    // Ctrl+F로 찾기
    await editorPage.keyboard.press('Control+f');
    await sleep(1000);
    await editorPage.screenshot({ path: path.join(IMG_DIR, `find_${i+2}.png`) });
    
    // 검색창에 텍스트 입력
    await editorPage.keyboard.type(anchors[i], { delay: 50 });
    await sleep(1000);
    await editorPage.keyboard.press('Enter');
    await sleep(500);
    await editorPage.keyboard.press('Escape'); // 검색 닫기
    await sleep(500);
    
    // 현재 선택된 텍스트 앞으로 이동
    await editorPage.keyboard.press('Home');
    await sleep(200);
    
    await editorPage.screenshot({ path: path.join(IMG_DIR, `before_img_${i+2}.png`) });
    
    // 새 줄 추가 후 위로 이동
    await editorPage.keyboard.press('ArrowUp');
    await sleep(200);
    await editorPage.keyboard.press('End');
    await sleep(200);
    await editorPage.keyboard.press('Enter');
    await sleep(200);
    
    // 이미지 삽입
    try {
      await insertImageAtCurrentPosition(editorPage, IMAGES[i + 1]);
      console.log(`[INFO] Image ${i+2} inserted`);
    } catch(e) {
      console.log(`[WARN] Image ${i+2} failed:`, e.message.substring(0,60));
    }
    await editorPage.screenshot({ path: path.join(IMG_DIR, `after_img_${i+2}.png`) });
  }

  // 최종 저장
  console.log('\n[FINAL] Saving...');
  await f1.evaluate(() => {
    const btn = document.querySelector('.save_btn__bzc5B');
    if (btn) btn.click();
  });
  await sleep(2000);
  await editorPage.screenshot({ path: path.join(IMG_DIR, 'final_with_images.png') });
  console.log('[DONE] Done!');
  
  await browser.close();
})().catch(e => {
  console.error('[ERROR]', e.message);
  process.exit(1);
});
