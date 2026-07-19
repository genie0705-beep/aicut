const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  const logNo = '224349792018';
  console.log('=== 발행된 글 SEO 수정 ===\n');

  // 수정 모드로 열기
  await page.goto(`https://blog.naver.com/PostEditor.naver?blogId=aicut&logNo=${logNo}&redirect=Modify`, {
    waitUntil: 'domcontentloaded', timeout: 15000
  });
  await page.waitForTimeout(5000);

  let currentUrl = page.url();
  console.log(`1. 수정 페이지: ${currentUrl.substring(0, 80)}`);

  // 로그인 필요 시
  if (currentUrl.includes('nid.naver.com') || currentUrl.includes('login')) {
    // PostList에서 수정 버튼 찾기
    console.log('   PostEditor 접근 불가, PostList에서 시도...');
    await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', {
      waitUntil: 'domcontentloaded', timeout: 15000
    });
    await page.waitForTimeout(3000);
    
    // 수정 버튼 찾기
    const modifyLinks = await page.evaluate((no) => {
      const links = document.querySelectorAll('a');
      const result = [];
      links.forEach(a => {
        if (a.href && a.href.includes(no) && (a.href.includes('Modify') || a.href.includes('modify'))) {
          result.push(a.href);
        }
      });
      return result;
    }, logNo);

    if (modifyLinks.length > 0) {
      console.log(`   수정 링크: ${modifyLinks[0].substring(0, 80)}`);
      await page.goto(modifyLinks[0], { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(5000);
    } else {
      console.log('   수정 링크 못 찾음, 글 상세에서 시도');
      await page.goto(`https://blog.naver.com/aicut/${logNo}`, {
        waitUntil: 'domcontentloaded', timeout: 15000
      });
      await page.waitForTimeout(3000);
      // 모바일 페이지면 PC 버전으로
      await page.goto(`https://blog.naver.com/PostView.naver?blogId=aicut&logNo=${logNo}`, {
        waitUntil: 'domcontentloaded', timeout: 15000
      });
      await page.waitForTimeout(3000);
      currentUrl = page.url();
      console.log(`   현재 URL: ${currentUrl.substring(0, 80)}`);
    }
  }

  // SmartEditor 찾기
  let ef = null;
  for (const f of page.frames()) {
    try {
      if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) { ef = f; break; }
    } catch(e) {}
  }

  if (!ef) {
    console.log('❌ SmartEditor 없음 — 다른 방식 시도');
    console.log('   현재 페이지 내용 확인:');
    const text = await page.evaluate(() => document.body.innerText.substring(0, 300));
    console.log(`   ${text.substring(0, 150)}`);
    return;
  }

  console.log('✅ SmartEditor 발견\n');

  // 현재 데이터 확인
  const before = await ef.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const blocks = data?.document?.blocks || [];
    let h2=0, h3=0, img=0, p=0;
    blocks.forEach(b => {
      if (b.type === 'heading2') h2++;
      else if (b.type === 'heading3') h3++;
      else if (b.type === 'image') img++;
      else if (b.type === 'paragraph') p++;
    });
    return { title: ed.getTitle(), h2, h3, p, img, total: blocks.length };
  });
  console.log(`수정 전: ${JSON.stringify(before)}`);

  // SE4 에디터 본문 수정
  console.log('\n2. SEO 보강 중...');
  
  const result = await ef.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const blocks = data?.document?.blocks || [];
    let h2c=0, h3c=0, altSet=0, strongAdded=0;

    blocks.forEach((b, idx) => {
      if (!b || !b.text) return;
      const t = b.text.trim();

      // H2 변환 (코스 제목)
      if (t.match(/^(첫째|둘째|셋째|넷째|다섯째)/)) {
        if (b.type !== 'heading2') { blocks[idx].type = 'heading2'; h2c++; }
      }
      // H3 변환 (장소명)
      else if (t.match(/^(서울숲|코엑스|북서울|양재천|잠실)/) && !t.includes('주소')) {
        if (b.type !== 'heading3') { blocks[idx].type = 'heading3'; h3c++; }
      }
      // 영상 섹션 → H2
      else if (t.includes('영상으로 기록')) {
        if (b.type !== 'heading2') { blocks[idx].type = 'heading2'; h2c++; }
      }
    });

    // 이미지 alt 태그 추가
    blocks.forEach((b, idx) => {
      if (b.type === 'image') {
        const fname = b.fileName || '';
        let altText = '';
        if (fname.includes('main') || fname.includes('대표')) altText = '7월 주말 날씨별 서울 나들이 대표 이미지';
        else if (fname.includes('card1')) altText = '맑은 날 서울숲 성수동 나들이 코스';
        else if (fname.includes('card2')) altText = '비 오는 날 코엑스 별마당도서관';
        else if (fname.includes('card3')) altText = '날씨 무관 잠실 올인원 코스';
        else if (fname.includes('cta')) altText = '주말 나들이 영상 기록 문의';
        else if (fname.includes('map_1') || fname.includes('place_1')) altText = '서울숲 위치 지도';
        else if (fname.includes('map_2') || fname.includes('place_2')) altText = '코엑스 위치 지도';
        else if (fname.includes('map_3') || fname.includes('place_3')) altText = '북서울꿈의숲 위치 지도';
        else if (fname.includes('map_4') || fname.includes('place_4')) altText = '양재꽃시장 위치 지도';
        else if (fname.includes('map_5') || fname.includes('place_5')) altText = '석촌호수 위치 지도';
        else altText = '서울 주말 나들이 추천 장소';
        
        if (altText) {
          blocks[idx].alt = altText;
          altSet++;
        }
      }
    });

    data.document.blocks = blocks;
    ed.setDocumentData(data);
    
    // Canvas 업데이트 (H태그 반영)
    const canvas = document.querySelector('.se-canvas');
    if (canvas) {
      canvas.innerHTML = blocks.map(b => {
        if (b.type === 'image' && b.imageUrl) {
          return `<figure style="text-align:center"><img src="${b.imageUrl}" alt="${b.alt || ''}" /></figure>`;
        }
        const tag = b.type === 'heading2' ? 'h2' : b.type === 'heading3' ? 'h3' : 'p';
        return `<${tag} style="text-align:center">${b.text}</${tag}>`;
      }).join('');
    }

    return { h2: h2c, h3: h3c, alt: altSet, total: blocks.length };
  });

  console.log(`   H2 변환: ${result.h2}개, H3 변환: ${result.h3}개`);
  console.log(`   이미지 alt 설정: ${result.alt}개`);

  // 저장
  console.log('\n3. 저장...');
  await ef.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '저장') { btn.click(); break; }
    }
  });
  await page.waitForTimeout(5000);

  console.log('\n✅ SEO 보강 완료!');
  console.log('브라우저 확인해주세요.');
})();
