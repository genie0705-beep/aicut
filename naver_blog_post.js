const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const IMG_DIR = path.join(__dirname, 'blog_images');

const TITLE = '영상편집 외주, 매달 다른 사람에게 맡기던 쇼핑몰이 선택한 방법';
const CATEGORY_NAME = '고객사례 도입이야기';

const SECTIONS = [
  {
    img: path.join(IMG_DIR, '01_summary.png'),
    text: `💡 고객사례 Summary\n\n경기도 소재 이커머스 운영사 B사.\n마케팅 담당자 1인 운영.\n월 SNS 영상 10편 목표 → 실제 발행 3~4편.\n\n에이컷 도입 후 2개월,\n월 10편 정시 납품 달성.\n상품 영상 제작 리드타임 평균 9일 → 2일로 단축.`
  },
  {
    img: path.join(IMG_DIR, '02_problem.png'),
    text: `💡 이런 상황이었어요\n\nB사는 스마트스토어와 자사몰을 함께 운영하는 이커머스 브랜드다.\n시즌마다 신상품이 쏟아지고, SNS 콘텐츠 수요는 꾸준히 늘었다.\n\n문제는 매달 다른 프리랜서를 찾아야 한다는 것이었다.\n\n이번 달 맡긴 편집자는 다음 달에 다른 프로젝트로 이미 꽉 찼고,\n가격도 편당 협의라 예산 예측이 안 됐다.\n\n더 큰 문제는 브랜드 톤이 매번 달라진다는 것이었다.\n\n색감, 자막 스타일, BGM 분위기가 영상마다 제각각이었다.\n팔로워들이 채널을 기억하기 어려운 구조였다.\n\n시즌 캠페인 영상 5편을 맡겼다가 납품이 7일 지연돼\n광고 집행 일정이 전부 밀린 경험도 있었다.`
  },
  {
    img: path.join(IMG_DIR, '03_reason.png'),
    text: `💡 에이컷을 알게 된 계기\n\n"영상편집 월정액"으로 검색하다 에이컷을 발견했다.\n\n처음 눈에 들어온 건 두 가지였다.\n\n하나, 전담 에디터 고정 배정.\n둘, 브랜드 가이드 저장 시스템.\n\n상담 신청 후 전담 매니저가 운영 채널, 월 제작량, 타겟 고객층을 먼저 물어봤다.\n\n그 자리에서 숏폼 전담팀과 롱폼 팀이 분리 운영된다는 걸 확인했고,\n이커머스 포트폴리오를 직접 보여줬다.`
  },
  {
    img: path.join(IMG_DIR, '04_result.png'),
    text: `💡 도입 첫 달, 달라진 것들\n\n브랜드 가이드를 한 번 정리해 공유했다.\n색상 코드, 로고 위치, 자막 폰트, BGM 방향성까지.\n\n두 번째 영상부터는 따로 설명하지 않았다.\n\n시즌 기획 일정에 맞춰 영상 소스만 업로드하면 납품 예정일이 바로 잡혔다.\n\n캠페인 영상 5편을 의뢰했을 때 전편 납기 내 완료됐고,\n광고 집행 일정을 단 하루도 밀리지 않았다.\n\n마케팅 담당자가 편집 커뮤니케이션에 쓰는 시간이\n주 8시간에서 1시간 이내로 줄었다.`
  },
  {
    img: path.join(IMG_DIR, '05_cta.png'),
    text: `👀 같은 고민을 하고 계신가요?\n\n매달 새로운 편집자를 구하고,\n브랜드 톤이 흔들리고,\n납기 때문에 광고 일정이 밀린다면 —\n\n에이컷 무료 상담을 신청해보세요.\n\n업종과 월 제작량에 맞는 플랜을 전담 매니저가 직접 안내해드립니다.\n\naicut.co.kr 무료상담 신청\n서울시 송파구 법원로 8길 8 SKV1 2차 1118호\n\n\nFAQ\n\nQ. 시즌마다 영상 스타일이 달라져야 하는 경우에도 대응되나요?\n네. 기본 브랜드 가이드를 유지하면서 시즌별 컬러·분위기 변형 요청이 가능합니다.\n\nQ. 상품 영상과 SNS 숏폼을 동시에 제작해야 할 때는요?\n에이컷 STANDARD 플랜 이상은 유튜브 원본 → 숏폼 자동 컷이 포함됩니다.\n\n\n#이커머스영상편집 #쇼핑몰영상외주 #SNS영상제작 #영상편집월정액 #에이컷 #AICUT #전담편집팀 #48시간납품 #브랜드영상일관성 #숏폼마케팅 #릴스편집외주 #영상편집외주 #월정액편집 #스마트스토어마케팅 #이커머스마케팅 #상품영상편집 #마케팅영상 #영상편집대행 #콘텐츠마케팅 #영상제작외주 #브랜드가이드 #영상편집서비스 #전담매니저 #영상편집비용 #SNS콘텐츠 #숏폼편집 #유튜브편집외주 #영상편집전문 #캠페인영상 #영상편집파트너`
  }
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function typeLines(page, text) {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length > 0) {
      await page.keyboard.type(lines[i], { delay: 15 });
    }
    if (i < lines.length - 1) {
      await page.keyboard.press('Enter');
      await sleep(40);
    }
  }
}

