// 네이버 광고 키워드 데이터 (2026-06-22 수집)
const keywords = [
  {kw:"AI영상", impr:"15", clicks:"0", status:"OFF", bid:"기본(2,500)"},
  {kw:"AI영상제작", impr:"7", clicks:"0", status:"노출가능", bid:"기본(2,500)"},
  {kw:"SNS영상편집", impr:"1", clicks:"0", status:"노출가능", bid:"1,500"},
  {kw:"강의영상제작", impr:"1", clicks:"0", status:"노출가능", bid:"기본(2,500)"},
  {kw:"광고영상제작", impr:"0", clicks:"0", status:"OFF"},
  {kw:"광고영상제작업체", impr:"0", clicks:"0", status:"OFF"},
  {kw:"광고영상편집", impr:"2", clicks:"0", status:"노출가능"},
  {kw:"광고편집대행", impr:"0", clicks:"0", status:"OFF"},
  {kw:"교육영상편집", impr:"0", clicks:"0", status:"OFF"},
  {kw:"기업영상제작", impr:"0", clicks:"0", status:"OFF"},
  {kw:"동영상편집대행", impr:"1", clicks:"0", status:"노출가능"},
  {kw:"동영상편집비용", impr:"0", clicks:"0", status:"OFF"},
  {kw:"동영상편집아웃소싱", impr:"0", clicks:"0", status:"OFF"},
  {kw:"동영상편집업체", impr:"2", clicks:"0", status:"노출가능"},
  {kw:"동영상편집외주", impr:"0", clicks:"0", status:"노출가능"},
  {kw:"릴스제작", impr:"11", clicks:"1", bid:"1,600", cost:"1,595원", status:"노출가능"},
  {kw:"릴스제작대행", impr:"31", clicks:"2", bid:"1,500", cost:"2,952원", status:"노출가능"},
  {kw:"릴스편집", impr:"147", clicks:"2", bid:"1,500", cost:"2,820원", status:"노출가능"},
  {kw:"릴스편집대행", impr:"6", clicks:"3", bid:"1,500", cost:"2,951원", status:"노출가능"},
  {kw:"법률사무소홍보영상", impr:"0", clicks:"0", status:"노출가능"},
  {kw:"쇼츠제작업체", impr:"13", clicks:"2", bid:"1,500", cost:"2,373원", status:"노출가능"},
  {kw:"쇼츠편집대행", impr:"0", clicks:"0", status:"노출가능"},
  {kw:"쇼츠편집외주", impr:"0", clicks:"0", status:"노출가능"},
  {kw:"숏폼마케팅", impr:"4", clicks:"0", status:"노출가능"},
  {kw:"숏폼영상제작", impr:"3", clicks:"0", status:"노출가능"},
  {kw:"숏폼영상제작대행", impr:"1", clicks:"0", status:"노출가능"},
  {kw:"숏폼영상제작비용", impr:"0", clicks:"0", status:"OFF"},
  {kw:"숏폼영상제작업체", impr:"0", clicks:"0", status:"노출가능"},
  {kw:"숏폼영상편집", impr:"4", clicks:"0", status:"노출가능"},
  {kw:"숏폼제작업체", impr:"8", clicks:"0", status:"노출가능"},
  {kw:"숏폼제작외주", impr:"0", clicks:"0", status:"노출가능"},
  {kw:"숏폼콘텐츠제작", impr:"0", clicks:"0", status:"노출가능"},
  {kw:"숏폼편집대행", impr:"0", clicks:"0", status:"노출가능"},
  {kw:"숏폼편집비용", impr:"0", clicks:"0", status:"OFF"},
  {kw:"숏폼편집업체", impr:"0", clicks:"0", status:"노출가능"},
  {kw:"숏폼편집외주", impr:"0", clicks:"0", status:"노출가능"},
  {kw:"아파트홍보영상", impr:"0", clicks:"0", status:"노출가능"},
  {kw:"영상마케팅", impr:"0", clicks:"0", status:"노출가능"},
  {kw:"영상제작", impr:"5", clicks:"0", status:"노출가능"},
  {kw:"영상제작견적", impr:"4", clicks:"0", status:"노출가능"},
  {kw:"영상제작업체", impr:"2", clicks:"0", status:"노출가능"},
  {kw:"영상제작외주업체", impr:"2", clicks:"0", status:"노출가능"},
  {kw:"영상콘텐츠제작", impr:"0", clicks:"0", status:"노출가능"},
  {kw:"영상편집", impr:"24", clicks:"0", bid:"1,800", status:"노출가능"},
  {kw:"영상편집가격", impr:"2", clicks:"0", status:"노출가능"},
  {kw:"영상편집견적", impr:"3", clicks:"0", status:"노출가능"},
  {kw:"영상편집단가", impr:"4", clicks:"0", status:"노출가능"},
  {kw:"영상편집대행", impr:"4", clicks:"0", status:"노출가능"},
  {kw:"영상편집대행사", impr:"0", clicks:"0", status:"노출가능"},
  {kw:"영상편집대행업체", impr:"1", clicks:"0", status:"노출가능"},
  {kw:"영상편집문의", impr:"1", clicks:"0", status:"노출가능"},
  {kw:"영상편집비용", impr:"0", clicks:"0", status:"OFF"},
  {kw:"영상편집비용견적", impr:"0", clicks:"0", status:"OFF"},
  {kw:"영상편집서비스", impr:"0", clicks:"0", status:"노출가능"},
  {kw:"영상편집아웃소싱", impr:"1", clicks:"0", status:"노출가능"},
  {kw:"영상편집업체", impr:"1", clicks:"0", status:"노출가능"},
  {kw:"영상편집업체추천", impr:"1", clicks:"0", status:"노출가능"},
  {kw:"영상편집외주", impr:"31", clicks:"1", bid:"1,600", cost:"1,705원", status:"노출가능"},
  {kw:"영상편집월비용", impr:"0", clicks:"0", status:"OFF"},
  {kw:"영상편집월정액서비스", impr:"0", clicks:"0", status:"OFF"},
  {kw:"영상편집전문", impr:"0", clicks:"0", status:"노출가능"},
  {kw:"영상편집전문업체", impr:"9", clicks:"0", status:"노출가능"},
  {kw:"영상편집프리랜서", impr:"12", clicks:"0", status:"노출가능"},
  {kw:"영상편집회사", impr:"7", clicks:"0", status:"노출가능"},
  {kw:"온라인강의영상편집", impr:"0", clicks:"0", status:"노출가능"},
  {kw:"월정액영상편집", impr:"0", clicks:"0", status:"OFF"},
  {kw:"유튜브동영상편집", impr:"3", clicks:"0", status:"노출가능"},
  {kw:"유튜브쇼츠편집", impr:"27", clicks:"0", bid:"1,500", status:"노출가능"},
  {kw:"유튜브영상제작", impr:"1", clicks:"0", status:"노출가능"},
  {kw:"유튜브영상제작대행", impr:"0", clicks:"0", status:"노출가능"},
  {kw:"유튜브영상제작업체", impr:"0", clicks:"0", status:"노출가능"},
  {kw:"유튜브영상편집", impr:"1", clicks:"0", status:"노출가능"},
  {kw:"유튜브영상편집대행", impr:"1", clicks:"0", status:"노출가능"},
  {kw:"유튜브영상편집비용", impr:"0", clicks:"0", status:"OFF"},
  {kw:"유튜브운영대행", impr:"1", clicks:"0", status:"노출가능"},
  {kw:"유튜브채널관리대행", impr:"0", clicks:"0", status:"노출가능"},
  {kw:"유튜브채널운영대행", impr:"1", clicks:"0", status:"노출가능"},
  {kw:"유튜브콘텐츠제작대행", impr:"0", clicks:"0", status:"노출가능"},
  {kw:"유튜브편집", impr:"1", clicks:"0", status:"노출가능"},
  {kw:"유튜브편집비용", impr:"0", clicks:"0", status:"OFF"},
  {kw:"유튜브편집외주", impr:"3", clicks:"1", bid:"1,500", cost:"1,376원", status:"노출가능"},
  {kw:"유튜브편집외주업체", impr:"0", clicks:"0", status:"OFF"},
  {kw:"의료기관홍보영상", impr:"0", clicks:"0", status:"OFF"},
  {kw:"이러닝영상제작", impr:"2", clicks:"0", status:"노출가능"},
  {kw:"인스타그램릴스", impr:"28", clicks:"0", bid:"1,800", status:"노출가능"},
  {kw:"인스타그램영상편집", impr:"23", clicks:"0", bid:"1,500", status:"노출가능"},
  {kw:"인스타릴스편집", impr:"59", clicks:"0", bid:"1,500", status:"노출가능"},
  {kw:"전문직영상마케팅", impr:"0", clicks:"0", status:"OFF"},
  {kw:"치과광고영상", impr:"0", clicks:"0", status:"OFF"},
  {kw:"캠페인영상", impr:"1", clicks:"0", status:"노출가능"}
];

