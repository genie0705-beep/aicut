const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { await b.close(); return; }

  // 1. 이미지 alt 태그 수정
  const altMap = {
    'aicut_blog_fp_main.png': '보험마케팅 FP 숏폼영상 편집 아웃소싱 에이컷',
    'aicut_blog_fp_card1.png': '상반기 보험 마케팅 트렌드 영상편집외주 숏폼마케팅',
    'aicut_blog_fp_card2.png': '하반기 FP 마케팅 숏폼 영상 전략 영상편집',
    'aicut_blog_fp_card3.png': '보험설계사 영상 마케팅 예약률 상승 사례 에이컷',
    'aicut_blog_fp_cta.png': '보험 마케팅 아웃소싱 에이컷 무료상담 숏폼'
  };

  const altFixed = await wp.evaluate((am) => {
    const imgs = document.querySelectorAll('img');
    let count = 0;
    imgs.forEach(img => {
      const src = img.src || '';
      for (const [key, val] of Object.entries(am)) {
        const shortKey = key.replace('.png', '').substring(0, 20);
        if (src.includes(shortKey)) {
          img.setAttribute('alt', val);
          const comp = img.closest('[class*="component"]');
          if (comp) comp.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
          count++;
          break;
        }
      }
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    return count;
  }, altMap);
  console.log('1. 이미지 alt 태그: ' + altFixed + '개 수정');

  await wp.waitForTimeout(500);

  // 2. "보험 마케팅" 키워드 추가 — 기존 문장 살짝 수정
  const kwFixed = await wp.evaluate(() => {
    const paras = document.querySelectorAll('.se-text-paragraph');
    let added = 0;
    paras.forEach(p => {
      const text = (p.textContent || '').trim();
      
      // 첫째 트렌드 문단: "FP 개인 SNS에서 숏폼 영상 비중이 70%를 넘었다."
      // → "개인 SNS 보험 마케팅에서 숏폼 영상 비중이 70%를 넘었다."
      if (text.includes('FP 개인 SNS에서 숏폼 영상 비중이')) {
        p.innerHTML = p.innerHTML.replace('FP 개인 SNS에서', '개인 SNS <strong>보험 마케팅</strong>에서');
        added++;
      }
      
      // "핵심은 간단하다. 'FP가 찍고, 전문가가 편집한다.'"
      // → 보충 문장 추가 (하지만 writeTextWithSoftLineBreak로 추가해야 함)
    });
    
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    return added;
  });
  console.log('2. "보험 마케팅" 키워드 보강: ' + kwFixed + '곳');

  await wp.waitForTimeout(500);

  // 추가 텍스트 삽입 (보험 마케팅 키워드 포함)
  await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    // 마지막 위치에 추가
    se._editingService.writeTextWithSoftLineBreak('\n\n<strong>보험 마케팅</strong>의 핵심은 꾸준함이다. FP 브랜딩을 원한다면 지금 시작하라.');
  });
  console.log('3. 추가 텍스트 삽입 완료');

  await wp.waitForTimeout(1000);

  // 센터 정렬 재적용
  await wp.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });
  console.log('4. 센터 정렬 재적용');

  // Strong이 깨졌을 수 있으니 새 문단에 Strong 적용
  await wp.evaluate(() => {
    const kws = ['영상편집외주', '숏폼 마케팅', '보험 마케팅', 'FP 브랜딩', '하반기'];
    const paras = document.querySelectorAll('.se-text-paragraph');
    paras.forEach(p => {
      let html = p.innerHTML;
      kws.forEach(kw => {
        const re = new RegExp('(?![^<]*>)(' + kw + ')', 'g');
        if (re.test(html)) html = html.replace(re, '<strong>$1</strong>');
      });
      p.innerHTML = html;
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });
  console.log('5. Strong 재적용');

  // 저장
  await wp.locator('button').filter({ hasText: '저장' }).first().click();
  await wp.waitForTimeout(1000);
  console.log('6. 💾 저장 완료');

  // 최종 검증
  const final = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const ft = se.getContentText();
    const imgs = document.querySelectorAll('img');
    return {
      contentLen: ft.length,
      '보험마케팅_키워드': (ft.match(/보험 마케팅/g) || []).length,
      imgAlts: Array.from(imgs).map(img => img.getAttribute('alt')),
      strongCount: document.querySelectorAll('strong, b').length,
      paraCount: document.querySelectorAll('.se-text-paragraph').length,
      h2Count: document.querySelectorAll('h2').length
    };
  });
  console.log('\n=== 최종 검증 ===');
  console.log(JSON.stringify(final, null, 2));
  
  await b.close();
  console.log('\n✅ 보완 완료!');
}
main().catch(e => console.error('❌', e.message));
