const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');
const path = require('path');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // PostWriteForm iframe이 있는 탭 찾기
  let post1Page = null, post2Page = null;
  for (const p of ctx.pages()) {
    const url = p.url();
    // PostWriteForm iframe 포함 여부 확인
    const hasFormFrame = p.frames().some(f => f.url().includes('PostWriteForm'));
    if (hasFormFrame) {
      if (!post1Page) {
        post1Page = p;
        console.log('✅ 포스팅1 탭 발견:', url.substring(0, 80));
      } else if (!post2Page) {
        post2Page = p;
        console.log('✅ 포스팅2 탭 발견:', url.substring(0, 80));
      }
    }
  }

  if (!post1Page) {
    console.log('❌ 에디터 탭이 없습니다. 글쓰기 페이지를 먼저 열어주세요.');
    b.close();
    return;
  }

  // ========================================
  // Post 1: 프로야구
  // ========================================
  console.log('\n━━━ ⚾ 포스팅 1: 프로야구 ━━━');
  await post1Page.bringToFront();
  await sleep(2000);

  const frame1 = post1Page.frames().find(f => f.url().includes('PostWriteForm'));
  if (!frame1) { console.log('❌ iframe 없음'); b.close(); return; }

  // 제목
  const title1 = '프로야구 시즌, KBO 구단이 숏폼 하나로 팬을 모으는 법 — 영상 편집 외주로 준비하는 하반기';
  const t1 = await frame1.evaluate((t) => {
    if (SmartEditor && SmartEditor._editors && SmartEditor._editors.blogpc001) {
      SmartEditor._editors.blogpc001.setDocumentTitle(t);
      return '✅ 제목 입력';
    }
    return '❌ 실패';
  }, title1);
  console.log(`  ${t1}`);

  // 본문
  const html1 = fs.readFileSync(path.join(__dirname, 'aicut_blog_baseball.html'), 'utf-8');
  const b1 = await frame1.evaluate((html) => {
    if (SmartEditor && SmartEditor._editors && SmartEditor._editors.blogpc001) {
      SmartEditor._editors.blogpc001.setDocumentData(html);
      return '✅ 본문 입력 (' + html.length + '자)';
    }
    return '❌ 실패';
  }, html1);
  console.log(`  ${b1}`);
  await sleep(2000);

  // 저장
  await frame1.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent.trim() === '저장') { b.click(); return; }
    }
  });
  console.log('  ✅ 저장 완료');

  // ========================================
  // Post 2: 주말 장맛비
  // ========================================
  if (post2Page) {
    console.log('\n━━━ 🌧 포스팅 2: 주말 장맛비 ━━━');
    await post2Page.bringToFront();
    await sleep(2000);

    const frame2 = post2Page.frames().find(f => f.url().includes('PostWriteForm'));
    if (!frame2) { console.log('❌ iframe 없음'); b.close(); return; }

    const title2 = '주말 장맛비, 집에서 영상 편집 외주 알아보는 당신에게 — 에이컷이 알려주는 하반기 준비';
    const t2 = await frame2.evaluate((t) => {
      if (SmartEditor && SmartEditor._editors && SmartEditor._editors.blogpc001) {
        SmartEditor._editors.blogpc001.setDocumentTitle(t);
        return '✅ 제목 입력';
      }
      return '❌ 실패';
    }, title2);
    console.log(`  ${t2}`);

    const html2 = fs.readFileSync(path.join(__dirname, 'aicut_blog_rainy.html'), 'utf-8');
    const b2 = await frame2.evaluate((html) => {
      if (SmartEditor && SmartEditor._editors && SmartEditor._editors.blogpc001) {
        SmartEditor._editors.blogpc001.setDocumentData(html);
        return '✅ 본문 입력 (' + html.length + '자)';
      }
      return '❌ 실패';
    }, html2);
    console.log(`  ${b2}`);
    await sleep(2000);

    await frame2.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent.trim() === '저장') { b.click(); return; }
      }
    });
    console.log('  ✅ 저장 완료');
  } else {
    console.log('\n포스팅2 탭 없음 - 하나만 처리했습니다.');
  }

  console.log('\n━━━ ✅ 작업 완료 ━━━');
  console.log('  📸 이미지 12장 업로드 부탁드립니다!');

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));
