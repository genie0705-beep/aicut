const { chromium } = require('playwright');

const CAPTION = `2026 제헌절, 19년 만에 돌아온 공휴일! 🎉
7월 17일 금요일, 3일 연휴 즐기는 법 총정리

📜 제헌절 의미
1948년 7월 17일, 대한민국 헌법이 제정된 날.
5대 국경일 중 하나지만 2008년부터 공휴일에서 제외되었다가,
2026년 다시 법정공휴일로 부활했습니다.

🎶 7/17 당일 무료 행사
• 사운드나루@서울 - 한일 뮤지션 쇼케이스 (서교스퀘어, 무료)
• 광화문 헌법 미디어아트 (광화문스퀘어)
• 서울풍물시장 주말장터 (송파구)

🏖️ 7월 서울 축제
• 서울썸머비치 (7/20~8/9, 광화문)
• DDP 바캉스 뮤직페스티벌 (7/31~8/2)
• 성북문화바캉스 (7/25~8/9)

소중한 연휴, 영상으로 기록하고 싶다면?
에이컷에서 전문 편집 도와드립니다 🎥`;

const HASHTAGS = '#제헌절 #2026제헌절 #공휴일 #3일연휴 #서울행사 #서울데이트 #가족나들이 #무료공연 #광화문 #서울썸머비치 #DDP바캉스 #사운드나루 #서울풍물시장 #영상편집 #에이컷';

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // Instagram 탭
  const insta = pages[1];
  await insta.bringToFront();
  await insta.waitForTimeout(2000);
  
  const url = insta.url();
  console.log('현재 Insta URL:', url);
  
  // 인스타그램 로그인 상태 확인
  const loginCheck = await insta.evaluate(() => {
    const body = document.body.innerText;
    const isLoggedIn = !body.includes('로그인') || body.includes('프로필') || body.includes('홈');
    return { isLoggedIn, textPreview: body.substring(0, 200) };
  });
  console.log('로그인 상태:', JSON.stringify(loginCheck));
  
  if (loginCheck.isLoggedIn) {
    // 피드 업로드 페이지로 이동
    await insta.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'networkidle', timeout: 15000 });
    await insta.waitForTimeout(3000);
    console.log('✅ 프로필 페이지 로드됨');
    
    // 만들기 버튼 클릭
    const createBtn = await insta.$('a[href*="create"], a[href*="upload"], svg[aria-label*="새" i], svg[aria-label*="new" i]');
    if (createBtn) {
      console.log('만들기 버튼 있음');
    } else {
      console.log('만들기 버튼 없음 - 모든 버튼 확인중');
      const buttons = await insta.evaluate(() => {
        return Array.from(document.querySelectorAll('a, button, [role="button"], svg')).slice(0, 20).map(el => ({
          tag: el.tagName,
          text: (el.innerText || el.getAttribute('aria-label') || '').substring(0, 30),
          href: el.getAttribute('href') || '',
        }));
      });
      console.log(JSON.stringify(buttons, null, 2));
    }
  }
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));
