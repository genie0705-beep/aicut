const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  let page;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { process.exit(1); }
  
  await page.bringToFront();
  await page.waitForTimeout(1500);
  
  // === 1. 센터 정렬 ===
  console.log('=== 1. 센터 정렬 ===');
  
  // 정렬 버튼 위치 확인
  const alignInfo = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const text = (btn.innerText || '').trim();
      if (text.startsWith('정렬')) {
        const r = btn.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      }
    }
    return null;
  });
  console.log('정렬 버튼:', alignInfo);
  
  // 1-1. 전체 선택
  await page.mouse.click(700, 300);
  await page.waitForTimeout(500);
  await page.keyboard.down('Control');
  await page.keyboard.press('a');
  await page.keyboard.up('Control');
  await page.waitForTimeout(500);
  console.log('✅ Ctrl+A');
  
  // 1-2. 정렬 버튼 클릭
  if (alignInfo) {
    await page.mouse.click(alignInfo.x + alignInfo.w/2, alignInfo.y + alignInfo.h/2);
    await page.waitForTimeout(1000);
    
    // 드롭다운 분석
    const dropdown = await page.evaluate(() => {
      // Find visible dropdown elements near the align button
      const all = document.querySelectorAll('button, div[role="button"], li, [class*="se-"]');
      const result = [];
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.width > 20 && r.height > 20 && r.y > 100 && r.y < 200) {
          const text = (el.innerText || '').trim().substring(0, 20);
          if (text) result.push({ text, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), cls: (el.className || '').substring(0, 30) });
        }
      }
      return result;
    });
    
    console.log('드롭다운 요소:', JSON.stringify(dropdown));
    
    // 가운데 정렬 찾기 (아이콘 형태일 수 있음)
    const centerOption = dropdown.find(d => d.text.includes('가운데') || d.text.includes('center'));
    if (centerOption) {
      await page.mouse.click(centerOption.x + centerOption.w/2, centerOption.y + centerOption.h/2);
      console.log('✅ 가운데 정렬 선택');
    } else {
      // 세 번째 옵션이 가운데 정렬일 가능성 높음
      if (dropdown.length >= 3) {
        await page.mouse.click(dropdown[2].x + dropdown[2].w/2, dropdown[2].y + dropdown[2].h/2);
        console.log('✅ 3번째 옵션 클릭');
      } else if (dropdown.length > 0) {
        // Try clicking slightly below the align button
        await page.mouse.click(alignInfo.x + alignInfo.w/2, alignInfo.y + alignInfo.h + 35);
        await page.waitForTimeout(500);
        await page.mouse.click(alignInfo.x + alignInfo.w/2, alignInfo.y + alignInfo.h + 35);
        console.log('✅ 드롭다운 아래 클릭');
      }
    }
    await page.waitForTimeout(1000);
  }
  
  // === 2. 해시태그 ===
  console.log('\n=== 2. 해시태그 분석 ===');
  
  // 해시태그 입력창 분석
  const tagInputs = await page.evaluate(() => {
    const result = [];
    const inputs = document.querySelectorAll('input');
    inputs.forEach((inp, i) => {
      const r = inp.getBoundingClientRect();
      result.push({
        idx: i,
        placeholder: (inp.placeholder || '').substring(0, 20),
        id: inp.id,
        cls: (inp.className || '').substring(0, 30),
        value: (inp.value || '').substring(0, 20),
        visible: r.width > 0,
        x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width)
      });
    });
    return result;
  });
  
  console.log('모든 input:', JSON.stringify(tagInputs));
  
  // 태그 입력 시도
  let tagInput = null;
  for (const inp of tagInputs) {
    if ((inp.placeholder || '').includes('태그') || (inp.placeholder || '').includes('검색')) {
      tagInput = inp;
      break;
    }
  }
  
  if (tagInput) {
    console.log(`태그 입력창 발견: (${tagInput.x}, ${tagInput.y}) ${tagInput.w}px`);
    const tags = '#영상편집외주 #프리랜서편집 #영상편집대행 #에이컷 #AICUT #전담에디터 #48시간납품 #영상편집 #숏폼제작 #릴스편집 #영상제작 #콘텐츠마케팅 #영상마케팅 #SNS영상 #마케팅영상 #브랜드영상 #편집외주 #영상편집비용 #영상편집서비스 #영상편집월정액 #클린트 #수정요청 #브랜드가이드 #전담매니저 #숏폼마케팅 #유튜브편집 #쇼츠제작 #인스타릴스 #영상편집전문 #콘텐츠제작';
    
    // Click the tag input
    await page.mouse.click(tagInput.x + tagInput.w/2, tagInput.y + 10);
    await page.waitForTimeout(800);
    
    // Type tags
    await page.keyboard.type(tags, { delay: 5 });
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    
    // Check
    const tagCheck = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      for (const inp of inputs) {
        if (inp.value.includes('#')) {
          return { value: inp.value.substring(0, 100), count: inp.value.split('#').length - 1 };
        }
      }
      return { value: 'none', count: 0 };
    });
    console.log('태그 입력 결과:', JSON.stringify(tagCheck));
  } else {
    console.log('❌ 태그 입력창 찾지 못함');
    // Try clicking on tag area below editor
    // Look for tag-related elements
    const tagArea = await page.evaluate(() => {
      const all = document.querySelectorAll('div, section, span');
      for (const el of all) {
        const text = (el.innerText || '').trim();
        if (text.includes('태그') && el.getBoundingClientRect().width > 50) {
          const r = el.getBoundingClientRect();
          // Find input inside or near
          const input = el.querySelector('input');
          if (input) {
            const ir = input.getBoundingClientRect();
            return { x: ir.x + ir.width/2, y: ir.y + ir.height/2 };
          }
          return { x: r.x + 10, y: r.y + r.height/2 + 10 };
        }
      }
      return null;
    });
    
    if (tagArea) {
      console.log('태그 영역 발견:', tagArea);
      await page.mouse.click(tagArea.x, tagArea.y);
      await page.waitForTimeout(500);
      await page.keyboard.type('#영상편집외주 #에이컷 #전담에디터', { delay: 20 });
      await page.waitForTimeout(1000);
      console.log('✅ 태그 직접 입력 시도');
    }
  }
  
  // === 3. 저장 ===
  console.log('\n=== 3. 저장 ===');
  // Check if content changed
  const alignCheck = await page.evaluate(() => {
    const w = document.querySelector('.se-content');
    const text = w ? w.innerText : '';
    const paras = w ? w.querySelectorAll('.se-text-paragraph') : [];
    let centerCount = 0, leftCount = 0;
    paras.forEach(p => {
      if ((p.className || '').includes('center')) centerCount++;
      else leftCount++;
    });
    return { textLength: text.length, centerCount, leftCount };
  });
  console.log('정렬 상태:', JSON.stringify(alignCheck));
  
  await page.evaluate(() => document.querySelector('.save_btn__bzc5B')?.click());
  await page.waitForTimeout(3000);
  console.log('✅ 저장');
  
  await page.screenshot({ path: 'recheck_fixed.png' });
  await b.close();
})();
