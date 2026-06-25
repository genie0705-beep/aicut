const { chromium } = require('playwright');

async function run() {
  const cdpPort = process.env.CDP_PORT || 9223;
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`);
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();

  // 다이얼로그 자동 처리
  page.on('dialog', async dialog => {
    console.log('⚠️ 다이얼로그:', dialog.message().substring(0, 100));
    await dialog.dismiss().catch(() => {});
  });

  // 1. 네이버 블로그 메인 접속 (로그인 확인)
  console.log('📝 네이버 블로그 접속...');
  await page.goto('https://blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log('현재 URL:', page.url());

  // 로그인 확인
  const loginCheck = await page.evaluate(() => {
    const body = document.body.innerText;
    return {
      hasLoginBtn: body.includes('로그인'),
      hasMyBlog: body.includes('블로그') || body.includes('관리'),
      preview: body.substring(0, 300)
    };
  });
  console.log('블로그 로그인 상태:', loginCheck);

  // 2. 글쓰기 페이지
  console.log('✏️ 글쓰기 페이지 이동...');
  await page.goto('https://blog.naver.com/WriteForm.nhn?blogId=aicut&categoryNo=1', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  console.log('글쓰기 URL:', page.url());

  // 3. 에디터 iframe 확인
  const editorInfo = await page.evaluate(() => {
    const iframes = document.querySelectorAll('iframe');
    const info = [];
    iframes.forEach((f, i) => {
      info.push({ idx: i, id: f.id, title: f.title, name: f.name, src: f.src?.substring(0,100) });
    });
    
    // SmartEditor 인스턴스 확인
    const hasSE = typeof window.SmartEditor !== 'undefined';
    const seEditors = window.SmartEditor?._editors ? Object.keys(window.SmartEditor._editors) : [];
    
    return { iframes: info, hasSE, seEditors, url: window.location.href };
  });
  console.log('에디터 iframe:', JSON.stringify(editorInfo, null, 2));

  // 4. SmartEditor API로 제목 설정
  if (editorInfo.hasSE) {
    console.log('SmartEditor 감지됨, 제목 설정 시도...');
    const titleResult = await page.evaluate(() => {
      const editors = window.SmartEditor._editors;
      const key = Object.keys(editors)[0];
      if (key && editors[key].setDocumentTitle) {
        editors[key].setDocumentTitle('IR 피칭 3번 실패하고 AI 툴 5개 써본 스타트업이 찾은 해결책');
        return `✅ 제목 설정 완료 (editor: ${key})`;
      }
      return '❌ setDocumentTitle 없음';
    });
    console.log(titleResult);
  }

  // 5. 본문 내용 확인
  const pageText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log('페이지 텍스트 (앞 1000자):', pageText);

  await browser.close();
  console.log('\n✅ 분석 완료');
}

run().catch(e => console.error('❌ 실패:', e.message));
