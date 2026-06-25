// 📝 블로그 초안 작성
// 인자: --topic="주제" (없으면 자동 추천)

const topics = [
  {
    prefix: '쇼핑몰·스마트스토어 운영자라면',
    title: '숏폼 마케팅에 주목해야 하는 이유',
    tags: ['이커머스', '쇼핑몰마케팅'],
    template: 'blog_draft_20260615.md'
  },
  {
    prefix: '부동산 중개사·공인중개사라면',
    title: '영상 마케팅을 시작해야 하는 이유',
    tags: ['부동산', '부동산마케팅'],
    template: 'blog_draft_20260615_v2.md'
  },
  {
    prefix: '병원·의원 원장님이라면',
    title: '영상 편집 아웃소싱이 답인 이유',
    tags: ['병원마케팅', '의료마케팅']
  },
  {
    prefix: '프리랜서 크리에이터라면',
    title: '정기 편집 파트너가 필요한 이유',
    tags: ['크리에이터', '1인미디어']
  },
];

module.exports = async function(cfg) {
  const idx = Math.floor(Math.random() * topics.length);
  const topic = topics[idx];
  
  console.log('주제: ' + topic.prefix + ' ' + topic.title);
  console.log('태그: ' + topic.tags.join(', '));
  console.log('\n(초안 작성 로직 — 각 주제별 템플릿 기반 생성)');
  
  return topic;
};
