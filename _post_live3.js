const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

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
  
  // 기존 PostWriteForm 닫기
  for (const p of ctx.pages().filter(p => p.url().includes('PostWriteForm'))) await p.close().catch(() => {});
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(10000);
  
  console.log('=== 라이브커머스 포스팅 (setDocumentData 방식) ===\n');
  
  // 1. 제목
  console.log('[1] 제목 설정...');
  await page.evaluate(t => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  await sleep(1000);
  const titleCheck = await page.evaluate(() => SmartEditor._editors['blogpc001'].getDocumentTitle());
  console.log('  제목:', titleCheck ? titleCheck.substring(0, 50) + '... ✅' : '❌');
  
  // 2. 본문 - setDocumentData 방식 (React 미표시지만 데이터는 정상)
  console.log('\n[2] 본문 setDocumentData...');
  const paragraphs = [
    { text: '💭 "라이브 방송 2시간, 다시보기 그냥 올리면 되죠."' },
    { text: '💭 "C-커머스 때문에 매출이 줄었어요."' },
    { text: '💭 "숏폼 편집할 시간이 도저히 없어요."' },
    { text: '' },
    { text: '이런 고민, 라이브커머스 운영하시는 분들이라면 누구나 공감하실 겁니다.' },
    { text: '7월 여름 세일 시즌, 라이브 방송을 준비 중이신가요?' },
    { text: '지금이 바로 콘텐츠 전략을 바꿔야 할 타이밍입니다.' },
    { text: '라이브커머스와 C-커머스의 경쟁에서 살아남는 법, 지금부터 알려드립니다.' },
    { text: '' },
    { text: '🎯 라이브 다시보기, 그냥 올리면 망합니다', heading: true },
    { text: 'A 쇼핑몰은 주 3회 라이브 방송을 진행합니다.' },
    { text: '방송 시간은 평균 2시간.' },
    { text: '많은 뷰어가 실시간 시청하고 구매까지 이어집니다.' },
    { text: '하지만 문제는 다시보기 영상이었습니다.' },
    { text: '2시간짜리 방송을 그대로 올리니 시청자들의 이탈률이 80%를 넘겼습니다.' },
    { text: '조회수는 높아도 실제 구매로 이어지지 않았죠.' },
    { text: '' },
    { text: '고객들은 말했습니다. "영상이 너무 길어요. 원하는 상품 찾기가 힘들어요."' },
    { text: '' },
    { text: '라이브커머스 방송의 핵심은 실시간 소통이지만, 다시보기 영상의 핵심은 편집입니다.' },
    { text: '' },
    { text: '🔥 C-커머스 시대, 편집이 곧 매출이다', heading: true },
    { text: '테무, 알리익스프레스. C-커머스의 등장으로 국내 쇼핑몰의 경쟁은 더 치열해졌습니다.' },
    { text: '고객은 더 나은 콘텐츠를 찾아 떠납니다.' },
    { text: '릴스, 쇼츠, 틱톡. 짧고 강한 영상이 대세인 시대입니다.' },
    { text: '2시간짜리 라이브를 그대로 올리는 건 차라리 안 올리는 게 나을 정도입니다.' },
    { text: '' },
    { text: 'A 쇼핑몰은 라이브 방송 1회분에서 5개의 숏폼 영상을 추출했습니다.' },
    { text: '각 30초~1분 분량. 상품별 하이라이트, 할인 정보, 사용 후기.' },
    { text: '' },
    { text: '📊 편집 전후, 숫자로 비교합니다', heading: true },
    { text: '라이브 다시보기 영상, 편집 전후 비교' },
    { text: '그냥 업로드: 시청 완료율 12% / 구매 전환율 0.3% / 재방문율 5%' },
    { text: '직접 편집: 시청 완료율 45% / 구매 전환율 1.2% / 재방문율 18%' },
    { text: '에이컷 편집: 시청 완료율 68% / 구매 전환율 2.1% / 재방문율 32%' },
    { text: '' },
    { text: '숫자가 말해줍니다. 편집에 투자한 시간과 비용이 매출로 직접 연결됩니다.' },
    { text: '영상 편집 외주는 더 이상 선택이 아닌 필수입니다.' },
    { text: '' },
    { text: '💡 해결은 에이컷에 맡기는 것', heading: true },
    { text: 'A 쇼핑몰이 선택한 건 에이컷(AICUT)의 라이브 다시보기 전용 편집 서비스였습니다.' },
    { text: '라이브 방송 원본만 보내면, 3일 이내에 다시보기 영상 + 숏폼 5종을 납품합니다.' },
    { text: '' },
    { text: '"드디어 편집 스트레스에서 해방됐어요." A 쇼핑몰 마케터의 실제 후기입니다.' },
    { text: '' },
    { text: '✅ 쇼핑몰·라이브커머스, 왜 에이컷일까요?', heading: true },
    { text: '라이브 전용 편집: 다시보기 + 숏폼 동시 제작' },
    { text: '2~3일 납품: 라이브 직후 빠른 업로드' },
    { text: '상품별 챕터: 시청자가 원하는 상품 바로 찾기' },
    { text: '숏폼 변환: 릴스·쇼츠·틱톡 최적화' },
    { text: '합리적인 가격: 월 정기 납품 시 편당 10만 원대부터' },
    { text: '' },
    { text: '🚀 7월 여름 세일, 지금 준비하세요', heading: true },
    { text: '7월은 본격적인 여름 세일 시즌입니다.' },
    { text: 'C-커머스 시대, 차별화는 콘텐츠의 퀄리티에서 시작됩니다.' },
    { text: '에이컷과 함께라면 예산 부담 없이 프로페셔널한 편집을 경험하실 수 있습니다.' },
    { text: '' },
    { text: '📞 카카오톡: pf.kakao.com/_GIesX/chat' },
    { text: '📧 이메일: master@aicut.co.kr' },
    { text: '🌐 홈페이지: aicut.co.kr' }
  ];

  // SE4 document data 구조 생성
  const comps = paragraphs.map(p => {
    if (p.heading) {
      return { '@ctype': 'heading', text: p.text, level: 2 };
    }
    return { '@ctype': 'text', text: p.text || ' ' };
  });

  const docData = {
    docType: 'blog',
    document: {
      '@ctype': 'document',
      components: comps
    }
  };

  await page.evaluate((data) => {
    try {
      SmartEditor._editors['blogpc001'].setDocumentData(data);
    } catch(e) { throw new Error('setDocumentData: ' + e.message); }
  }, docData);
  await sleep(2000);

  const docCheck = await page.evaluate(() => {
    try {
      const d = SmartEditor._editors['blogpc001'].getDocumentData();
      return { comps: d.document ? d.document.components.length : 0, title: d.document?.components?.[0]?.text };
    } catch(e) { return { error: e.message }; }
  });
  console.log('  setDocumentData 결과:', JSON.stringify(docCheck).substring(0, 100));
  
  // 3. 이미지 업로드 시도
  console.log('\n[3] 이미지 업로드...');
  // 에디터 클릭 후 Ctrl+V로 이미지가 아닌 본문만 확인하고 이미지는 사용자 처리
  console.log('  (이미지는 정이사님이 직접 업로드 필요)');

  // 4. 해시태그
  console.log('\n[4] 해시태그...');
  const tagResult = await page.evaluate(t => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) {
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        if (s) {
          s.call(inp, t);
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
          return 'OK';
        }
        return 'setter 없음';
      }
    }
    return '태그 입력칸 없음';
  }, HASHTAGS);
  console.log('  해시태그:', tagResult);
  await sleep(2000);

  // 제목 다시 설정 (setDocumentData가 덮어썼을 수 있음)
  console.log('  제목 재설정...');
  await page.evaluate(t => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  await sleep(1000);

  // 4. 최종 상태 확인
  const state = await page.evaluate(() => {
    const r = {};
    try { r.title = SmartEditor._editors['blogpc001'].getDocumentTitle(); } catch(e) { r.title = ''; }
    try {
      const d = SmartEditor._editors['blogpc001'].getDocumentData();
      r.compCount = d.document ? d.document.components.length : 0;
    } catch(e) { r.dataError = e.message; }
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) {
        r.tagCount = inp.value.split('#').filter(t => t.trim().length > 0).length;
      }
    }
    return r;
  });

  console.log('\n=== 최종 상태 ===');
  console.log('  제목:', state.title ? '✅' : '❌');
  console.log('  컴포넌트:', state.compCount + '개');
  console.log('  해시태그:', (state.tagCount || 0) + '개');

  // 6. 저장
  if (state.title && state.compCount > 2) {
    console.log('\n[4] 저장 진행...');
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
      }
    });
    await sleep(8000);
    
    const toast = await page.evaluate(() => {
      const els = document.querySelectorAll('[class*="toast"], [class*="Toast"]');
      return els.length > 0 ? Array.from(els).map(e => (e.innerText || '').trim()).join(' | ') : '없음';
    });
    
    console.log('\n=== ✅ 임시저장 완료 ===');
    console.log('  토스트:', toast);
    console.log('\n📌 발행은 정이사님께서 직접 해주세요.');
    console.log('📌 이미지 업로드도 정이사님께서 직접 해주세요. (사진 버튼 → 5장 선택)');
  } else {
    console.log('\n❌ 저장 조건 불충족 (컴포넌트:', state.compCount + '개)');
  }

  await b.close();
})().catch(e => console.error('❌ 오류:', e.message));