// 분석
const active = keywords.filter(k => k.status === '노출가능');
const off = keywords.filter(k => k.status === 'OFF');
const hasClicks = keywords.filter(k => parseInt(k.clicks) > 0);
const hasImpr = keywords.filter(k => parseInt(k.impr) > 0);
const zeroImprActive = keywords.filter(k => k.status === '노출가능' && parseInt(k.impr) === 0);

console.log('=== 전체 현황 ===');
console.log('전체 키워드:', keywords.length);
console.log('운영중:', active.length);
console.log('OFF:', off.length);
console.log('클릭 >0:', hasClicks.length);
console.log('노출 >0:', hasImpr.length);
console.log('노출0 + 운영중:', zeroImprActive.length);

console.log('\n=== 클릭 발생 키워드 (TOP 7) ===');
hasClicks.sort((a,b) => parseInt(b.clicks) - parseInt(a.clicks)).forEach(k => {
  console.log(`${k.kw}: 노출${k.impr} 클릭${k.clicks} CTR${(parseInt(k.clicks)/parseInt(k.impr)*100).toFixed(1)}% 입찰가${k.bid||'기본'} 비용${k.cost||'0'}`);
});

console.log('\n=== 노출 많은데 클릭 0 (소재 개선 필요) ===');
const highImprNoClick = active.filter(k => parseInt(k.impr) >= 10 && parseInt(k.clicks) === 0);
highImprNoClick.sort((a,b) => parseInt(b.impr) - parseInt(a.impr)).forEach(k => {
  console.log(`${k.kw}: 노출${k.impr} 클릭0`);
});

console.log('\n=== 노출 0 + 운영중 (OFF 대상) ===');
zeroImprActive.forEach(k => console.log(k.kw));
