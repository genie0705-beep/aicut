// 📊 성과 리포트
module.exports = async function(cfg) {
  const report = [
    '📊 에이컷 데일리 리포트',
    '='.repeat(30),
    '',
    '📅 ' + new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }),
    '',
    '🏪 브랜드: ' + cfg.brand + ' (' + cfg.site + ')',
    '📸 인스타: @' + cfg.insta_id,
    '📝 블로그: blog.naver.com/' + cfg.naver_blog,
    '',
    '💰 광고: 입찰가 ' + cfg.ad_bid_default.toLocaleString() + '원 | 예산 ' + cfg.ad_budget_daily.toLocaleString() + '원/일',
    '',
    '✅ 오늘 완료 작업:',
  ];
  
  console.log(report.join('\n'));
};
