const XLSX = require('xlsx');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, 'blog_images', 'kw_data.xlsx'));
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

const dataRows = data.slice(2).filter(row => row[0] && String(row[0]).trim().length > 0);

const existing = new Set(['SNS영상편집','광고영상제작업체','광고영상편집','광고편집대행','기업영상제작','기업영상제작비용','기업영상제작업체','기업영상편집','기업유튜브운영','기업홍보영상제작','동영상마케팅','동영상제작외주','동영상편집','동영상편집가격','동영상편집대행','동영상편집비용','동영상편집아웃소싱','동영상편집업체','동영상편집외주','릴스제작','릴스제작대행','릴스편집','릴스편집대행','브랜드영상제작','쇼츠제작업체','쇼츠편집대행','쇼츠편집외주','숏폼영상제작대행','숏폼영상제작비용','숏폼영상제작업체','숏폼영상편집','숏폼제작업체','숏폼제작외주','숏폼콘텐츠제작','숏폼편집대행','숏폼편집비용','숏폼편집업체','숏폼편집외주','영상마케팅','영상제작','영상제작견적','영상제작업체','영상제작외주업체','영상콘텐츠제작','영상편집','영상편집가격','영상편집견적','영상편집단가','영상편집대행','영상편집대행사','영상편집대행업체','영상편집문의','영상편집비용','영상편집비용견적','영상편집서비스','영상편집아웃소싱','영상편집업체','영상편집업체추천','영상편집외주','영상편집월비용','영상편집월정액서비스','영상편집전문','영상편집전문업체','영상편집프리랜서','영상편집회사','월정액영상편집','유튜브쇼츠편집','유튜브영상제작','유튜브영상제작대행','유튜브영상제작업체','유튜브영상편집','유튜브영상편집대행','유튜브영상편집비용','유튜브운영대행','유튜브채널관리대행','유튜브채널운영대행','유튜브콘텐츠제작대행','유튜브편집','유튜브편집비용','유튜브편집외주','유튜브편집외주업체','인스타그램영상편집','인스타릴스편집','콘텐츠영상편집','틱톡영상편집','홍보영상제작','홍보영상제작업체','회사소개영상제작']);

// 에이컷 관련성 높은 키워드 필터링 (영상, 편집, 콘텐츠, 유튜브, 릴스, 숏폼 관련)
const RELEVANT_PATTERNS = ['영상','편집','콘텐츠','유튜브','릴스','숏폼','제작','외주','대행','월정액','납품','영상','동영상','쇼츠','인스타','채널','PD','MCN'];
const EXCLUDE_PATTERNS = ['후디니','발성','의사','3D','블렌더','BLENDER','치과','피부','병원','학원','촬영','사진','발성','발음','옥외','VJ학','블렌더3D'];

const allKws = dataRows.map(r => {
  const kw = String(r[0] || '').trim();
  const pc = r[1] === '< 10' ? 5 : (parseInt(r[1]) || 0);
  const mob = r[2] === '< 10' ? 5 : (parseInt(r[2]) || 0);
  return { kw, pc, mob, total: pc + mob, comp: String(r[7] || ''), adCount: parseInt(r[8]) || 0 };
});

const relevantNewKws = allKws
  .filter(k => !existing.has(k.kw.replace(/\s+/g,'')))
  .filter(k => RELEVANT_PATTERNS.some(p => k.kw.includes(p)))
  .filter(k => !EXCLUDE_PATTERNS.some(p => k.kw.includes(p)))
  .filter(k => k.total > 20)
  .sort((a,b) => b.total - a.total);

console.log('\n[에이컷 관련 신규 키워드 TOP 40]');
console.log('키워드                    | PC  | 모바일 | 합계 | 경쟁 | 광고수');
relevantNewKws.slice(0, 40).forEach(k =>
  console.log(`${k.kw.padEnd(26)}| ${String(k.pc).padStart(4)} | ${String(k.mob).padStart(5)} | ${String(k.total).padStart(4)} | ${k.comp.padEnd(4)} | ${k.adCount}`)
);

// 등록할 키워드 최종 리스트 (상위 20개)
console.log('\n[최종 등록 대상 키워드 20개]:');
const toRegister = relevantNewKws.slice(0, 20).map(k => k.kw);
toRegister.forEach((k, i) => console.log(`${i+1}. ${k}`));

module.exports = { toRegister };
