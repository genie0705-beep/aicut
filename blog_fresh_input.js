// 새로고침 → 플레이스홀더 클릭 → 직접 타이핑 (React 인식)
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.accept(); } catch(e) {} });

  for (const p of ctx.pages()) {
    if (p.url().includes('postwrite')) {
      // 페이지 완전 새로고침
      await p.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
      await p.waitForTimeout(5000);
      console.log('페이지 로드 완료');

      // === 1) 팝업 제거 ===
      await p.evaluate(() => {
        const dims = document.querySelectorAll('[class*="dim"], [class*="popup"], [class*="layer"]');
        dims.forEach(el => el.remove());
      });
      await p.waitForTimeout(1000);
      console.log('팝업 제거 완료');

      // === 2) 제목 입력: "제목" 플레이스홀더 클릭 → 타이핑 ===
      const titleEl = await p.$('.se-title-text');
      if (titleEl) {
        await titleEl.click({ force: true });
        await p.waitForTimeout(1000);
        
        // '제목' 텍스트 지우기 (더블클릭 후 delete)
        await p.keyboard.press('Control+a');
        await p.waitForTimeout(200);
        await p.keyboard.press('Delete');
        await p.waitForTimeout(300);

        // 타이핑
        const titleText = '스타트업 CEO가 영상 PD 대신 월정기 편집을 선택한 이유';
        await p.keyboard.type(titleText, { delay: 15 });
        await p.waitForTimeout(500);
        console.log('✅ 제목 타이핑');
      }

      // === 3) 본문 입력: 에디터 영역 찾아서 클릭 ===
      // '글감과 함께 나의 일상을 기록해보세요!' ← 이 플레이스홀더 찾기
      const allEls = await p.$$('[class*="se-module-text"], [class*="editor"], [contenteditable]');
      let bodyClicked = false;
      
      for (const el of allEls) {
        const txt = await el.innerText().catch(() => '');
        const cls = await el.getAttribute('class').catch(() => '');
        if (txt.includes('글감과 함께') || txt.includes('나의 일상') || txt === '') {
          if (cls && cls.includes('se-title-text')) continue; // 제목 스킵
          
          console.log('본문 영역 클릭:', cls?.substring(0, 60));
          await el.click({ force: true });
          await p.waitForTimeout(1500);
          bodyClicked = true;
          break;
        }
      }

      if (!bodyClicked) {
        // contenteditable 직접 클릭 시도
        const ce = await p.$('[contenteditable="true"]');
        if (ce) {
          console.log('contenteditable 직접 클릭');
          await ce.click({ force: true });
          await p.waitForTimeout(1500);
          bodyClicked = true;
        }
      }

      if (bodyClicked) {
        // 본문 타이핑 - 모바일 최적화 간결 버전
        const lines = [
          '"편집을 어떻게 해결할까?"',
          '',
          '직접 하기엔 시간이 없고, 채용하기엔 비용이 부담스럽다.',
          '스타트업이라면 누구나 한 번쯤 하는 고민이다.',
          '',
          '대부분 선택하는 두 가지 길.',
          '',
          '프리랜서에게 건당 의뢰하거나,',
          '영상편집 월정액 서비스를 쓰거나.',
          '',
          '이 글에서 두 방식의 실제 비용과 운영 방식을 비교한다.',
          '',
          '───',
          '',
          '프리랜서 편집, 실제 비용은?',
          '',
          '월 10편 기준 50만~150만 원.',
          '여기에 브리핑·수정·납기 리스크가 더해진다.',
          '',
          '───',
          '',
          '에이컷 월정액, 비용 구조는?',
          '',
          '월 4편 기준 49만 원~',
          '전담 에디터 · 수정 무제한 · D+1 납품',
          '',
          '───',
          '',
          '지금 바로 무료 상담 신청하세요.',
          '👉 aicut.co.kr',
        ];

        for (const line of lines) {
          if (line === '') {
            await p.keyboard.press('Enter');
            await p.waitForTimeout(40);
          } else {
            await p.keyboard.type(line, { delay: 5 });
            await p.keyboard.press('Enter');
            await p.waitForTimeout(40);
          }
        }
        console.log('✅ 본문 타이핑 완료');
      }

      // === 4) 확인 ===
      await p.waitForTimeout(1000);
      const result = await p.evaluate(() => {
        const titleEl = document.querySelector('.se-title-text');
        const title = titleEl ? titleEl.innerText || '' : '';
        const bodyEls = document.querySelectorAll('[contenteditable]');
        let body = '';
        for (const el of bodyEls) {
          const t = el.innerText || '';
          if (t.length > body.length) body = t;
        }
        return { title: title.substring(0, 40), bodyLen: body.length, bodyPrev: body.substring(0, 80) };
      }).catch(() => ({}));

      console.log('\n=== 최종 확인 ===');
      console.log('제목:', result.title || '(비어있음)');
      console.log('본문:', result.bodyLen > 0 ? `${result.bodyLen}자 ✅` : '(비어있음)');
      if (result.bodyLen > 0) console.log('시작:', result.bodyPrev);

      break;
    }
  }

  try { await b.close(); } catch(e) {}
})();
