const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = ctx.pages().find(x => x.url().includes('mail.daum'));
  if (!p) return console.log('no mail tab');

  await p.bringToFront();
  await p.waitForTimeout(1000);

  // Collect all emails from the data
  const emails = [
    'ljh817404@icloud.com', 'and_ove@naver.com', 'arang.partner@gmail.com',
    '10xbetter@naver.com', 'kor910809@gmail.com', 'ilovechampd@gmail.com',
    'dreampiarn@gmail.com', 'greemeet1@naver.com', 'wook@beauness.co.kr',
    'diwkd4968@gmail.com', 'pd.mealmates@gmail.com', 'bacorporation.kor@gmail.com',
    'h@moondo.ai', 'wjanffb0605@wjlogis.com', 'jej@awesomeent.kr',
    'sospi2020@naver.com', 'kaichem06@naver.com', 'whwnsry9656@kakao.com',
    'wonjae8272@naver.com', 'hha248@naver.com', 'ninemoonco@gmail.com',
    'tjdals44000@naver.com', 'kevin_cs@naver.com', 'kjn430@naver.com',
    'wjs8310@naver.com', 'entertainment3bro@gmail.com', 'salimbooboo@gmail.com',
    'inssafamily@gmail.com', 'ceo@nucompany.kr', '01094209600@naver.com',
    'yjgoja@gmail.com', 'info@loysent.com', 'ceo@prendstudio.com',
    'dos18050@gmail.com', 'contact@wellnessbox.kr', 'hongdegree@gmail.com',
    'imsilver1004@naver.com', 'growthcode@naver.com', 'yodelland@gmail.com',
    'leecn23@gmail.com', 'ming11ee@naver.com', 'jenna.kim@k20corp.com',
    'gustjr626@naver.com', 'big0944@gmail.com', 'co.dncstudio@gmail.com',
    'khronox.plus@gmail.com', 'sgy@awesomeent.kr', '0102848sert@gmail.com',
    'hgkim816@naver.com', 'kjmedia24@gmail.com', 'heisjune@naver.com',
    'dhlwnvuswlq310@gmail.com', 'el_la@adresult.kr', 'hkl110268@gmail.com',
    'rick23@hanmail.net', 'contact.edit.cat@gmail.com', 'pbj@awesomeent.kr',
    'crystal__ee@naver.com', 'tndus960903@naver.com', 'i960215@naver.com',
    'gjt007@naver.com', 'chul2409@gmail.com', 'tjdud0505@naver.com',
    'weplaym.studio@gmail.com', 'contact@ironcladtradingschool.com',
    'bssu2004@naver.com', 'recruit@kkst.kr', 'christmasky@gmail.com',
    'haeincompany1206@gmail.com', 'cutyponyo@naver.com', 'gsb518@hanmail.net',
    'doordragon1@gmail.com', 'jjw47@naver.com', 'contact@triangle-restory.com',
    'jeongseri1@gmail.com', 'byn1107@naver.com', 'rmfjsdl@gmail.com',
    'p863210@naver.com'
  ];

  // Join with semicolons
  const bccText = emails.join(';');

  // Clear and fill Bcc field
  await p.click('#bccTextarea', { clickCount: 3 });
  await p.fill('#bccTextarea', '');
  await p.fill('#bccTextarea', bccText);
  
  // Verify
  const filled = await p.inputValue('#bccTextarea');
  const count = filled.split(';').length;
  console.log('Bcc filled with ' + count + ' email addresses');
  console.log('Total chars: ' + filled.length);
})();
