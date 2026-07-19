const { chromium } = require('playwright');

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
  if (!wp) { await b.close(); return; }

  // 1. 이미지 alt 태그
  const altFixed = await wp.evaluate((altMap) => {
    const imgs = document.querySelectorAll('img');
    let count = 0;
    imgs.forEach(img => {
      for (const [filename, alt] of Object.entries(altMap)) {
        const key = filename.replace('.png', '').substring(0, 20);
        if ((img.src || '').includes(key)) {
          img.setAttribute('alt', alt);
          img.closest('[class*="component"]')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
          count++;
          break;
        }
      }
    });
    return count;
  }, ALT_MAP);
  console.log(`1. 이미지 alt 태그: ${altFixed}개`);

  await wp.waitForTimeout(500);

  // 2. H2 변환 — '📊', '🚀', '✅', '💎' 로 시작하는 문단 → H2
  const h2Count = await wp.evaluate(() => {
    const paras = document.querySelectorAll('.se-text-paragraph');
    let count = 0;
    paras.forEach(p => {
      const text = (p.textContent || '').trim();
      if (['📊','🚀','✅','💎'].some(s => text.startsWith(s))) {
        const h2 = document.createElement('h2');
        h2.textContent = text;
        h2.style.textAlign = 'center';
        h2.className = p.className;
        p.parentNode.replaceChild(h2, p);
        count++;
      }
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    return count;
  });
  console.log(`2. H2 태그: ${h2Count}개`);

  await wp.waitForTimeout(500);

  // 3. Strong 태그 — 키워드에 굵게 적용
  const strongCount = await wp.evaluate(() => {
    const paras = document.querySelectorAll('.se-text-paragraph');
    const keywords = ['영상편집외주', '숏폼 마케팅', '보험 마케팅', 'FP 브랜딩', '하반기'];
    let count = 0;

    paras.forEach(p => {
      let html = p.innerHTML;
      keywords.forEach(kw => {
        const regex = new RegExp(`(?![^<]*>)(${kw})`, 'g');
        if (regex.test(html)) {
          html = html.replace(regex, '<strong>$1</strong>');
          count++;
        }
      });
      p.innerHTML = html;
    });

    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    return count;
  });
  console.log(`3. Strong 태그: ${strongCount}개 적용`);

  await wp.waitForTimeout(800);

  // 4. 최종 검증
  const final = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const fullText = se.getContentText();
    const imgs = document.querySelectorAll('img');
    const paras = document.querySelectorAll('.se-text-paragraph');
    const h2s = document.querySelectorAll('h2');
    const strongs = document.querySelectorAll('strong, b');
    const longParas = Array.from(paras).filter(p => (p.textContent || '').length > 50);
    
    return {
      contentLen: fullText.length,
      paraCount: paras.length,
      imgCount: imgs.length,
      h2Count: h2s.length,
      strongCount: strongs.length,
      longParasOver50: longParas.length,
      imgAlts: Array.from(imgs).map(img => img.getAttribute('alt') || '(없음)')
    };
  });

  console.log('\n=== 최종 SEO 상태 ===');
  console.log(JSON.stringify(final, null, 2));

  // 저장
  await wp.locator('button').filter({ hasText: '저장' }).first().click();
  await wp.waitForTimeout(1000);
  console.log('\n💾 저장 완료');

  await b.close();
  console.log('✅ SEO 최적화 완료!');
}
main().catch(e => console.error('❌', e.message));
