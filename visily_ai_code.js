const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  let pages = ctx.pages();
  let page = null;
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].url().includes('visily.ai')) { page = pages[i]; break; }
  }
  if (!page) { console.log('no visily'); await b.close(); return; }

  await page.bringToFront();
  await new Promise(r => setTimeout(r, 2000));

  // Close popups
  for (let j = 0; j < 3; j++) {
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 300));
  }

  const prompt = [
    '공통코드 마스터 데이터 테이블 화면을 만들어줘.',
    '',
    '제목 "공통코드 마스터 테이블 정의서", enterprise 관리자 스타일, 한국어 라벨, 라이트 테마, compact 행',
    '',
    '컬럼: 그룹 | 화면 항목명 | 컬럼명 | 데이터타입 | Key/필수 | 설명',
    'PK는 빨강 배지, 필수는 주황 배지, 그룹별 헤더 띠로 묶기',
    '',
    '그룹\t화면 항목명\t컬럼명\t데이터타입\tKey/필수\t설명',
    '코드그룹\t코드그룹ID\tGROUP_CD\tVARCHAR\tPK\t',
    '코드그룹\t코드그룹명\tGROUP_NM\tVARCHAR\t필수\t',
    '코드그룹\t설명\tGROUP_DESC\tVARCHAR\t\t',
    '코드그룹\t사용여부\tUSE_YN\tCHAR\t\tY/N',
    '코드\t코드\tCD\tVARCHAR\tPK\t',
    '코드\t코드명\tCD_NM\tVARCHAR\t필수\t',
    '코드\t정렬순서\tSORT_ORDER\tINT\t\t',
    '코드\t속성1\tATTR1\tVARCHAR\t\t',
    '코드\t속성2\tATTR2\tVARCHAR\t\t',
    '코드\t사용여부\tUSE_YN\tCHAR\t\tY/N',
    '관리항목\t등록자\tCREATE_USER\tVARCHAR\t\t감사컬럼',
    '관리항목\t등록일시\tCREATE_DT\tDATETIME\t\t감사컬럼',
    '관리항목\t수정자\tUPDATE_USER\tVARCHAR\t\t감사컬럼',
    '관리항목\t수정일시\tUPDATE_DT\tDATETIME\t\t감사컬럼'
  ].join('\n');

  // Find visible textarea and type prompt
  const done = await page.evaluate((p) => {
    const tas = document.querySelectorAll('textarea');
    for (const ta of tas) {
      if (ta.offsetParent !== null) {
        ta.focus();
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
        setter.call(ta, p);
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        ta.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  }, prompt);

  console.log('Prompt pasted:', done);
  await new Promise(r => setTimeout(r, 1000));

  // Submit
  if (done) {
    await page.keyboard.press('Enter');
    console.log('Submitted');
    await new Promise(r => setTimeout(r, 5000));
    
    // Add to board
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.innerText && b.innerText.trim() === 'Add to board' && b.offsetParent !== null) {
          b.click();
          return true;
        }
      }
      return false;
    });
    await new Promise(r => setTimeout(r, 2000));
    console.log('Added to board');
  }

  await page.screenshot({ path: 'visily_code_result.png' });
  console.log('Done');

  await b.close();
})().catch(e => console.log('ERR:', e.message));
