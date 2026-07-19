const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PORT = process.env.CDP_PORT || '9224';
const WORKSPACE = path.resolve(__dirname, '..');
const IMAGE = path.join(WORKSPACE, 'aicut_blog_travel_main.png');

const CAPTION = '제주도 가기 전에 알아두면 좋은 숏폼 영상 촬영 꿀팁 4가지 ✈️\n\n요즘 여행 가면 사진보다 영상 찍는 분들이 많죠?\n그런데 막상 찍고 나면 \'뭔가 아쉽다\'는 생각이 들 때가 많습니다.\n\n오늘은 여행지에서 스마트폰 하나로 따라 할 수 있는 꿀팁을 준비했어요!\n\n1구도와 앵글을 먼저 정하세요\n230초 안에 핵심만 보여주세요\n3편집이 퀄리티를 결정합니다\n\n여행 다녀와서 지친 몸으로 편집할 필요 없어요\n원본 영상만 보내주시면 자막BGM색보정까지 다 해드립니다.\n\n#여행숏폼 #제주도여행 #숏폼촬영 #릴스촬영 #촬영꿀팁 #여행릴스 #에이컷 #영상편집외주 #여행브이로그 #30초숏폼';

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + PORT);
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  const insta = pages.find(p => p.url().includes('instagram.com'));
  if (!insta) { console.log('인스타 탭 없음'); await b.close(); return; }

  // 프로필로 이동
  await insta.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await insta.waitForTimeout(2000);
  console.log('1. 프로필 로드');

  // 만들기 버튼 찾기
  const created = await insta.evaluate(() => {
    const items = document.querySelectorAll('a, button, div, span');
    for (const el of items) {
      const txt = (el.textContent || '').trim();
      if (el.offsetParent !== null && txt === '만들기') {
        el.click(); return 'clicked';
      }
    }
    // Try Create link
    for (const el of items) {
      const txt = (el.textContent || '').trim();
      const href = el.href || '';
      if (el.offsetParent !== null && (href.includes('/create') || href.includes('/creation'))) {
        el.click(); return 'clicked via href';
      }
    }
    return 'not found';
  });
  console.log('2. 만들기:', created);
  await insta.waitForTimeout(2000);

  // 게시물 선택
  const posted = await insta.evaluate(() => {
    const items = document.querySelectorAll('a, button, div, span');
    for (const el of items) {
      const txt = (el.textContent || '').trim();
      if (el.offsetParent !== null && txt === '게시물') {
        el.click(); return 'clicked';
      }
    }
    return 'not found';
  });
  console.log('3. 게시물:', posted);
  await insta.waitForTimeout(2000);

  // 파일 업로드
  console.log('4. 파일 업로드...');
  const fi = await insta.$('input[type="file"]');
  if (fi) {
    await fi.setInputFiles(IMAGE);
    console.log('   파일 선택 완료');
  } else {
    console.log('   file input 없음');
  }
  await insta.waitForTimeout(3000);

  // 다음 버튼
  for (let i = 0; i < 2; i++) {
    const next = await insta.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.offsetParent !== null && b.textContent.trim() === '다음') {
          b.click(); return 'clicked';
        }
      }
      return 'not found';
    });
    console.log('5.' + (i+1) + ' 다음:', next);
    await insta.waitForTimeout(2000);
  }

  // 캡션 입력
  console.log('6. 캡션 입력...');
  const capOk = await insta.evaluate((caption) => {
    const ta = document.querySelector('textarea');
    if (ta && ta.offsetParent !== null) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(ta, caption);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
    const div = document.querySelector('[contenteditable="true"]');
    if (div && div.offsetParent !== null) {
      div.textContent = caption;
      div.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
    return false;
  }, CAPTION);
  console.log('   캡션:', capOk ? '입력됨' : '실패');
  await insta.waitForTimeout(1000);

  // 공유 버튼 확인
  const share = await insta.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.offsetParent !== null && (b.textContent.trim() === '공유' || b.textContent.trim() === 'Share')) {
        return b.textContent.trim();
      }
    }
    return 'not found';
  });
  console.log('\n공유 버튼:', share);
  console.log('공유는 직접 눌러주세요!');

  await b.close();
}

main().catch(e => console.error('에러:', e.message));
