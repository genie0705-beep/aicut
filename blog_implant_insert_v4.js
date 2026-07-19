// 블로그봇 v4 — 정확한 수정 링크 클릭 → SE4 에디터 진입 → 이미지 삽입 → 저장
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CDP_PORT = 9224;

const IMAGES = [
  { file: 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_implant_main.png', label: '대표' },
  { file: 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_implant_card1.png', label: 'card1' },
  { file: 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_implant_card2.png', label: 'card2' },
  { file: 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_implant_card3.png', label: 'card3' },
  { file: 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_implant_cta.png', label: 'CTA' }
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('=== 블로그 이미지 삽입 v4 시작 ===');
  
  for (const img of IMAGES) {
    if (!fs.existsSync(img.file)) { console.error(`❌ 없음: ${img.file}`); process.exit(1); }
    console.log(`✅ ${img.label}`);
  }
  
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  const ctx = browser.contexts()[0];
  
  // Find or create page
  let page = ctx.pages().find(p => p.url().includes('logNo=224341544476'));
  if (!page) page = await ctx.newPage();
  
  // Step 1: Go to PostView and find the edit URL
  console.log('\n--- 1단계: 수정 URL 찾기 ---');
  await page.goto('https://blog.naver.com/PostView.naver?blogId=aicut&logNo=224341544476', {
    waitUntil: 'domcontentloaded', timeout: 30000
  });
  await sleep(4000);
  
  // Find the edit link in the page
  const editUrl = await page.evaluate(() => {
    // Method 1: Find <a> tag with 수정 text that has edit URL
    const links = document.querySelectorAll('a');
    for (const a of links) {
      const text = a.textContent.trim();
      if (text === '수정' && a.href && (a.href.includes('PostWrite') || a.href.includes('PostEdit') || a.href.includes('modify'))) {
        return a.href;
      }
    }
    // Method 2: Any link with 수정 text + logNo
    for (const a of links) {
      const text = a.textContent.trim();
      if (text === '수정' && a.href && a.href.includes('224341544476')) {
        return a.href;
      }
    }
    // Method 3: Any link with 수정 text
    for (const a of links) {
      if (a.textContent.trim() === '수정' && a.href) {
        return a.href;
      }
    }
    // Method 4: Look for onclick handlers that navigate to edit
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const onclick = el.getAttribute('onclick');
      if (onclick && onclick.includes('PostWrite') && onclick.includes('224341544476')) {
        // Extract URL from onclick
        const match = onclick.match(/location\.href=['"]?([^'"]+)['"]?/);
        if (match) return match[1];
        return onclick;
      }
    }
    return '';
  });
  
  console.log(`찾은 수정 URL: ${editUrl.substring(0, 120) || '(없음)'}`);
  
  // Step 2: Navigate to edit page
  if (editUrl) {
    console.log('\n--- 2단계: 수정 페이지 이동 ---');
    await page.goto(editUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(5000);
  } else {
    console.log('\n--- 2단계: 수정 URL 자동 구성 ---');
    // Try the common Naver edit URL format
    await page.goto('https://blog.naver.com/PostWrite.naver?blogId=aicut&logNo=224341544476', {
      waitUntil: 'domcontentloaded', timeout: 30000
    });
    await sleep(5000);
  }
  
  const afterEditUrl = page.url();
  console.log(`이동 후 URL: ${afterEditUrl.substring(0, 120)}`);
  
  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\debug_v4_edit.png' });
  console.log('수정 페이지 스크린샷');
  
  // Check if we're on the edit page or got redirected
  if (afterEditUrl.includes('login') || afterEditUrl.includes('auth')) {
    console.log('⚠️ 로그인 페이지. 현재 로그인 상태 확인...');
    const cookies = await ctx.cookies();
    const hasNid = cookies.some(c => c.name.includes('NID_SES') || c.name.includes('nid'));
    console.log(`네이버 로그인: ${hasNid ? '✅' : '❌'}`);
    
    if (!hasNid) {
      console.error('❌ 로그인 필요. 수동으로 로그인 후 재시도하세요.');
      browser.disconnect();
      process.exit(1);
    }
  }
  
  if (afterEditUrl.includes('PostView')) {
    console.log('⚠️ PostView에 머물러 있음. 수정 페이지에 접근할 수 없습니다.');
    console.log('블로그 관리 페이지에서 수동으로 수정 버튼을 찾습니다...');
    
    // Try clicking the 수정 button on the PostView page
    await page.goto('https://blog.naver.com/PostView.naver?blogId=aicut&logNo=224341544476', {
      waitUntil: 'domcontentloaded', timeout: 30000
    });
    await sleep(5000);
    
    // Take screenshot to see the page
    await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\debug_v4_postview_full.png', fullPage: true });
    
    // Use evaluate to click the correct element
    const clicked = await page.evaluate(() => {
      // Find the element that says 수정 and is a proper link
      const elements = document.querySelectorAll('a[href*="PostWrite"], a[href*="PostEdit"], a[href*="modify"], a[onclick*="PostWrite"], a[onclick*="modify"]');
      for (const el of elements) {
        if (el.textContent.trim() === '수정' || el.textContent.includes('수정')) {
          el.click();
          return true;
        }
      }
      // Fallback: any link with 수정 text
      const allLinks = document.querySelectorAll('a');
      for (const a of allLinks) {
        if (a.textContent.trim() === '수정' || a.textContent.includes('수정')) {
          // Check if this is in a toolbar/menu area
          const rect = a.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && rect.width < 200) {
            a.click();
            return true;
          }
        }
      }
      return false;
    });
    
    console.log(`수정 버튼 클릭: ${clicked ? '✅' : '❌'}`);
    await sleep(5000);
    
    const urlAfterClick = page.url();
    console.log(`클릭 후 URL: ${urlAfterClick.substring(0, 120)}`);
    
    if (!urlAfterClick.includes('PostWrite')) {
      // Wait a bit more - maybe it's an AJAX load
      await sleep(5000);
      const finalUrl = page.url();
      console.log(`최종 URL: ${finalUrl.substring(0, 120)}`);
      
      if (finalUrl.includes('PostView')) {
        console.log('여전히 PostView. SE4 에디터가 현재 페이지에 overlay로 로드되었는지 확인...');
        
        // Check for SE4 iframe in the current page
        const hasSE = await page.evaluate(() => {
          return !!(document.querySelector('iframe[title="SE"]') || 
                   document.querySelector('iframe[src*="smart"]') || 
                   document.querySelector('.se-content'));
        });
        console.log(`SE4 에디터 iframe 현재 페이지: ${hasSE ? '✅' : '❌'}`);
      }
    }
  }
  
  // Step 3: Identify SE4 iframe/editor context
  console.log('\n--- 3단계: SE4 에디터 식별 ---');
  
  let target = null;
  
  // Check for SE iframe
  for (const f of page.frames()) {
    if (f.name() === 'SE' || f.url().includes('/SE/') || f.url().includes('smart/editor')) {
      target = f;
      console.log(`✅ SE iframe 발견: "${f.name()}"`);
      break;
    }
  }
  
  if (!target) {
    // Check all iframes
    const frames = page.frames();
    console.log(`총 ${frames.length}개 프레임`);
    for (const f of frames) {
      try {
        const hasEditor = await f.evaluate(() => {
          return !!(document.querySelector('.se-content') || 
                   document.querySelector('[contenteditable]') ||
                   document.querySelector('.se-text-paragraph'));
        });
        if (hasEditor) {
          target = f;
          console.log(`✅ 에디터 프레임 발견: name="${f.name()}" url="${f.url().substring(0, 60)}"`);
          break;
        }
      } catch (e) {}
    }
  }
  
  if (!target) {
    // Maybe it's the main page itself
    const hasEditor = await page.evaluate(() => {
      return !!(document.querySelector('[contenteditable]') || 
               document.querySelector('.se-text-paragraph') ||
               document.querySelector('.se-component'));
    });
    if (hasEditor) {
      target = page;
      console.log('✅ 에디터가 메인 페이지에 직접 있음');
    }
  }
  
  if (!target) {
    console.error('❌ SE4 에디터를 찾을 수 없음');
    await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\debug_v4_no_editor.png' });
    browser.disconnect();
    process.exit(1);
  }
  
  // Step 4: Insert images via clipboard paste (known working method from v3)
  console.log('\n--- 4단계: 이미지 삽입 ---');
  
  for (let i = 0; i < IMAGES.length; i++) {
    const img = IMAGES[i];
    console.log(`\n[${i+1}/${IMAGES.length}] ${img.label}`);
    
    // First, click on the editor to focus it
    try {
      await target.click('[contenteditable], .se-text-paragraph, .se-component');
      await sleep(500);
    } catch (e) {
      console.log(`  ⚠️ 포커스 실패: ${e.message.substring(0, 60)}`);
    }
    
    // Paste image
    try {
      const buf = fs.readFileSync(img.file);
      const b64 = buf.toString('base64');
      
      await target.evaluate(async (b64) => {
        const resp = await fetch(`data:image/png;base64,${b64}`);
        const blob = await resp.blob();
        const dt = new DataTransfer();
        dt.items.add(new File([blob], 'image.png', { type: 'image/png' }));
        document.dispatchEvent(new ClipboardEvent('paste', {
          clipboardData: dt, bubbles: true, cancelable: true
        }));
      }, b64);
      
      console.log('  ✅ paste 완료');
      await sleep(3000);
    } catch (e) {
      console.log(`  ❌ paste 실패: ${e.message.substring(0, 80)}`);
    }
  }
  
  // Step 5: Center alignment
  console.log('\n--- 5단계: 센터 정렬 ---');
  try {
    await target.evaluate(() => {
      // Find image containers
      const imgs = document.querySelectorAll('img');
      imgs.forEach(img => {
        let parent = img.parentElement;
        while (parent && !parent.classList.contains('se-component') && parent.tagName !== 'BODY') {
          parent = parent.parentElement;
        }
        if (parent && parent !== document.body) {
          parent.style.textAlign = 'center';
          parent.style.display = 'flex';
          parent.style.justifyContent = 'center';
        }
        img.style.display = 'block';
        img.style.margin = '0 auto';
      });
      document.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    });
    console.log('✅ 센터 정렬 적용');
  } catch (e) {
    console.log(`⚠️ 정렬 오류: ${e.message}`);
  }
  
  // Step 6: Save
  console.log('\n--- 6단계: 저장 ---');
  await sleep(2000);
  
  // SE4 save button is typically in the parent page, outside the iframe
  // Look for it in various ways
  let saved = false;
  
  // Method 1: Use evaluate to find and click save button
  saved = await page.evaluate(() => {
    // Common selectors for Naver save buttons
    const candidates = document.querySelectorAll(
      'button.se-save-button, ' +
      'button.btn_save, ' +
      'a.btn_save, ' +
      'a[onclick*="submit"], ' +
      'button:has-text("저장"), ' +
      'a:has-text("저장"), ' +
      '[class*="save"] button, ' +
      'button[id*="save"], ' +
      'a[id*="save"]'
    );
    
    for (const el of candidates) {
      if (el.offsetParent !== null) {
        el.click();
        console.log(`Save clicked via: ${el.tagName} class="${el.className}"`);
        return true;
      }
    }
    
    // Fallback: Any visible button/a with text 저장
    const all = document.querySelectorAll('button, a');
    for (const el of all) {
      if (el.textContent.trim() === '저장' && el.offsetParent !== null) {
        el.click();
        return true;
      }
    }
    return false;
  });
  
  console.log(saved ? '✅ 저장 버튼 클릭 완료' : '⚠️ 저장 버튼 찾지 못함');
  
  await sleep(3000);
  
  // Final screenshot
  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\debug_v4_final.png', fullPage: true });
  
  // Check for save confirmation
  const confirmMsg = await page.evaluate(() => document.body.innerText.includes('저장되었습니다'));
  console.log(`저장 확인 메시지: ${confirmMsg ? '✅ 있음' : '⚠️ 없음'}`);
  
  console.log('\n=== 결과 요약 ===');
  console.log(`수정 페이지 URL: ${page.url().substring(0, 100)}`);
  console.log(`이미지 삽입 시도: 5/5 (클립보드 paste)`);
  console.log(`센터 정렬: 적용됨`);
  console.log(`저장: ${saved ? '클릭 완료' : '수동 필요'}`);
  console.log(`저장 확인: ${confirmMsg ? '✅' : '⚠️'}`);
  console.log('\n최종 스크린샷: debug_v4_final.png');
  
  browser.disconnect();
  console.log('🔌 연결 해제');
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
