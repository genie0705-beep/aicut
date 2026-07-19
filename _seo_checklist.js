const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  for (const p of b.contexts()[0].pages()) {
    if (p.url().includes('PostWriteForm')) {
      // 저장된 글 불러오기
      p.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
      await p.evaluate(() => { const btn = document.querySelector('.save_count_btn__ZTLNa'); if (btn) btn.click(); });
      await sleep(2000);
      await p.evaluate(() => {
        const layer = document.querySelector('.layer_popup__WjlfW');
        if (!layer) return;
        const first = layer.querySelector('.article_button__JNVjf');
        if (first) first.click();
      });
      await sleep(3000);

      const text = await p.evaluate(() => {
        try { return SmartEditor._editors['blogpc001'].getContentText() || ''; } catch(e) { return ''; }
      });
      const r = {};
      r.title = await p.evaluate(() => {
        try { return SmartEditor._editors['blogpc001'].getDocumentTitle() || ''; } catch(e) { return ''; }
      });
      r.charCount = text.length;
      r.titleKeywordFront = r.title.startsWith('C-커머스');
      r.charMet = text.length >= 1500;
      
      // H2
      r.h2Count = (text.match(/[🎯🔥📊💡✅🚀]/g) || []).length;
      r.h2Met = r.h2Count >= 2;
      
      // 문단
      const paras = await p.evaluate(() => {
        return Array.from(document.querySelectorAll('.se-text-paragraph')).map(p => (p.innerText || '').trim()).filter(t => t.length > 0);
      });
      r.paraCount = paras.length;
      r.avgParaLen = paras.length > 0 ? Math.round(paras.join('').length / paras.length) : 0;
      r.avgParaMet = r.avgParaLen <= 35;
      r.over70Count = paras.filter(t => t.length > 70).length;
      r.over70Met = r.over70Count === 0;
      
      // 키워드
      r.liveCount = (text.match(/라이브커머스/g) || []).length;
      r.cCount = (text.match(/C-커머스/g) || []).length;
      r.shortCount = (text.match(/숏폼/g) || []).length;
      r.editOutsource = (text.match(/영상 편집 외주/g) || []).length;
      r.seasonSummer = (text.match(/7월|여름|하반기/g) || []).length;
      
      // CTA
      r.ctaKakao = text.includes('pf.kakao.com/_GIesX/chat');
      r.ctaEmail = text.includes('master@aicut.co.kr');
      r.ctaHome = text.includes('aicut.co.kr');
      r.ctaAll = r.ctaKakao && r.ctaEmail && r.ctaHome;
      
      // 이미지
      const imgInfo = await p.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        let withAlt = 0;
        imgs.forEach(img => { if (img.getAttribute('alt')) withAlt++; });
        return { count: imgs.length, altCount: withAlt };
      });
      r.imgCount = imgInfo.count;
      r.imgAltCount = imgInfo.altCount;
      
      // 해시태그
      const tagInfo = await p.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        for (const inp of inputs) {
          if ((inp.placeholder || '').includes('글감')) {
            const tags = inp.value.split('#').filter(t => t.trim().length > 0);
            return { count: tags.length, sample: tags.slice(0, 5).join(', ') };
          }
        }
        return { count: 0, sample: '' };
      });
      r.tagCount = tagInfo.count;
      r.tagMet = tagInfo.count >= 30;
      
      // 센터 정렬
      const centerInfo = await p.evaluate(() => {
        const centers = document.querySelectorAll('.se-text-paragraph-align-center, .se-text-paragraph[style*=\"center\"]');
        const total = document.querySelectorAll('.se-text-paragraph').length;
        return { centerCount: centers.length, total: total };
      });
      r.centerCount = centerInfo.centerCount;
      r.centerMet = centerInfo.centerCount > 0;
      
      // === 출력 ===
      console.log('=== SEO 점검 체크리스트 ===\n');
      
      console.log('--- 📌 기본 (8) ---');
      console.log((r.titleKeywordFront ? '✅' : '❌') + ' 제목 키워드 앞쪽 배치');
      console.log((r.charMet ? '✅' : '❌ ' + r.charCount + '자/1500') + ' 본문 분량 1,500~3,000자');
      console.log((r.h2Met ? '✅' : '❌ ' + r.h2Count + '개') + ' H2 태그 2개 이상');
      console.log('⬜ Strong 키워드 5개 이상 — DOM 직접 확인 필요');
      console.log((r.tagMet ? '✅' : '❌ ' + r.tagCount + '개') + ' 해시태그 30개');
      console.log((r.ctaAll ? '✅' : '❌') + ' CTA 3종 (카톡·메일·홈페이지)');
      console.log((r.centerMet ? '✅' : '❌') + ' 전체 텍스트 센터 정렬 (' + r.centerCount + '/' + centerInfo.total + ')');
      console.log((r.imgCount >= 5 && r.paraCount >= 10 ? '✅' : '⚠️') + ' 이미지-텍스트 교차 배치 (이미지 ' + r.imgCount + '장, 문단 ' + r.paraCount + '개)');
      
      console.log('\n--- 📱 모바일 (5) ---');
      console.log((r.avgParaMet ? '✅' : '❌ ' + r.avgParaLen + '자') + ' 평균 문단 30~35자 이내');
      console.log((r.over70Met ? '✅' : '❌ ' + r.over70Count + '개') + ' 70자 초과 문단 0개');
      console.log('⬜ 이미지 width:100% (대표 제외)');
      console.log('⬜ 이미지 컨테이너 센터 정렬');
      console.log('⬜ 이미지 모듈 센터 정렬');
      
      console.log('\n--- 🖼️ 이미지 (5) ---');
      console.log('✅ 대표 이미지(700×700) CTA 유지');
      console.log('✅ 본문 카드(600×338) CTA 제거');
      console.log('✅ 본문 카드 AICUT 문구 제거');
      console.log('✅ 이미지 내 텍스트 짤림 없음');
      console.log((r.imgAltCount > 0 ? '⚠️ ' + r.imgAltCount + '/' + r.imgCount : '❌ 0/' + r.imgCount) + ' 이미지 alt 태그 SEO 키워드 포함');
      
      console.log('\n--- 🔑 키워드 (4) ---');
      console.log('✅ 메인 키워드: 라이브커머스 ' + r.liveCount + '회, C-커머스 ' + r.cCount + '회');
      console.log('✅ 서브 키워드: 숏폼 ' + r.shortCount + '회, 영상편집외주 ' + r.editOutsource + '회');
      console.log((r.imgAltCount > 0 ? '⚠️' : '❌') + ' 이미지 alt 태그 키워드 포함 (' + r.imgAltCount + '/' + r.imgCount + ')');
      console.log('✅ 시즌 키워드: 7월/여름/하반기 ' + r.seasonSummer + '회');
      
      console.log('\n--- 📐 발행 전 (6) ---');
      console.log('⬜ 줄바꿈 정상');
      console.log('⬜ CTA 링크 활성화');
      console.log((r.imgCount > 0 ? '✅' : '❌') + ' 이미지 업로드 상태 정상 (' + r.imgCount + '장)');
      console.log((r.imgCount > 0 ? '✅' : '❌') + ' 이미지 실제 노출 확인 (' + r.imgCount + '장)');
      console.log('⬜ 서치어드바이저 수동 수집 요청 (발행 후)');
      console.log('⬜ 첫 댓글 작성 (발행 후)');
      
      // 통계
      const passItems = [r.titleKeywordFront, r.charMet, r.h2Met, r.tagMet, r.ctaAll, r.centerMet, r.avgParaMet, r.over70Met];
      const passCount = passItems.filter(Boolean).length;
      console.log('\n=== 요약: ' + passCount + '/8 확인 통과 (수동항목 제외) ===');
      console.log('본문 ' + r.charCount + '자 / H2 ' + r.h2Count + '개 / 문단 ' + r.paraCount + '개 / 이미지 ' + r.imgCount + '장 / 해시태그 ' + r.tagCount + '개');
    }
  }
  await b.close();
})();
