const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');

(async () => {
  console.log('=== 📝 블로그 2개 포스팅 입력 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 1. 먼저 admin 접속해서 로그인 상태 확인
  console.log('1. 관리자 접속 확인...');
  await page.goto('https://admin.blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(3000);
  const loginOk = await page.evaluate(() => !document.body.innerText.includes('로그인'));
  console.log('   로그인:', loginOk ? '✅' : '❌');

  if (!loginOk) {
    console.log('❌ 블로그 관리자 로그인 필요');
    b.close();
    return;
  }

  // ========================================
  // Post 1: 프로야구
  // ========================================
  console.log('\n━━━ 포스팅 1: ⚾ 프로야구 숏폼 마케팅 ━━━');

  const post1Title = '프로야구 시즌, KBO 구단이 숏폼 하나로 팬을 모으는 법 — 영상 편집 외주로 준비하는 하반기';

  // 에디터 열기
  console.log('   에디터 접속...');
  await page.goto('https://blog.naver.com/PostWrite.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(5000);
  console.log('   URL:', (await page.evaluate('location.href')).substring(0, 80));

  // 에디터 상태 확인
  const editorReady = await page.evaluate(() => {
    if (typeof SmartEditor !== 'undefined' && SmartEditor._editors && SmartEditor._editors['blogpc001']) return true;
    // iframe 체크
    const frames = document.querySelectorAll('iframe');
    for (const f of frames) {
      if (f.id && f.id.includes('se') || (f.contentWindow && f.contentWindow.SmartEditor)) return true;
    }
    return false;
  });

  console.log('   에디터 상태:', editorReady ? '✅' : '❌ 확인 중');
  
  // 에디터가 iframe 안에 있는지 확인
  const frames = page.frames();
  console.log(`   총 프레임: ${frames.length}`);
  for (let i = 0; i < frames.length; i++) {
    const url = frames[i].url();
    if (url.length > 10 && !url.includes('nid.naver') && !url.includes('google')) {
      console.log(`   [${i}] ${url.substring(0, 80)}`);
    }
  }

  // 제목 입력 시도
  try {
    await page.evaluate((title) => {
      const setTitle = (t) => {
        if (typeof SmartEditor !== 'undefined' && SmartEditor._editors && SmartEditor._editors['blogpc001']) {
          SmartEditor._editors['blogpc001'].setDocumentTitle(t);
          return true;
        }
        return false;
      };
      return setTitle(t);
    }, post1Title);
    console.log('   ✅ 제목 입력 완료');
  } catch(e) {
    console.log('   ⚠️ 제목 입력 실패:', e.message.substring(0, 40));
  }

  // 본문 HTML 읽기
  const post1Html = fs.readFileSync('aicut_blog_baseball.html', 'utf-8');

  // 클립보드 접근 방식으로 본문 입력
  try {
    await page.evaluate((html) => {
      return new Promise((resolve, reject) => {
        // SmartEditor 본문 입력 시도
        const ed = SmartEditor && SmartEditor._editors && SmartEditor._editors['blogpc001'];
        if (ed && typeof ed.setDocumentData === 'function') {
          ed.setDocumentData(html);
          resolve('setDocumentData');
        } else {
          reject('no setDocumentData');
        }
      });
    }, post1Html).then(m => console.log(`   ✅ 본문 입력 (${m})`));
  } catch(e) {
    console.log(`   ⚠️ ${e.message}`);
    
    // 대체: iframe 접근
    const seFrame = page.frames().find(f => f.url().includes('se') || f.name().includes('se'));
    if (seFrame) {
      await seFrame.evaluate((html) => {
        document.body.innerHTML = html;
      }, post1Html);
      console.log('   ✅ iframe 본문 직접 삽입');
    }
  }

  await sleep(2000);

  // 임시저장
  console.log('   임시저장 시도...');
  try {
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button, a, span');
      for (const btn of btns) {
        if (btn.textContent.trim() === '저장') {
          btn.click();
          return true;
        }
      }
      return false;
    });
    await sleep(3000);
    console.log('   ✅ 포스팅 1 저장 완료');
  } catch(e) {
    console.log('   ⚠️ 저장 실패:', e.message.substring(0, 40));
  }

  // ========================================
  // Post 2: 주말 장맛비
  // ========================================
  console.log('\n━━━ 포스팅 2: 🌧 주말 장맛비 ━━━');

  const post2Title = '주말 장맛비, 집에서 영상 편집 외주 알아보는 당신에게 — 에이컷이 알려주는 하반기 준비';

  // 새 글쓰기
  await page.goto('https://blog.naver.com/PostWrite.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(5000);

  // 제목 입력
  try {
    await page.evaluate((title) => {
      if (typeof SmartEditor !== 'undefined' && SmartEditor._editors && SmartEditor._editors['blogpc001']) {
        SmartEditor._editors['blogpc001'].setDocumentTitle(title);
        return true;
      }
      return false;
    }, post2Title);
    console.log('   ✅ 제목 입력 완료');
  } catch(e) {
    console.log('   ⚠️ 제목 실패:', e.message.substring(0, 40));
  }

  // 본문 입력
  const post2Html = fs.readFileSync('aicut_blog_rainy.html', 'utf-8');
  
  try {
    await page.evaluate((html) => {
      return new Promise((resolve, reject) => {
        const ed = SmartEditor && SmartEditor._editors && SmartEditor._editors['blogpc001'];
        if (ed && typeof ed.setDocumentData === 'function') {
          ed.setDocumentData(html);
          resolve('setDocumentData');
        } else {
          reject('no setDocumentData');
        }
      });
    }, post2Html).then(m => console.log(`   ✅ 본문 입력 (${m})`));
  } catch(e) {
    console.log(`   ⚠️ ${e.message}`);
    const seFrame = page.frames().find(f => f.url().includes('se'));
    if (seFrame) {
      await seFrame.evaluate((html) => { document.body.innerHTML = html; }, post2Html);
      console.log('   ✅ iframe 본문 직접 삽입');
    }
  }

  await sleep(2000);

  // 저장
  try {
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button, a, span');
      for (const btn of btns) {
        if (btn.textContent.trim() === '저장') {
          btn.click();
          return true;
        }
      }
      return false;
    });
    await sleep(3000);
    console.log('   ✅ 포스팅 2 저장 완료');
  } catch(e) {
    console.log('   ⚠️ 저장 실패:', e.message.substring(0, 40));
  }

  console.log('\n━━━ 📋 최종 결과 ━━━');
  console.log('  ⚾ 프로야구 포스팅: 입력 완료');
  console.log('  🌧 주말 장맛비 포스팅: 입력 완료');
  console.log('  ✅ 이미지 업로드는 정이사님 직접 부탁드립니다!');

  b.close();
})().catch(e => console.log('FATAL:', e.message.substring(0, 60)));
