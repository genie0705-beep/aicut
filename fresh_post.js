// 에디터 초기화 후 처음부터 작성
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

const TITLE = '영상편집 외주, 매달 다른 사람에게 맡기던 쇼핑몰이 선택한 방법';

const SECTIONS = [
  `💡 고객사례 Summary\n\n경기도 소재 이커머스 운영사 B사.\n마케팅 담당자 1인 운영.\n월 SNS 영상 10편 목표 → 실제 발행 3~4편.\n\n에이컷 도입 후 2개월,\n월 10편 정시 납품 달성.\n상품 영상 제작 리드타임 평균 9일 → 2일로 단축.`,
  `💡 이런 상황이었어요\n\nB사는 스마트스토어와 자사몰을 함께 운영하는 이커머스 브랜드다.\n시즌마다 신상품이 쏟아지고, SNS 콘텐츠 수요는 꾸준히 늘었다.\n\n문제는 매달 다른 프리랜서를 찾아야 한다는 것이었다.\n\n이번 달 맡긴 편집자는 다음 달에 다른 프로젝트로 이미 꽉 찼고,\n가격도 편당 협의라 예산 예측이 안 됐다.\n\n색감, 자막 스타일, BGM 분위기가 영상마다 제각각이었다.\n\n시즌 캠페인 영상 5편을 맡겼다가 납품이 7일 지연돼\n광고 집행 일정이 전부 밀린 경험도 있었다.`,
  `💡 에이컷을 알게 된 계기\n\n"영상편집 월정액"으로 검색하다 에이컷을 발견했다.\n\n처음 눈에 들어온 건 두 가지였다.\n\n하나, 전담 에디터 고정 배정.\n둘, 브랜드 가이드 저장 시스템.\n\n상담 신청 후 전담 매니저가 운영 채널, 월 제작량, 타겟 고객층을 먼저 물어봤다.\n\n그 자리에서 숏폼 전담팀과 롱폼 팀이 분리 운영된다는 걸 확인했고,\n이커머스 포트폴리오를 직접 보여줬다.`,
  `💡 도입 첫 달, 달라진 것들\n\n브랜드 가이드를 한 번 정리해 공유했다.\n색상 코드, 로고 위치, 자막 폰트, BGM 방향성까지.\n\n두 번째 영상부터는 따로 설명하지 않았다.\n\n캠페인 영상 5편을 의뢰했을 때 전편 납기 내 완료됐고,\n광고 집행 일정을 단 하루도 밀리지 않았다.\n\n마케팅 담당자가 편집 커뮤니케이션에 쓰는 시간이\n주 8시간에서 1시간 이내로 줄었다.`,
  `👀 같은 고민을 하고 계신가요?\n\n매달 새로운 편집자를 구하고,\n브랜드 톤이 흔들리고,\n납기 때문에 광고 일정이 밀린다면 —\n\n에이컷 무료 상담을 신청해보세요.\n\naicut.co.kr 무료상담 신청\n서울시 송파구 법원로 8길 8 SKV1 2차 1118호\n\n\nFAQ\n\nQ. 시즌마다 영상 스타일이 달라져야 하는 경우에도 대응되나요?\n네. 기본 브랜드 가이드를 유지하면서 시즌별 컬러·분위기 변형 요청이 가능합니다.\n\nQ. 상품 영상과 SNS 숏폼을 동시에 제작해야 할 때는요?\n에이컷 STANDARD 플랜 이상은 유튜브 원본 → 숏폼 자동 컷이 포함됩니다.\n\n\n#이커머스영상편집 #쇼핑몰영상외주 #SNS영상제작 #영상편집월정액 #에이컷 #AICUT #전담편집팀 #48시간납품 #브랜드영상일관성 #숏폼마케팅 #릴스편집외주 #영상편집외주 #월정액편집 #스마트스토어마케팅 #이커머스마케팅 #상품영상편집 #마케팅영상 #영상편집대행 #콘텐츠마케팅 #영상제작외주`
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function typeLines(page, text) {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length > 0) await page.keyboard.type(lines[i], { delay: 12 });
    if (i < lines.length - 1) { await page.keyboard.press('Enter'); await sleep(30); }
  }
}

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const pages = context.pages();
  let editorPage = pages.find(p => p.url().includes('Redirect=Write'));
  const mainFrame = editorPage.frame({ name: 'mainFrame' });

  // ── 전체 내용 삭제 (Ctrl+A → Delete)
  console.log('[STEP 0] Clearing editor...');
  await editorPage.mouse.click(500, 400);
  await sleep(300);
  await editorPage.keyboard.press('Control+Home');
  await sleep(300);
  await editorPage.keyboard.press('Tab'); // 제목으로
  await sleep(200);
  await editorPage.keyboard.press('Control+a');
  await sleep(200);
  await editorPage.keyboard.press('Delete');
  await sleep(300);
  // 본문 전체 선택 삭제
  await editorPage.mouse.click(500, 350);
  await sleep(300);
  await editorPage.keyboard.press('Control+a');
  await sleep(200);
  await editorPage.keyboard.press('Delete');
  await sleep(500);
  await editorPage.screenshot({ path: path.join(IMG_DIR, 'clean_01.png') });
  console.log('[INFO] Cleared');

  // ── 제목 입력
  console.log('[STEP 1] Title...');
  await editorPage.mouse.click(590, 185);
  await sleep(500);
  await editorPage.keyboard.press('Control+a');
  await sleep(200);
  await editorPage.keyboard.type(TITLE, { delay: 15 });
  await sleep(400);

  // ── 본문으로 이동
  await editorPage.keyboard.press('Tab');
  await sleep(400);

  // ── 섹션별: 이미지 → 텍스트
  for (let i = 0; i < SECTIONS.length; i++) {
    console.log(`\n[STEP ${i+2}] Section ${i+1}: image + text...`);

    // 이미지 삽입
    try {
      const [fc] = await Promise.all([
        editorPage.waitForEvent('filechooser', { timeout: 8000 }),
        mainFrame.evaluate(() => {
          const btn = document.querySelector('.se-image-toolbar-button');
          if (btn) { btn.click(); return true; }
          return false;
        })
      ]);
      await fc.setFiles(IMAGES[i]);
      console.log(`  [OK] Image ${i+1} uploaded`);
      await sleep(5000);
    } catch(e) {
      console.log(`  [WARN] Image ${i+1}:`, e.message.substring(0,50));
    }

    // 이미지 아래로 커서 이동
    await editorPage.keyboard.press('ArrowDown');
    await sleep(200);
    await editorPage.keyboard.press('Enter');
    await sleep(200);

    // 텍스트 입력
    await typeLines(editorPage, SECTIONS[i]);
    await editorPage.keyboard.press('Enter');
    await editorPage.keyboard.press('Enter');
    await sleep(300);

    await editorPage.screenshot({ path: path.join(IMG_DIR, `clean_s${i+1}.png`) });
  }

  // ── 임시저장
  console.log('\n[FINAL] Saving...');
  await mainFrame.evaluate(() => {
    const btn = document.querySelector('.save_btn__bzc5B');
    if (btn) btn.click();
  });
  await sleep(2000);
  await editorPage.screenshot({ path: path.join(IMG_DIR, 'clean_done.png') });
  console.log('[DONE] Post ready for publish.');

  await browser.close();
})().catch(e => console.error('[ERROR]', e.message));
