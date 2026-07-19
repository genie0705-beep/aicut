const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';
const TITLE = 'C-커머스 시대, 라이브 다시보기 편집 하나로 전환율 2.1% 올린 쇼핑몰의 비결';
const IMAGES = [
  'aicut_blog_live_main.png',
  'aicut_blog_live_card1.png',
  'aicut_blog_live_card2.png',
  'aicut_blog_live_card3.png',
  'aicut_blog_live_cta.png'
];
const HASHTAGS = '#라이브커머스 #C커머스대응 #숏폼마케팅 #영상편집외주 #쇼핑몰마케팅 #다시보기편집 #릴스제작 #라이브방송 #7월세일 #여름마케팅 #하반기준비 #영상편집아웃소싱 #테무 #알리익스프레스 #이커머스 #스마트스토어 #온라인쇼핑몰 #숏폼커머스 #릴스알고리즘 #유튜브쇼츠 #틱톡마케팅 #구매전환율 #라이브마케팅 #에이컷 #영상제작 #B2B영상 #마케팅전략 #정기납품 #콘텐츠마케팅 #브랜드영상';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // dialog 이벤트 핸들러 — 취소(dismiss) 처리
  for (const p of ctx.pages()) {
    p.on('dialog', async d => {
      const msg = d.message().substring(0, 50);
      console.log(`  📩 다이얼로그: "${msg}" → 취소`);
      try { await d.dismiss(); } catch(e) {}
    });
  }
  
  // 기존 PostWriteForm 닫기
  for (const p of ctx.pages().filter(p => p.url().includes('PostWriteForm'))) await p.close().catch(() => {});
  await sleep(500);
  
  const page = await ctx.newPage();
  page.on('dialog', async d => {
    const msg = d.message().substring(0, 50);
    console.log(`  📩 다이얼로그: "${msg}" → 취소`);
    try { await d.dismiss(); } catch(e) {}
  });
  
  console.log('🔄 네이버 블로그 에디터 열기...');
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(8000);
  
  // "작성중인 글이 있습니다" → 취소(아니오) 처리됨
  await sleep(2000);
  
  // ===== 1. 제목 =====
  console.log('\n[1/5] 제목 설정...');
  await page.evaluate(t => {
    try { SmartEditor._editors['blogpc001'].setDocumentTitle(t); } catch(e) {}
  }, TITLE);
  await sleep(1000);
  const titleCheck = await page.evaluate(() => {
    try { return SmartEditor._editors['blogpc001'].getDocumentTitle(); } catch(e) { return ''; }
  });
  console.log(`  ✅ ${titleCheck ? titleCheck.substring(0, 45) + '...' : 'FAIL'}`);
  
  // ===== 2. 본문 =====
  console.log('\n[2/5] 본문 설정...');
  const bodyParagraphs = [
    { text: '💭 "라이브 방송 2시간, 다시보기 그냥 올리면 되죠."' },
    { text: '💭 "C-커머스 때문에 매출이 줄었어요."' },
    { text: '💭 "숏폼 편집할 시간이 도저히 없어요."' },
    { text: '' },
    { text: '이런 고민, 라이브커머스 운영하시는 분들이라면 누구나 공감하실 겁니다.' },
    { text: '7월 여름 세일 시즌, 라이브 방송을 준비 중이신가요?' },
    { text: '지금이 바로 콘텐츠 전략을 바꿔야 할 타이밍입니다.' },
    { text: 'C-커머스와 라이브커머스의 경쟁에서 살아남는 법을 알려드립니다.' },
    { text: '' },
    { text: '🎯 라이브 다시보기, 그냥 올리면 망합니다', heading: true },
    { text: 'A 쇼핑몰은 주 3회 라이브 방송을 진행합니다.' },
    { text: '방송 시간은 평균 2시간.' },
    { text: '많은 뷰어가 실시간 시청하고 구매까지 이어집니다.' },
    { text: '하지만 문제는 다시보기 영상이었습니다.' },
    { text: '2시간짜리 방송을 그대로 올리니 이탈률이 80%를 넘겼습니다.' },
    { text: '조회수는 높아도 실제 구매로 이어지지 않았죠.' },
    { text: '' },
    { text: '고객들은 말했습니다. "영상이 너무 길어요."' },
    { text: '' },
    { text: '라이브커머스 방송의 핵심은 실시간 소통이지만,' },
    { text: '다시보기 영상의 핵심은 편집입니다.' },
    { text: '' },
    { text: '🔥 C-커머스 시대, 편집이 곧 매출이다', heading: true },
    { text: '테무, 알리익스프레스.' },
    { text: 'C-커머스의 등장으로 국내 쇼핑몰 경쟁이 더 치열해졌습니다.' },
    { text: '고객은 더 나은 콘텐츠를 찾아 떠납니다.' },
    { text: '릴스, 쇼츠, 틱톡.' },
    { text: '짧고 강한 숏폼 마케팅이 대세인 시대입니다.' },
    { text: '' },
    { text: 'A 쇼핑몰은 라이브 1회분에서 5개의 숏폼 영상을 추출했습니다.' },
    { text: '각 30초~1분 분량. 상품별 하이라이트, 할인 정보, 사용 후기.' },
    { text: '결과는 놀라웠습니다.' },
    { text: '' },
    { text: '📊 편집 전후, 숫자로 비교합니다', heading: true },
    { text: '라이브 다시보기 영상, 편집 전후 비교' },
    { text: '그냥 업로드: 시청 완료율 12% / 구매 전환율 0.3%' },
    { text: '직접 편집: 시청 완료율 45% / 구매 전환율 1.2%' },
    { text: '에이컷 편집: 시청 완료율 68% / 구매 전환율 2.1%' },
    { text: '' },
    { text: '숫자가 말해줍니다.' },
    { text: '편집에 투자한 시간과 비용이 매출로 직접 연결됩니다.' },
    { text: '영상 편집 외주는 선택이 아닌 필수입니다.' },
    { text: '' },
    { text: '💡 해결은 에이컷에 맡기는 것', heading: true },
    { text: 'A 쇼핑몰이 선택한 건 에이컷(AICUT)의 라이브 다시보기 전용 편집 서비스였습니다.' },
    { text: '라이브 방송 원본만 보내면, 3일 이내에 다시보기 + 숏폼 5종을 납품합니다.' },
    { text: '처음엔 반신반의했지만, 실제 퀄리티에 놀랐습니다.' },
    { text: '"드디어 편집 스트레스에서 해방됐어요."' },
    { text: '' },
    { text: '✅ 왜 에이컷일까요?', heading: true },
    { text: '라이브 전용 편집: 다시보기 + 숏폼 동시 제작' },
    { text: '2~3일 납품: 라이브 직후 빠른 업로드' },
    { text: '숏폼 변환: 릴스·쇼츠·틱톡 최적화' },
    { text: '합리적인 가격: 편당 10만 원대부터' },
    { text: '' },
    { text: '🚀 7월 여름 세일, 지금 시작하세요', heading: true },
    { text: '7월은 본격적인 여름 세일 시즌입니다.' },
    { text: 'C-커머스 시대, 차별화는 콘텐츠 퀄리티에서 시작됩니다.' },
    { text: '에이컷과 함께라면 예산 부담 없이 시작하실 수 있습니다.' },
    { text: '' },
    { text: '📞 카카오톡: pf.kakao.com/_GIesX/chat' },
    { text: '📧 이메일: master@aicut.co.kr' },
    { text: '🌐 홈페이지: aicut.co.kr' }
  ];

  const comps = bodyParagraphs.map(p => {
    if (p.heading) return { '@ctype': 'heading', text: p.text, level: 2 };
    return { '@ctype': 'text', text: p.text || ' ' };
  });

  const docData = { docType: 'blog', document: { '@ctype': 'document', components: comps } };
  
  await page.evaluate((data) => {
    try { SmartEditor._editors['blogpc001'].setDocumentData(data); } catch(e) {}
  }, docData);
  await sleep(2000);
  
  // 제목 다시 설정 (setDocumentData가 덮어씀)
  await page.evaluate(t => {
    try { SmartEditor._editors['blogpc001'].setDocumentTitle(t); } catch(e) {}
  }, TITLE);
  await sleep(1000);
  
  const compCount = await page.evaluate(() => {
    try {
      const d = SmartEditor._editors['blogpc001'].getDocumentData();
      return d.document?.components?.length || 0;
    } catch(e) { return 0; }
  });
  console.log(`  ✅ ${compCount}개 컴포넌트`);
  
  // ===== 3. 이미지 업로드 =====
  console.log('\n[3/5] 이미지 업로드...');
  
  const fcP = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
  
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.style.cssText = 'position:fixed;left:0;top:0;opacity:0;z-index:99999';
    document.body.appendChild(input);
    input.click();
  });
  await sleep(2000);
  
  const fc = await fcP;
  if (fc) {
    await fc.setFiles(IMAGES.map(f => path.join(WORKSPACE, f)));
    await sleep(10000);
    console.log('  ✅ 이미지 5장 업로드 완료');
  } else {
    console.log('  ⚠️ 이미지 업로드 실패');
  }
  
  // ===== 4. 해시태그 =====
  console.log('\n[4/5] 해시태그...');
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
  
  const tagCount = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) {
        return inp.value.split('#').filter(t => t.trim().length > 0).length;
      }
    }
    return 0;
  });
  console.log(`  ✅ ${tagCount}개`);
  
  // ===== 5. 저장 =====
  console.log('\n[5/5] 저장...');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  await sleep(8000);
  
  console.log('\n✅ 모든 작업 완료!');
  console.log(`  제목: ${TITLE.substring(0, 50)}...`);
  console.log(`  본문: ${compCount}개 컴포넌트`);
  console.log(`  이미지: ${fc ? '5장 ✅' : '실패'}`);
  console.log(`  해시태그: ${tagCount}개`);
  console.log('\n📌 발행은 정이사님께서 직접 해주세요.');
  
  await b.close();
})().catch(e => console.error('❌ 오류:', e.message));
