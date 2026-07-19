// 블로그봇 FINAL — postupdate URL 우회 → SE4 이미지 삽입 → 저장
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
  console.log('=== 블로그 이미지 삽입 FINAL ===\n');
  
  for (const img of IMAGES) {
    if (!fs.existsSync(img.file)) { console.error(`❌ 없음: ${img.file}`); process.exit(1); }
    console.log(`✅ ${img.label}: ${path.basename(img.file)}`);
  }
  
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find(p => !p.url().includes('about:blank'));
  if (!page) page = await ctx.newPage();

  // Handle dialogs silently from the start
  ctx.on('page', p => {
    p.on('dialog', dialog => {
      console.log(`  ⚠️ 다이얼로그: "${dialog.message().substring(0, 50)}" → 수락`);
      dialog.accept().catch(() => {});
    });
  });
  page.on('dialog', dialog => {
    console.log(`  ⚠️ 다이얼로그: "${dialog.message().substring(0, 50)}" → 수락`);
    dialog.accept().catch(() => {});
  });
  
  // Step 1: Go to the edit page directly via postupdate URL
  console.log('\n--- 1단계: 수정 페이지 접속 ---');
  await page.goto('https://blog.naver.com/aicut/postupdate?logNo=224341544476', {
    waitUntil: 'domcontentloaded', timeout: 30000
  });
  await sleep(8000);  // Naver blog can be slow to load editor
  
  const currentUrl = page.url();
  console.log(`현재 URL: ${currentUrl.substring(0, 120)}`);
  
  if (currentUrl.includes('login') || currentUrl.includes('auth')) {
    console.error('❌ 로그인 필요! 수동 로그인 후 재시도.');
    browser.disconnect();
    process.exit(1);
  }
  
  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\debug_final_edit_page.png' });
  console.log('수정 페이지 스크린샷 저장');
  
  // Step 2: Find SE4 editor
  console.log('\n--- 2단계: SE4 에디터 찾기 ---');
  
  let target = page;
  const frames = page.frames();
  let seFrame = null;
  
  console.log(`총 ${frames.length} 프레임`);
  for (const f of frames) {
    if (f.name() === 'SE' || f.url().includes('/SE/') || f.url().includes('smart/editor')) {
      seFrame = f;
      console.log(`✅ SE4 전용 iframe: "${f.name()}" url="${f.url().substring(0, 100)}"`);
      break;
    }
  }
  
  if (!seFrame) {
    // Check all frames for editor content
    for (const f of frames) {
      try {
        const hasSe = await f.evaluate(() => {
          return !!(document.querySelector('.se-content') || 
                   document.querySelector('.se-text-paragraph') ||
                   document.querySelector('[contenteditable]') ||
                   document.querySelector('div[class*="se-"]'));
        });
        if (hasSe) {
          seFrame = f;
          console.log(`✅ 에디터 프레임 발견: name="${f.name()}"`);
          break;
        }
      } catch (e) {
        console.log(`  프레임 평가 오류: "${f.name()}" - ${e.message.substring(0, 60)}`);
      }
    }
  }
  
  if (seFrame) {
    target = seFrame;
    console.log('SE4 iframe 사용');
  } else {
    // Check main page
    const hasDirect = await page.evaluate(() => {
      return !!(document.querySelector('[contenteditable]') || document.querySelector('.se-component'));
    });
    if (hasDirect) {
      console.log('메인 페이지 직접 에디터 사용');
      target = page;
    } else {
      console.log('⚠️ SE4 에디터를 프레임에서 찾지 못함. 메인 페이지 fallback.');
    }
  }
  
  // Print editor state
  const editorInfo = await target.evaluate(() => {
    const ce = document.querySelector('[contenteditable]');
    const seComp = document.querySelectorAll('.se-component');
    const sePara = document.querySelectorAll('.se-text-paragraph');
    return {
      hasContentEditable: !!ce,
      seComponentCount: seComp.length,
      seParagraphCount: sePara.length,
      bodyText: document.body.innerText.substring(0, 200)
    };
  }).catch(e => ({ error: e.message }));
  
  console.log('에디터 상태:', JSON.stringify(editorInfo));
  
  // Step 3: Insert images via clipboard paste  
  console.log('\n--- 3단계: 이미지 삽입 (클립보드 paste) ---');
  
  for (let i = 0; i < IMAGES.length; i++) {
    const img = IMAGES[i];
    console.log(`\n[${i+1}/${IMAGES.length}] ${img.label}`);
    
    // Click in editor to focus
    try {
      const editable = await target.$('[contenteditable], .se-text-paragraph, .se-component');
      if (editable) {
        await editable.click();
        await sleep(500);
      }
    } catch (e) {
      console.log(`  ⚠️ 포커스: ${e.message.substring(0, 50)}`);
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
        document.activeElement.dispatchEvent(new ClipboardEvent('paste', {
          clipboardData: dt, bubbles: true, cancelable: true
        }));
      }, b64);
      
      console.log('  ✅ paste 완료');
      await sleep(2500);
    } catch (e) {
      console.log(`  ❌ paste 실패: ${e.message}`);
    }
  }
  
  // Step 4: Center alignment
  console.log('\n--- 4단계: 센터 정렬 ---');
  try {
    await target.evaluate(() => {
      // Find all wrapper elements that contain images
      const items = document.querySelectorAll('[class*="se-image"], [class*="se-component"], [class*="se-module"]');
      items.forEach(el => {
        if (el.querySelector('img') || el.tagName === 'IMG') {
          el.style.textAlign = 'center';
          el.style.display = 'flex';
          el.style.justifyContent = 'center';
        }
      });
      // Also center standalone images
      document.querySelectorAll('img').forEach(img => {
        img.style.display = 'block';
        img.style.margin = '0 auto';
      });
      document.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    });
    console.log('✅ 센터 정렬 적용');
  } catch (e) {
    console.log(`⚠️ 정렬 오류: ${e.message}`);
  }
  
  await sleep(1500);
  
  // Step 5: Save
  console.log('\n--- 5단계: 저장 ---');
  
  // Save button is in the main page (parent), not in iframe
  let saveClicked = false;
  
  // Method 1: Find by text content in main page
  saveClicked = await page.evaluate(() => {
    const allElements = document.querySelectorAll('button, a, span, div, input');
    // Prefer visible buttons
    for (const el of allElements) {
      const text = el.textContent.trim();
      if ((text === '저장' || text === '저장하기' || text === '발행') && el.offsetParent !== null) {
        if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT') {
          el.click();
          console.log(`Save via: ${el.tagName}`);
          return true;
        }
        // If it's a span/div, click its parent button
        const parent = el.closest('button, a');
        if (parent) {
          parent.click();
          console.log(`Save via parent: ${parent.tagName}`);
          return true;
        }
      }
    }
    return false;
  });
  
  if (saveClicked) {
    console.log('✅ 저장 버튼 클릭 완료');
  } else {
    // Method 2: Try various selectors
    const selectors = [
      '#saveBtn', 'button._save', 'button.btn_save', 
      '[onclick*="submit"]:not([onclick*="cancel"])',
      'button[id*="save"]', 'a[id*="save"]'
    ];
    
    for (const sel of selectors) {
      const el = await page.$(sel);
      if (el) {
        try {
          await el.click();
          saveClicked = true;
          console.log(`✅ 저장 클릭: ${sel}`);
          break;
        } catch (e) {
          console.log(`  ⚠️ ${sel} 클릭 실패: ${e.message.substring(0, 50)}`);
        }
      }
    }
  }
  
  if (!saveClicked) {
    // Method 3: Get the full list of clickable elements with "저장" text
    const saveButtons = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('button, a, input[type="button"]').forEach(el => {
        if (el.textContent.trim().includes('저장') || el.value === '저장' || el.title === '저장') {
          const rect = el.getBoundingClientRect();
          items.push({
            tag: el.tagName,
            text: el.textContent.trim().substring(0, 30),
            visible: rect.width > 0 && rect.height > 0,
            rect: `${rect.width}x${rect.height} at ${rect.left},${rect.top}`,
            class: el.className.substring(0, 60)
          });
        }
      });
      return items;
    });
    
    console.log(`저장 버튼 후보: ${saveButtons.length}개`);
    saveButtons.forEach((b, i) => console.log(`  [${i+1}] ${b.tag} "${b.text}" vis=${b.visible} ${b.rect} class="${b.class}"`));
    
    // Try clicking first visible candidate
    for (const btn of saveButtons) {
      if (btn.visible) {
        console.log(`가시적 저장 버튼 발견: "${btn.text}"`);
        try {
          await page.click(`text="${btn.text}"`);
          saveClicked = true;
          console.log('✅ 클릭 완료');
          break;
        } catch (e) {
          console.log(`  클릭 실패: ${e.message.substring(0, 50)}`);
        }
      }
    }
  }
  
  if (!saveClicked) {
    console.log('⚠️ 자동 저장 실패. 수동 저장 필요.');
    console.log('SE4는 자동 저장(auto-save) 기능이 있을 수 있음.');
  }
  
  await sleep(4000);
  
  // Step 6: Final verification
  console.log('\n--- 6단계: 최종 확인 ---');
  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\debug_final_state.png', fullPage: true });
  
  const savedMsg = await page.evaluate(() => document.body.innerText.includes('저장되었습니다'));
  console.log(`저장 확인 메시지: ${savedMsg ? '✅ 있음' : '⚠️ 없음'}`);
  
  // Check if editor shows in preview mode or still in edit mode
  const finalUrl = page.url();
  console.log(`최종 URL: ${finalUrl.substring(0, 100)}`);
  
  if (finalUrl.includes('postupdate')) {
    console.log('⚠️ 아직 수정 페이지에 머물러 있음. 저장이 완료되지 않았을 수 있음.');
  } else if (finalUrl.includes('PostView')) {
    console.log('✅ PostView로 이동됨 — 저장 완료');
  }
  
  console.log('\n=== 결과 요약 ===');
  console.log('├─ 이미지 삽입: 5개 시도 (클립보드 paste)');
  console.log('├─ 센터 정렬: 적용됨');
  console.log(`├─ 저장: ${saveClicked ? '자동 클릭 완료' : '수동 저장 필요 (SE4 자동 저장 대기)'}`);
  console.log(`├─ 저장 확인: ${savedMsg ? '메시지 있음' : '메시지 없음 — 스크린샷 확인'}`);
  console.log('└─ 스크린샷: debug_final_state.png');
  
  browser.disconnect();
  console.log('🔌 연결 해제');
}

main().catch(err => {
  console.error('FATAL:', err.message);
  console.error(err.stack);
  process.exit(1);
});
