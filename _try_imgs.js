const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';
const IMAGES = ['aicut_blog_freelancer_thumb.png','aicut_blog_freelancer_01.png','aicut_blog_freelancer_02.png','aicut_blog_freelancer_03.png','aicut_blog_freelancer_cta.png'];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  let page;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { console.log('no editor'); process.exit(1); }
  
  await page.bringToFront();
  await page.waitForTimeout(1500);
  
  // STEP 1: 사진 버튼 DOM 분석
  console.log('=== 사진 버튼 분석 ===');
  const btnInfo = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const text = (btn.innerText || '').trim();
      if (text.startsWith('사진')) {
        const r = btn.getBoundingClientRect();
        return {
          text: text.replace(/\n/g, '|'),
          cls: btn.className,
          x: Math.round(r.x), y: Math.round(r.y),
          w: Math.round(r.width), h: Math.round(r.height),
          visible: r.width > 0,
          tag: btn.tagName,
          onclick: btn.getAttribute('onclick') ? 'has onclick' : 'no onclick'
        };
      }
    }
    return null;
  });
  console.log(JSON.stringify(btnInfo, null, 2));
  
  // STEP 2: 사진 버튼 클릭 후 DOM 변화 분석
  if (btnInfo) {
    console.log('\n=== 사진 버튼 클릭 ===');
    // 클릭 전 file input 상태
    const beforeFileInputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input[type="file"]')).map(i => ({
        id: i.id, accept: i.accept, multiple: i.multiple, visible: i.offsetHeight > 0
      }));
    });
    console.log('클릭 전 file inputs:', JSON.stringify(beforeFileInputs));
    
    // filechooser 이벤트 대기 + 클릭
    const fcPromise = page.waitForEvent('filechooser', { timeout: 8000 });
    await page.mouse.click(btnInfo.x + btnInfo.w/2, btnInfo.y + btnInfo.h/2);
    await page.waitForTimeout(2000);
    
    // 클릭 후 변화 확인
    const afterState = await page.evaluate(() => {
      const result = [];
      // file inputs
      const fis = document.querySelectorAll('input[type="file"]');
      result.push('file inputs: ' + fis.length);
      fis.forEach(f => result.push('  id=' + f.id + ' accept=' + f.accept + ' multiple=' + f.multiple + ' visible=' + (f.offsetHeight > 0)));
      
      // 새로 나타난 요소들 (popup/menu)
      const all = document.querySelectorAll('*');
      let newElements = 0;
      all.forEach(el => {
        const r = el.getBoundingClientRect();
        // 찾기: 사진 버튼 근처나 에디터 영역에 새로 나타난 요소
        if (r.width > 30 && r.height > 20 && r.y > 90 && r.y < 300) {
          const t = (el.innerText || '').trim();
          if (t && (t.includes('사진') || t.includes('추가') || t.includes('파일') || t.includes('PC') || t.includes('업로드'))) {
            result.push('  new: "' + t.substring(0,30) + '" (' + Math.round(r.x) + ',' + Math.round(r.y) + ') ' + el.tagName);
            newElements++;
          }
        }
      });
      if (newElements === 0) result.push('  no new photo-related elements found');
      
      return result.join('\n');
    });
    console.log('클릭 후:', afterState);
    
    // filechooser 확인
    const fc = await fcPromise.catch(() => null);
    if (fc) {
      console.log('\n✅ filechooser 이벤트 발생!');
      const filePaths = IMAGES.map(f => path.join(WORKSPACE, f));
      await fc.setFiles(filePaths);
      await page.waitForTimeout(3000);
      console.log('✅ 5장 업로드 완료');
    } else {
      console.log('\n❌ filechooser 없음');
      // 대체: hidden file input을 찾아서 직접 설정
      const altResult = await page.evaluate((imgPaths) => {
        const inputs = document.querySelectorAll('input[type="file"]');
        for (const inp of inputs) {
          if (inp.offsetHeight > 0 || inp.style.display !== 'none') {
            // Can't set files via JS, need Playwright
            return 'visible input found: ' + inp.id;
          }
        }
        // Check if any dynamically added file input
        const allNew = document.querySelectorAll('input[type="file"]');
        return 'total file inputs: ' + allNew.length;
      }, IMAGES);
      console.log('대체 시도:', altResult);
      
      // Try using native click on the 사진 버튼 via evaluate
      await page.screenshot({ path: 'img_upload_debug.png' });
    }
  }
  
  // STEP 3: 시도 2 - dispatchEvent 방식
  console.log('\n=== 시도 2: dispatchEvent click ===');
  const fcPromise2 = page.waitForEvent('filechooser', { timeout: 8000 });
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const text = (btn.innerText || '').trim();
      if (text.startsWith('사진')) {
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        break;
      }
    }
  });
  await page.waitForTimeout(2000);
  
  const fc2 = await fcPromise2.catch(() => null);
  if (fc2) {
    console.log('✅ dispatchEvent로 filechooser 발생!');
    await fc2.setFiles(IMAGES.map(f => path.join(WORKSPACE, f)));
    await page.waitForTimeout(3000);
    console.log('✅ 5장 업로드 완료');
  } else {
    console.log('❌ dispatchEvent도 실패');
    
    // 시도 3: 사진 버튼의 내부 파일 input 찾기
    console.log('\n=== 시도 3: 버튼 내부 구조 분석 ===');
    const btnDetail = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        const text = (btn.innerText || '').trim();
        if (text.startsWith('사진')) {
          return {
            html: btn.innerHTML.substring(0, 500),
            childCount: btn.children.length,
            children: Array.from(btn.children).map(c => ({
              tag: c.tagName,
              cls: (c.className || '').substring(0, 40),
              inner: (c.innerHTML || '').substring(0, 100)
            }))
          };
        }
      }
      return null;
    });
    // 이 버튼 내부에 file input이 있는지 확인
    if (btnDetail) {
      const hasFileInput = btnDetail.html.includes('input') && btnDetail.html.includes('file');
      console.log('버튼 내 file input 포함:', hasFileInput);
    }
    
    await page.screenshot({ path: 'img_upload_final_debug.png' });
  }
  
  await b.close();
})();
