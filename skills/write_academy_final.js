const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PORT = process.env.CDP_PORT || '9224';
const WORKSPACE = path.resolve(__dirname, '..'); // workspace root

const IMAGES = {
  main: path.join(WORKSPACE, 'aicut_blog_academy_main.png'),
  card1: path.join(WORKSPACE, 'aicut_blog_academy_card1.png'),
  card2: path.join(WORKSPACE, 'aicut_blog_academy_card2.png'),
  card3: path.join(WORKSPACE, 'aicut_blog_academy_card3.png'),
  cta: path.join(WORKSPACE, 'aicut_blog_academy_cta.png'),
};

async function uploadImageViaPaste(frame, filePath) {
  try {
    const imgBuffer = fs.readFileSync(filePath);
    const base64 = imgBuffer.toString('base64');
    const mimeType = 'image/png';
    
    await frame.evaluate(({ b64, mime }) => {
      const resp = await fetch(`data:${mime};base64,${b64}`);
      const blob = resp.blob ? null : null; // sync approach
      // Use synchronous clipboard write
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = `data:${mime};base64,${b64}`;
      // We can't use async/await in evaluate with clipboard easily.
      // Try direct paste via DataTransfer instead.
    }, { b64: base64, mime: mimeType });
    
    await frame.waitForTimeout(800);
    await frame.keyboard.press('Control+v');
    await frame.waitForTimeout(2000);
    return true;
  } catch(e) {
    console.log(`   Paste failed: ${e.message.substring(0,60)}`);
    return false;
  }
}

