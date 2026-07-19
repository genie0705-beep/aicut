const { chromium } = require('playwright');

// 이미지별 alt 텍스트
const ALT_MAP = {
  'aicut_blog_fp_main.png': '보험마케팅 FP 숏폼영상 편집 아웃소싱 에이컷',
  'aicut_blog_fp_card1.png': '상반기 보험 마케팅 트렌드 영상편집외주 숏폼마케팅',
  'aicut_blog_fp_card2.png': '하반기 FP 마케팅 숏폼 영상 전략 영상편집',
  'aicut_blog_fp_card3.png': '보험설계사 영상 마케팅 예약률 상승 사례 에이컷',
  'aicut_blog_fp_cta.png': '보험 마케팅 아웃소싱 에이컷 무료상담 숏폼'
};

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('글쓰기 페이지 없음'); await b.close(); return; }

  // 1. 이미지 alt 태그 수정
  const altResult = await wp.evaluate((altMap) => {
    const imgs = document.querySelectorAll('.se-image-component img, .se-component img');
    let fixed = 0;
    imgs.forEach(img => {
      const src = img.src || '';
      // 파일명 추출
      for (const [filename, alt] of Object.entries(altMap)) {
        if (src.includes(filename.replace('.png', '').substring(0, 20))) {
          img.setAttribute('alt', alt);
          // SE4의 image 컴포넌트에 alt 업데이트 알림
          const comp = img.closest('[class*="component"]');
          if (comp) comp.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
          fixed++;
          break;
        }
      }
    });
    return fixed;
  }, ALT_MAP);
  console.log(`1. 이미지 alt 태그: ${altResult}개 수정`);

  // 2. Strong 태그 적용 — 텍스트에 키워드 굵게
  const strongResult = await wp.evaluate(() => {
    const paras = document.querySelectorAll('.se-text-paragraph');
    let count = 0;
    const keywordBolds = [
      ['영상편집외주', '영상 편집 아웃소싱'],
      ['숏폼 마케팅', '숏폼'],
      ['보험 마케팅', '보험업계'],
      ['FP 브랜딩', 'FP'],
      ['하반기']
    ];
    
    const applyBold = (node) => {
      if (node.nodeType === 3) { // text node
        const text = node.textContent;
        for (const [kw, ...alts] of keywordBolds) {
          const searchTerms = [kw, ...alts];
          for (const term of searchTerms) {
            if (text.includes(term)) {
              const idx = text.indexOf(term);
              if (idx >= 0) {
                const before = document.createTextNode(text.substring(0, idx));
                const bold = document.createElement('strong');
                bold.textContent = term;
                const after = document.createTextNode(text.substring(idx + term.length));
                const parent = node.parentNode;
                parent.insertBefore(before, node);
                parent.insertBefore(bold, node);
                parent.insertBefore(after, node);
                parent.removeChild(node);
                count++;
                return true;
              }
            }
          }
        }
      } else if (node.nodeType === 1 && !['STRONG','B','SCRIPT','STYLE'].includes(node.tagName)) {
        Array.from(node.childNodes).forEach(child => applyBold(child));
      }
    };

    paras.forEach(p => {
      const normalizer = document.createElement('div');
      normalizer.innerHTML = p.innerHTML;
      Array.from(normalizer.childNodes).forEach(child => applyBold(child));
      p.innerHTML = normalizer.innerHTML;
    });

    // SE4에 변경 알림
    const wrap = document.querySelector('.se-text-document') || document.querySelector('.se-canvas-layer');
    if (wrap) wrap.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    
    return count;
  });
  console.log(`2. Strong 태그: ${strongResult}개 적용`);

  await wp.waitForTimeout(1000);

  // 3. H2 변환 — 섹션 제목을 H2로
  const h2Result = await wp.evaluate(() => {
    const paras = document.querySelectorAll('.se-text-paragraph');
    let count = 0;
    const sectionHeaders = ['📊 상반기 보험 마케팅 트렌드 3가지', '🚀 하반기 FP 마케팅, 숏폼으로 준비하라', '✅ 실제 사례: FP A님의 180% 예약률 상승', '💎 에이컷과 함께하는 하반기 준비'];

    paras.forEach(p => {
      const text = (p.textContent || '').trim();
      for (const header of sectionHeaders) {
        if (text.includes(header.substring(0, 15))) {
          // Convert to H2
          const h2 = document.createElement('h2');
          h2.textContent = p.textContent;
          h2.style.textAlign = 'center';
          h2.className = p.className;
          p.parentNode.replaceChild(h2, p);
          count++;
          break;
        }
      }
    });

    // SE4에 변경 알림
    const wrap = document.querySelector('.se-text-document') || document.querySelector('.se-canvas-layer');
    if (wrap) wrap.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));

    return count;
  });
  console.log(`3. H2 태그: ${h2Result}개 변환`);

  await wp.waitForTimeout(1000);

  // 4. 모바일 최적화 — 50자 초과 문단 분할
  const splitResult = await wp.evaluate(() => {
    const paras = document.querySelectorAll('.se-text-paragraph');
    let splitCount = 0;
    
    paras.forEach(p => {
      const text = (p.textContent || '').trim();
      if (text.length > 50) {
        // 문장 단위로 분할 (마침표, 줄바꿈 기준)
        const sentences = text.split(/(?<=[.다요.])/g)
          .map(s => s.trim())
          .filter(s => s.length > 0);
        
        if (sentences.length > 1) {
          // 첫 문장은 기존 p에, 나머지는 새 p로
          p.textContent = sentences[0];
          const parent = p.parentNode;
          for (let i = 1; i < sentences.length; i++) {
            const newP = document.createElement('p');
            newP.textContent = sentences[i];
            newP.className = p.className;
            newP.style.textAlign = 'center';
            parent.insertBefore(newP, p.nextSibling);
            splitCount++;
          }
        }
      }
    });

    const wrap = document.querySelector('.se-text-document') || document.querySelector('.se-canvas-layer');
    if (wrap) wrap.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));

    return splitCount;
  });
  console.log(`4. 모바일 최적화: ${splitResult}개 문단 분할`);

  await wp.waitForTimeout(1000);

  // 5. 최종 재검증
  const final = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const fullText = se.getContentText();
    const imgs = document.querySelectorAll('.se-image-component img, .se-component img, .se-canvas-layer img');
    const paras = document.querySelectorAll('.se-text-paragraph, h2, h3');
    const strongs = document.querySelectorAll('strong, b');
    const headers = document.querySelectorAll('h2, h3');
    const longParas = Array.from(paras).filter(p => (p.textContent || '').length > 50);
    
    // 이미지 alt
    const imgAlts = Array.from(imgs).map(img => img.getAttribute('alt') || '(없음)');

    return {
      contentLen: fullText.length,
      paraCount: paras.length,
      imgCount: imgs.length,
      strongCount: strongs.length,
      hCount: headers.length,
      longParasOver50: longParas.length,
      imgAlts
    };
  });
  console.log('\n=== 최종 재검증 ===');
  console.log(JSON.stringify(final, null, 2));

  // 저장
  const saveBtn = wp.locator('button').filter({ hasText: '저장' }).first();
  if (await saveBtn.isVisible()) {
    await saveBtn.click();
    await wp.waitForTimeout(1000);
    console.log('💾 저장 완료');
  }

  await b.close();
  console.log('\n✅ SEO 보완 완료!');
}
main().catch(e => console.error('❌', e.message));
