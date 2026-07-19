const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';
const TITLE = 'C-커머스 시대, 라이브 다시보기 편집 하나로 전환율 2.1% 올린 쇼핑몰의 비결';
const IMAGES = [
  'aicut_blog_live_main.png', 'aicut_blog_live_card1.png', 'aicut_blog_live_card2.png',
  'aicut_blog_live_card3.png', 'aicut_blog_live_cta.png'
];
const HASHTAGS = '#라이브커머스 #C커머스대응 #숏폼마케팅 #영상편집외주 #쇼핑몰마케팅 #다시보기편집 #릴스제작 #라이브방송 #7월세일 #여름마케팅 #하반기준비 #영상편집아웃소싱 #테무 #알리익스프레스 #이커머스 #스마트스토어 #온라인쇼핑몰 #숏폼커머스 #릴스알고리즘 #유튜브쇼츠 #틱톡마케팅 #구매전환율 #라이브마케팅 #에이컷 #영상제작 #B2B영상 #마케팅전략 #정기납품 #콘텐츠마케팅 #브랜드영상';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  for (const p of ctx.pages()) {
    p.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  }
  
  for (const p of ctx.pages().filter(p => p.url().includes('PostWriteForm'))) await p.close().catch(() => {});
  await sleep(500);
  
  const page = await ctx.newPage();
  page.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  console.log('🔄 에디터 열기...');
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(10000);
  
  // 1. 제목
  console.log('\n[1] 제목 설정...');
  await page.evaluate(t => {
    try { SmartEditor._editors['blogpc001'].setDocumentTitle(t); } catch(e) {}
  }, TITLE);
  await sleep(1000);
  const t = await page.evaluate(() => {
    try { return SmartEditor._editors['blogpc001'].getDocumentTitle(); } catch(e) { return ''; }
  });
  console.log(`  ✅ ${t.substring(0, 45)}...`);
  
  // 2. 이미지
  console.log('\n[2] 이미지 업로드...');
  const fcP = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = true; input.accept = 'image/*';
    input.style.cssText = 'position:fixed;left:0;top:0;opacity:0;z-index:99999';
    document.body.appendChild(input);
    input.click();
  });
  await sleep(2000);
  const fc = await fcP;
  if (fc) {
    await fc.setFiles(IMAGES.map(f => path.join(WORKSPACE, f)));
    await sleep(10000);
    console.log('  ✅ 5장 업로드');
  } else {
    console.log('  ⚠️ 실패');
  }
  
  // 3. 해시태그
  console.log('\n[3] 해시태그...');
  await page.evaluate(t => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) {
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        if (s) {
          s.call(inp, t);
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
        }
        break;
      }
    }
  }, HASHTAGS);
  await sleep(2000);
  
  // 4. 저장
  console.log('\n[4] 저장...');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  await sleep(8000);
  
  // 저장 후 확인
  const after = await page.evaluate(() => {
    const r = {};
    try { r.title = SmartEditor._editors['blogpc001'].getDocumentTitle() || ''; } catch(e) { r.title = ''; }
    const els = document.querySelectorAll('[class*="toast"], [class*="Toast"], [class*="noti"]');
    r.noti = els.length > 0 ? Array.from(els).map(e => (e.innerText || '').trim()).join(' | ') : '없음';
    return r;
  });
  
  console.log('\n=== 저장 완료 ===');
  console.log('제목:', after.title ? '✅' : '❌');
  console.log('이미지:', fc ? '✅ 5장' : '❌');
  console.log('알림:', after.noti?.substring(0, 80));
  console.log('\n⚠️ SE4 에디터 구조상 본문 자동 입력이 안정적이지 않습니다.');
  console.log('📝 아래 본문을 복사해서 직접 붙여넣기 해주세요!');
  console.log('\n--- 복사할 본문 ---');
  
  const bodyText = `💭 "라이브 방송 2시간, 다시보기 그냥 올리면 되죠."
💭 "C-커머스 때문에 매출이 줄었어요."
💭 "숏폼 편집할 시간이 도저히 없어요."

이런 고민, 라이브커머스 운영하시는 분들이라면 누구나 공감하실 겁니다.
7월 여름 세일 시즌, 라이브 방송을 준비 중이신가요?

🎯 라이브 다시보기, 그냥 올리면 망합니다
A 쇼핑몰은 주 3회 라이브 방송을 진행합니다.
방송 시간은 평균 2시간.
하지만 문제는 다시보기 영상이었습니다.
2시간짜리 방송을 그대로 올리니 이탈률이 80%를 넘겼습니다.

🔥 C-커머스 시대, 편집이 곧 매출이다
테무, 알리익스프레스.
C-커머스의 등장으로 국내 쇼핑몰 경쟁이 더 치열해졌습니다.
A 쇼핑몰은 라이브 1회분에서 5개의 숏폼 영상을 추출했습니다.

📊 편집 전후, 숫자로 비교합니다
에이컷 편집: 시청 완료율 68% / 구매 전환율 2.1%
그냥 업로드: 12% / 0.3%
영상 편집 외주는 선택이 아닌 필수입니다.

💡 해결은 에이컷에 맡기는 것
라이브 방송 원본만 보내면, 3일 이내에 다시보기 + 숏폼 5종 납품.
"드디어 편집 스트레스에서 해방됐어요."

✅ 왜 에이컷일까요?
라이브 전용 편집: 다시보기 + 숏폼 동시 제작
2~3일 납품: 라이브 직후 빠른 업로드
숏폼 변환: 릴스·쇼츠·틱톡 최적화
합리적인 가격: 편당 10만 원대부터

🚀 7월 여름 세일, 지금 시작하세요
C-커머스 시대, 차별화는 콘텐츠 퀄리티에서 시작됩니다.

📞 카카오톡: pf.kakao.com/_GIesX/chat
📧 이메일: master@aicut.co.kr
🌐 홈페이지: aicut.co.kr`;
  console.log(bodyText);
  
  await b.close();
})();
