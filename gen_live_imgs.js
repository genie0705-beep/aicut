const { makeImage } = require('./skills/image_gen');

async function run() {
  const imgs = [
    { theme:'dark_purple', width:700, height:700, badge:'🛒 이커머스 마케팅', main:'라이브 커머스\n다시보기 영상,\n<em>편집 하나</em>로\n전환율 3배 차이', sub:'같은 방송, 다른 편집 — 결과가 달랐다', cta:'AICUT 무료상담 →', out:'aicut_blog_live_thumb.png' },
    { theme:'light_pink', width:800, height:450, badge:'📉 현실', main:'라이브 다시보기,\n<em>그냥 올리면</em> 안 되는 이유', sub:'2시간 방송, 5분 하이라이트 — 편집이 매출을 결정한다', cta:'에이컷 도입기 →', out:'aicut_blog_live_problem.png' },
    { theme:'dark_green', width:800, height:450, badge:'💡 해결', main:'편집 하나로\n<em>구매전환율 3배</em>\n올린 쇼핑몰의 비밀', sub:'C-커머스 시대, 차별화는 편집에서 시작된다', cta:'비법 확인하기 →', out:'aicut_blog_live_solution.png' },
    { theme:'light_cyan', width:800, height:450, badge:'📊 비교', main:'그냥 업로드 vs <em>에이컷 편집</em>', sub:'조회수·체류시간·클릭률 어디서 차이날까?', cta:'자세히 보기 →', out:'aicut_blog_live_compare.png' },
    { theme:'dark_purple', width:800, height:450, badge:'📞 지금 상담', main:'쇼핑몰·라이브커머스\n<em>영상 편집</em> 고민\n에이컷에 맡기세요', sub:'월 정기 납품, 편당 10만 원대부터', cta:'무료 상담 신청 →', out:'aicut_blog_live_cta.png' }
  ];
  for (const img of imgs) { console.log('생성:', img.out); const r = await makeImage(img); console.log('✅', r.file, '(' + r.sizeKB + 'KB)'); }
  console.log('완료');
}
run().catch(e => console.error('❌', e.message));