(async () => {
  console.log('[INFO] Connecting to Edge CDP...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const pages = context.pages();
  console.log('[INFO] Open pages:', pages.length);
  for (const p of pages) console.log('  -', p.url().substring(0, 70));

  // 에디터 페이지 확인
  let editorPage = pages.find(p => p.url().includes('Redirect=Write'));
  if (!editorPage) {
    editorPage = await context.newPage();
    await editorPage.goto('https://blog.naver.com/aicut?Redirect=Write', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(5000);
  }

  // iframe 구조 다시 확인
  const frames = editorPage.frames();
  console.log('[INFO] Frames:', frames.length);
  frames.forEach((f, i) => console.log(`  [${i}] ${f.url().substring(0, 80)}`));

  // ──────────────────────────────────────────
  // STEP 1: 제목 입력 (page 레벨에서 작업 - 에디터는 page 좌표계)
  // ──────────────────────────────────────────
  console.log('[STEP 1] Clicking title area...');
  // 실제 화면 좌표 기준 제목 클릭 (스크린샷에서 "제목" placeholder 위치)
  await editorPage.mouse.click(590, 185);
  await sleep(800);

  // 기존 내용 있으면 전체 선택 후 삭제
  await editorPage.keyboard.press('Control+a');
  await sleep(200);
  await editorPage.keyboard.type(TITLE, { delay: 20 });
  await sleep(500);
  await editorPage.screenshot({ path: path.join(IMG_DIR, 'post_01_title.png') });
  console.log('[INFO] Title entered');

  // ──────────────────────────────────────────
  // STEP 2: 본문 영역 클릭
  // ──────────────────────────────────────────
  console.log('[STEP 2] Clicking body area...');
  await editorPage.mouse.click(590, 270);
  await sleep(800);

  // ──────────────────────────────────────────
  // STEP 3: 섹션별 이미지 + 텍스트
  // ──────────────────────────────────────────
  for (let i = 0; i < SECTIONS.length; i++) {
    const section = SECTIONS[i];
    console.log(`\n[STEP 3.${i+1}] Inserting image ${i+1}...`);

    // 사진 버튼 클릭 (.se-image-toolbar-button)
    let imgInserted = false;
    try {
      const [fileChooser] = await Promise.all([
        editorPage.waitForEvent('filechooser', { timeout: 6000 }),
        editorPage.evaluate(() => {
          const btns = document.querySelectorAll('button');
          const photoBtn = Array.from(btns).find(b => b.className.includes('se-image-toolbar-button'));
          if (photoBtn) { photoBtn.click(); return true; }
          return false;
        }),
      ]);
      await fileChooser.setFiles(section.img);
      imgInserted = true;
      console.log(`[INFO] Image ${i+1} uploaded`);
      await sleep(4000);
    } catch (e) {
      console.log('[WARN] Image upload attempt failed:', e.message.substring(0, 50));
    }

    // 이미지 업로드 후 또는 실패 시 텍스트 입력
    await editorPage.keyboard.press('End');
    await editorPage.keyboard.press('Enter');
    await sleep(300);

    console.log(`[STEP 3.${i+1}] Typing text...`);
    await typeLines(editorPage, section.text);
    await editorPage.keyboard.press('Enter');
    await editorPage.keyboard.press('Enter');
    await sleep(400);

    await editorPage.screenshot({ path: path.join(IMG_DIR, `post_section_${i+1}.png`) });
    console.log(`[INFO] Section ${i+1} done`);
  }

  // ──────────────────────────────────────────
  // STEP 4: 발행 패널 열기 + 카테고리
  // ──────────────────────────────────────────
  console.log('\n[STEP 4] Opening publish panel...');
  await editorPage.evaluate(() => {
    const btn = document.querySelector('.publish_btn__m9KHH');
    if (btn) btn.click();
  });
  await sleep(3000);
  await editorPage.screenshot({ path: path.join(IMG_DIR, 'post_05_publish.png') });

  // 카테고리 드롭다운 탐색
  const catInfo = await editorPage.evaluate((catName) => {
    // 카테고리 select 요소 찾기
    const selects = document.querySelectorAll('select');
    const results = Array.from(selects).map(s => ({
      name: s.name,
      id: s.id,
      class: s.className.substring(0, 40),
      options: Array.from(s.options).map(o => o.text),
    }));
    return results;
  }, CATEGORY_NAME);
  console.log('[INFO] Selects found:', JSON.stringify(catInfo, null, 2));

  // 카테고리 select 처리
  try {
    await editorPage.evaluate((catName) => {
      const selects = document.querySelectorAll('select');
      for (const sel of selects) {
        const opts = Array.from(sel.options);
        const match = opts.find(o => o.text.includes(catName) || o.text.includes('고객사례'));
        if (match) {
          sel.value = match.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('Category set to:', match.text);
          return;
        }
      }
    }, CATEGORY_NAME);
  } catch (e) {
    console.log('[WARN] Category set failed:', e.message.substring(0, 50));
  }

  await sleep(1000);
  await editorPage.screenshot({ path: path.join(IMG_DIR, 'post_06_category.png') });

  // 임시저장
  console.log('\n[STEP 5] Saving draft...');
  await editorPage.evaluate(() => {
    const btn = document.querySelector('.save_btn__bzc5B');
    if (btn) btn.click();
  });
  await sleep(2000);
  await editorPage.screenshot({ path: path.join(IMG_DIR, 'post_07_saved.png') });

  console.log('\n[DONE] Post ready. Check blog_images/post_*.png for status.');
  await browser.close();
})();
