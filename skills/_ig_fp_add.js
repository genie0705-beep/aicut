// 보험사 IG — 이미지 추가 (1장→5장)
const { chromium } = require('playwright');
const path = require('path');

const W = 'C:\\Users\\paul\\.openclaw\\workspace';
const ADD_FILES = [
  path.join(W, 'aicut_blog_fp_card1.png'),
  path.join(W, 'aicut_blog_fp_card2.png'),
  path.join(W, 'aicut_blog_fp_card3.png'),
  path.join(W, 'aicut_blog_fp_cta.png'),
];

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // create/details 탭 찾기
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('/create/') && !p.url().includes('/location/')) {
      page = p;
      break;
    }
  }
  if (!page) { console.log('create 탭 없음'); await b.disconnect(); return; }
  
  console.log('현재:', page.url());
  const screenText = await page.evaluate(() => (document.body.innerText || '').slice(0, 200));
  console.log('화면:', screenText);
  
  // 이미지 추가 버튼 찾기 — create/details 화면에서 이미지 영역 우측에 "+" 버튼 또는 이미지 썸네일
  console.log('\n1️⃣ 이미지 추가 버튼 찾기...');
  
  // 방법 1: 이미지 썸네일 영역에서 "+" 버튼 찾기
  const addResult = await page.evaluate(() => {
    // 하단 이미지 썸네일 목록에서 + 버튼 찾기
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      // svg 아이콘 + 플러스 모양
      const svg = b.querySelector('svg');
      if (svg) {
        const label = svg.getAttribute('aria-label') || '';
        if (label.includes('추가') || label.includes('Add') || label.includes('plus') || label.includes('Plus')) {
          b.click();
          return '플러스 SVG 버튼 클릭';
        }
      }
    }
    
    // "추가" 텍스트 포함 버튼
    for (const b of btns) {
      if (b.innerText.includes('추가') || b.innerText.includes('Add')) {
        b.click();
        return '추가 버튼 클릭';
      }
    }
    
    // 이미지 더블클릭 or 클릭 영역
    const imgs = document.querySelectorAll('img');
    for (const img of imgs) {
      const parent = img.closest('[role="button"], button') || img.parentElement;
      if (parent) {
        parent.click();
        return '이미지 영역 클릭';
      }
    }
    
    return '버튼 못 찾음';
  });
  console.log('  결과:', addResult);
  await page.waitForTimeout(2000);
  
  // file chooser 대기
  const fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
  
  // 파일 input이 나타났는지 확인
  const fileInput = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    return inputs.length > 0 ? inputs.length + '개 발견' : '없음';
  });
  console.log('  file input:', fileInput);
  
  await page.waitForTimeout(1000);
  
  const fc = await fcPromise;
  if (fc) {
    await fc.setFiles(ADD_FILES);
    console.log('  ✅ 4장 추가 업로드 완료');
  } else {
    // 직접 input 접근
    const inputs = await page.$$('input[type="file"]');
    if (inputs.length > 0) {
      await inputs[0].setInputFiles(ADD_FILES);
      console.log('  ✅ input 직접 4장 설정');
    } else {
      console.log('  ❌ 파일 업로드 실패');
    }
  }
  
  await page.waitForTimeout(5000);
  
  // 결과 확인
  const result = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img[style*="object-fit"]');
    return { imgCount: imgs.length, url: location.href };
  });
  console.log(`\n2️⃣ 결과: 이미지 ${result.imgCount}장`);
  
  await page.screenshot({ path: 'debug_ig_fp_added.png', fullPage: true });
  console.log('\n✅ 이미지 추가 완료! 브라우저 확인하시고 게시는 직접 눌러주세요 🙌');
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));
