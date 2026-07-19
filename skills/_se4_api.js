// SE4 — _documentService API로 본문 직접 설정
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  const blogPage = await ctx.newPage();
  console.log('1️⃣ 글쓰기 페이지...');
  await blogPage.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await blogPage.waitForTimeout(8000);
  
  // 2. 제목
  console.log('2️⃣ 제목 설정...');
  await blogPage.evaluate(() => {
    const ed = window.SmartEditor._editors['blogpc001'];
    if (ed && ed.setDocumentTitle) {
      ed.setDocumentTitle('초복 날짜 2026, 하반기 영상 마케팅 준비는 지금부터');
    }
  });
  await blogPage.waitForTimeout(1000);
  
  // 3. HTML 준비
  console.log('3️⃣ HTML 준비...');
  let html = fs.readFileSync('aicut_blog_chobok.html', 'utf8');
  const imgs = ['aicut_blog_chobok_main.png','aicut_blog_chobok_card1.png','aicut_blog_chobok_card2.png','aicut_blog_chobok_card3.png','aicut_blog_chobok_cta.png'];
  for (const f of imgs) {
    const fp = path.join(__dirname, '..', f);
    if (fs.existsSync(fp)) {
      const b64 = fs.readFileSync(fp).toString('base64');
      html = html.replace(new RegExp(`src="${f}"`, 'g'), `src="data:image/png;base64,${b64}"`);
    }
  }
  
  // 4. SE4 API 탐색 — setContents / setBodyHTML / insertHTML 등
  console.log('4️⃣ SE4 API 탐색...');
  const apiInfo = await blogPage.evaluate(() => {
    const ed = window.SmartEditor._editors['blogpc001'];
    if (!ed) return null;
    const r = {};
    const targets = ['_documentService', '_editingService', '_papyrus', '_stateUpdateBroadcaster', '_documentValidateService', '_canvasScrollingService'];
    for (const t of targets) {
      const svc = ed[t];
      if (!svc) continue;
      r[t] = {};
      // 공개 메서드 찾기
      let proto = svc;
      while (proto && proto !== Object.prototype) {
        const names = Object.getOwnPropertyNames(proto).filter(n => n !== 'constructor');
        if (names.length > 0) {
          r[t][proto.constructor ? proto.constructor.name : 'proto'] = names.slice(0, 20);
        }
        proto = Object.getPrototypeOf(proto);
      }
      // 자신의 속성
      const own = Object.getOwnPropertyNames(svc).slice(0, 20);
      if (own.length > 0) r[t].own = own;
    }
    return r;
  });
  console.log('API:', JSON.stringify(apiInfo, null, 2));
  
  await b.close();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });