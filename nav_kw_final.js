const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const page = ctx.pages()[6];
  await new Promise(r => setTimeout(r, 1000));

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/tool/keyword-planner', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 4000));

  // "일치 검색 사용하기" 링크 클릭
  await page.evaluate(() => {
    const all = document.querySelectorAll('a, span, button');
    for (const el of all) {
      const t = (el.innerText || '').trim();
      if (t.includes('일치 검색')) {
        el.click(); return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  // textarea 찾기 (원하는 키워드를 직접 입력)
  const taInfo = await page.evaluate(() => {
    const tas = document.querySelectorAll('textarea');
    for (const ta of tas) {
      const ph = ta.placeholder || '';
      if (ph.includes('직접 입력')) {
        const r = ta.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      }
    }
    return null;
  });

  if (!taInfo) {
    console.log('입력 textarea 못 찾음');
    await b.close();
    process.exit(0);
  }
  console.log('입력창:', taInfo.x, taInfo.y, taInfo.w, taInfo.h);
  await page.mouse.click(taInfo.x + 10, taInfo.y + 10);
  await new Promise(r => setTimeout(r, 500));

  // 키워드 입력 (한 줄에 하나씩)
  const kws = [
    '영상편집외주',
    '영상편집업체',
    '영상편집대행',
    '숏폼제작',
    '숏폼영상제작',
    '동영상편집',
    '릴스제작',
    '인스타 릴스 편집',
    '영상마케팅',
    '병원마케팅',
    '쇼핑몰 영상편집',
    '부동산 유튜브',
    '변호사 유튜브',
    '세무사 마케팅',
    '프랜차이즈 영상',
    '온라인강의 편집'
  ];

  await page.keyboard.type(kws.join('\n'), { delay: 5 });
  console.log('키워드', kws.length, '개 입력');
  await new Promise(r => setTimeout(r, 1000));

  // 조회 버튼
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if ((b.innerText || '').trim().includes('조회')) {
        b.click(); return;
      }
    }
  });
  console.log('조회 버튼 클릭');
  await new Promise(r => setTimeout(r, 6000));

  // 결과 테이블 수집
  const result = await page.evaluate(() => {
    const text = document.body.innerText;
    const lines = text.split('\n');
    const data = [];
    let capture = false;
    
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i].trim();
      
      // 결과 테이블 시작 감지
      if (l === '연관키워드' || l === '월간검색수') {
        capture = true;
        continue;
      }
      
      if (capture && l.length > 0) {
        // 키워드로 보이는 항목 (2~10자, 한글/영문)
        if (/^[가-힣a-zA-Z\s]+$/.test(l) && l.length > 1 && l.length < 20) {
          const nextLine = lines[i+1]?.trim() || '';
          // 다음 줄이 숫자(검색량)인 경우
          if (/^[\d,]+$/.test(nextLine)) {
            data.push({ keyword: l, pc: nextLine });
          }
          const nextNext = lines[i+2]?.trim() || '';
          if (/^[\d,]+$/.test(nextNext)) {
            data.push({ keyword: l, mobile: nextNext });
          }
        }
      }
      
      // 결과 끝 감지
      if (l.includes('위의 영역에서') || l.includes('검색 결과가 없습니다')) {
        break;
      }
    }
    
    return data.length > 0 ? data : text.substring(0, 3000);
  });

  console.log('\n=== 📊 키워드 검색량 조회 결과 ===');
  if (Array.isArray(result)) {
    // 중복 제거
    const unique = {};
    result.forEach(r => {
      if (!unique[r.keyword]) unique[r.keyword] = {};
      if (r.pc) unique[r.keyword].PC = r.pc;
      if (r.mobile) unique[r.keyword].모바일 = r.mobile;
    });
    console.log('키워드\t\tPC\t모바일');
    console.log('-'.repeat(40));
    Object.entries(unique).forEach(([kw, vals]) => {
      console.log(`${kw.padEnd(16)}\t${vals.PC || '-'}\t${vals.모바일 || '-'}`);
    });
  } else {
    console.log(result);
  }

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