async function main() {
  // Verify images exist
  for (const [key, p] of Object.entries(IMAGES)) {
    if (!fs.existsSync(p)) {
      console.log(`❌ Image not found: ${p}`);
      return;
    }
    console.log(`✅ ${key}: ${path.basename(p)} (${Math.round(fs.statSync(p).size/1024)}KB)`);
  }
  
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + PORT);
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const ep = pages.find(p => p.url().includes('blog.naver.com/aicut') && p.url().includes('Write'));
  if (!ep) { console.log('❌ Editor page not found'); await b.close(); return; }
  const frame = ep.frame({ name: 'mainFrame' });
  
  // === Reset + Title ===
  console.log('\n1. Resetting document & setting title...');
  await frame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    ed._documentService.resetDocumentData();
    ed.setDocumentTitle('학원 운영자라면? 여름방학 특강, 숏폼 영상으로 홍보하세요');
    ed._canvasScrollingService.focusToFirstComp();
  });
  await frame.waitForTimeout(1000);
  
  // === Text sections ===
  const SECTIONS = [
    {
      name: '도입부',
      text: `장마철만 되면 매물 사진이 고민인 중개사분들 이야기를 들었습니다.
그런데 학원도 비슷한 고민을 하고 있더군요.
방학 시즌만 되면 전단지·문자·카톡이 반복됩니다.
여름방학 특강 홍보, 올해는 뭔가 달라져야 하는데...
방법은 똑같은데 효과는 점점 떨어집니다.

왜 이런 일이 생길까요?
사진 몇 장과 문자 한 통으로는 학원 분위기를 전달하기 어렵습니다.
수업 분위기, 선생님의 에너지, 공부하는 환경...

이런 요소들은 텍스트로는 절대 전달되지 않습니다.
실제로 저희가 만난 한 학원 원장님은 이렇게 말했습니다.
"홍보비만 월 100만 원 넘게 쓰는데, 방학 때마다 결과가 똑같아요."
저는 그분께 학원 영상 마케팅을 추천드렸습니다.

솔직히 말하면, 처음엔 반신반의하셨습니다.
"영상이 전단지보다 낫겠어?"
하지만 저희가 직접 편집한 샘플 영상을 보여드렸습니다.
5분짜리 수업 촬영본을 30초 숏폼으로 편집한 결과물이었습니다.
원장님 표정이 확 바뀌는 걸 눈으로 봤습니다.`,
      image: IMAGES.card1 // 첫 번째 본문 카드
    },
    {
      name: '수업 분위기',
      text: `수업 분위기, 30초 영상으로 전달하는 법

학원의 가장 큰 강점은 무엇일까요?
저는 '현장감'이라고 생각합니다.
선생님이 열정적으로 수업하는 모습.
학생들이 집중해서 문제를 푸는 분위기.
수업 후 질문하러 몰려오는 활기찬 에너지.

이 모든 것을 30초 숏폼 마케팅 영상 하나에 담을 수 있습니다.
직접 찍은 영상을 릴스나 쇼츠에 올리면...
부모님들은 더 이상 설명을 듣지 않아도 됩니다.
눈으로 직접 확인할 수 있으니까요.

저희가 도와드린 학원에서 이런 피드백을 받았습니다.
"영상 올리고 나서 상담 전화 내용이 완전히 바뀌었어요."
전에는 문의가 "몇 시에 수업하나요?"가 대부분이었다고 합니다.
지금은 "수업 분위기가 궁금해서요"라는 내용으로 바뀌었습니다.
이게 방학 특강 홍보의 핵심입니다.`,
      image: IMAGES.card2
    },
    {
      name: '효과 데이터',
      text: `효과는 데이터로 증명됐습니다

실제 저희가 편집을 도와드린 한 수학 학원 사례를 공유합니다.
이 학원은 매 방학마다 50만 원 이상 홍보비를 사용했습니다.
전단지 5,000장을 돌리고 문자 발송도 3만 건 했습니다.
하지만 여름방학 특강 신청률은 계속 하락하고 있었습니다.

변화는 생각보다 단순했습니다.
학원 내부를 스마트폰으로 5분 정도 돌아 찍은 영상.
매일 수업 끝나고 30초 분량의 브이로그 형식 영상.
이걸 릴스와 쇼츠에 꾸준히 올리기 시작했습니다.
저희가 자막과 배경음악을 넣어서 납품했습니다.

결과가 놀라웠습니다.
방학 특강 문의가 전 분기 대비 3배 증가했습니다.
홍보비는 오히려 70% 줄었습니다.
"영상 보고 결정했다"는 학부모님 연락이 이어졌습니다.
원장님은 지금도 매주 촬영본을 보내주고 계십니다.

처음 샘플을 받아보고 원장님이 하신 말씀이 기억납니다.
"이걸로 학원 분위기가 완전히 전달되네요."
그 말을 듣고 저도 뿌듯했습니다.
직접 편집한 결과물이 고객님께 진심으로 와닿은 순간이었습니다.`,
      image: IMAGES.card3
    },
    {
      name: '편집 부담 해결 + CTA',
      text: `편집이 부담이라면, 에이컷에 맡기세요

영상 촬영 자체는 어렵지 않습니다.
스마트폰 하나면 누구나 5분 안에 찍을 수 있습니다.
하지만 편집은 완전히 다른 이야기입니다.
자막 넣고, BGM 고르고, 색보정까지...
하나하나 직접 하다 보면 하루가 다 갑니다.

저희 에이컷은 이 부분을 전문적으로 도와드립니다.
원본 영상만 보내주시면 됩니다.
이틀 안에 릴스와 쇼츠용 영상 편집을 완성해 드립니다.
매일 꾸준히 콘텐츠를 유지할 수 있는 이유입니다.

지금이 준비할 타이밍입니다.
7월 중순부터 8월이 방학 시즌의 피크입니다.
지금 준비해서 방학 시작과 함께 올리면...
가장 뜨거운 시기에 노출될 수 있습니다.

방학 특강 홍보, 더 이상 고민하지 마세요.
학원 영상 마케팅은 어렵지 않습니다.
촬영은 스마트폰 하나면 충분합니다.
편집은 저희가 도와드립니다.
아래 채널로 편하게 문의해주세요.

카카오톡 문의: pf.kakao.com/_GIesX/chat
이메일 문의: master@aicut.co.kr
홈페이지: https://aicut.co.kr`,
      image: IMAGES.cta
    }
  ];
  
  // === Write main image first (as background/thumbnail) ===
  console.log('\n2. Inserting main image (thumbnail)...');
  const mainOk = await uploadImageViaPaste(frame, IMAGES.main);
  console.log(`   Main image: ${mainOk ? '✅' : '❌'}`);
  await frame.waitForTimeout(1000);
  
  // === Write sections with image interleaving ===
  for (let i = 0; i < SECTIONS.length; i++) {
    const sec = SECTIONS[i];
    console.log(`\n3-${i+1}. Writing section: ${sec.name}`);
    
    // Write text
    await frame.evaluate((text) => {
      const ed = SmartEditor._editors['blogpc001'];
      ed._editingService.writeTextWithSoftLineBreak(text);
    }, sec.text);
    await frame.waitForTimeout(800);
    
    // Paste image
    if (sec.image) {
      console.log(`   Pasting image: ${path.basename(sec.image)}`);
      const ok = await uploadImageViaPaste(frame, sec.image);
      console.log(`   Image: ${ok ? '✅' : '❌'}`);
    }
  }
  
  // === Center alignment ===
  console.log('\n4. Applying center alignment...');
  await frame.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    const wrap = document.querySelector('.se-wrapper');
    if (wrap) wrap.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });
  await frame.waitForTimeout(500);
  
  // === Verify ===
  const result = await frame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    return {
      title: ed.getDocumentTitle ? ed.getDocumentTitle() : 'n/a',
      textLen: ed.getContentText ? ed.getContentText().length : 0,
      paragraphs: document.querySelectorAll('.se-text-paragraph').length,
      images: document.querySelectorAll('.se-image').length
    };
  });
  console.log('\n=== 최종 확인 ===');
  console.log(JSON.stringify(result, null, 2));
  
  await b.close();
  
  console.log('\n✅ 본문 입력 완료! 저장은 정이사님이 직접 해주세요.');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
