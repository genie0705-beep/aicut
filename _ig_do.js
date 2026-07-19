const path = require('path');
const { chromium } = require('playwright');

(async () => {
  try {
    const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const ctx = b.contexts()[0];
    let page = ctx.pages().find(p => p.url().includes('create/select'));
    if (!page) {
      page = ctx.pages().find(p => p.url().includes('instagram'));
    }
    if (!page) page = await ctx.newPage();

    const images = ['ig_hosp_01.png','ig_hosp_02.png','ig_hosp_03.png','ig_hosp_04.png','ig_hosp_05.png'];
    const imgPaths = images.map(f => path.join(__dirname, f));

    await page.goto('https://www.instagram.com/create/select/', {timeout:15000, waitUntil:'networkidle'});
    await page.waitForTimeout(2000);
    console.log('1. URL:', page.url());

    // file input에 multiple 속성 추가
    await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]');
      if (input) {
        input.setAttribute('multiple', '');
        console.log('multiple attr added');
      }
    });

    const fi = page.locator('input[type="file"]');
    if (await fi.count() > 0) {
      await fi.first().setInputFiles(imgPaths);
      console.log('2. 5 images uploaded!');
      await page.waitForTimeout(4000);
      console.log('3. URL after:', page.url());

      // 다음 (crop)
      let nextBtn = page.locator('[role="button"], button').filter({hasText:'다음'});
      if (await nextBtn.count() > 0) {
        await nextBtn.first().click();
        console.log('Next (crop)');
        await page.waitForTimeout(2000);
      }

      // 다음 (filter)
      nextBtn = page.locator('[role="button"], button').filter({hasText:'다음'});
      if (await nextBtn.count() > 0) {
        await nextBtn.first().click();
        console.log('Next (filter)');
        await page.waitForTimeout(2000);
      }

      // 캡션
      const ta = page.locator('textarea');
      if (await ta.count() > 0) {
        const caption = [
          '병원 마케팅, 영상 콘텐츠로 신환 잡는 3가지 방법',
          '',
          '블로그로만 마케팅하던 시대는 끝났습니다.',
          '환자는 텍스트가 아닌 영상을 봅니다.',
          '',
          '피부과 - 비포애프터 영상으로 예약률 2배',
          '치과 - 시술 과정 30초 숏폼',
          '성형외과 - 자연스러운 수술 후기 영상',
          '',
          '촬영만 하세요, 편집은 에이컷이 합니다.',
          '영상편집 아웃소싱으로 병원 마케팅 해결하세요.',
          '',
          '무료상담',
          'pf.kakao.com/_GIesX/chat',
          'master@aicut.co.kr',
          'aicut.co.kr',
          '',
          '#병원마케팅 #영상마케팅 #숏폼마케팅 #피부과마케팅 #치과마케팅 #성형외과마케팅 #릴스 #의료마케팅 #영상편집아웃소싱 #에이컷 #AICUT'
        ].join('\n');

        await ta.first().evaluate((el, text) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
          setter.call(el, text);
          el.dispatchEvent(new Event('input', {bubbles:true}));
        }, caption);
        console.log('4. Caption entered');
      }

      // 위치
      const locBtn = page.locator('[role="button"]').filter({hasText:'위치 추가'});
      if (await locBtn.count() > 0) {
        await locBtn.first().click();
        await page.waitForTimeout(1000);
        const locInput = page.locator('input[type="text"]').first();
        if (await locInput.count() > 0) {
          await locInput.fill('서울');
          await page.waitForTimeout(2000);
          const seoulOpt = page.locator('[role="button"]').filter({hasText:'Seoul, South Korea'});
          if (await seoulOpt.count() > 0) {
            await seoulOpt.first().click();
            console.log('5. Location: Seoul');
          }
        }
      }

      console.log('\n✅ Final URL:', page.url());
      console.log('📌 공유 버튼을 직접 클릭해주세요');
      await page.screenshot({path:'ig_final_done.png', fullPage:false});
    }

    await b.close();
  } catch(e) { console.log('ERROR:', e.message); }
})();
