// 유튜버/크리에이터 블로그 이미지 생성
const { makeTemplateImage } = require('./image_gen.js');

const CDP_PORT = '9224';
process.env.CDP_PORT = CDP_PORT;

async function main() {
  const IMAGES = [
    {
      tpl: 'main', badge: '🎬 크리에이터 마케팅',
      main: '유튜버·크리에이터라면\n<em>숏폼 편집</em>\n왜 직접 하면\n손해일까요?',
      sub: '편집은 에이컷에, 콘텐츠는 당신에게',
      cta: 'AICUT 무료상담 →',
      out: 'aicut_blog_youtuber_main.png'
    },
    {
      tpl: 'card', badge: '🎬 크리에이터 마케팅',
      main: '숏폼 편집에\n<em>하루 4시간</em>\n쓰고 계신가요?',
      sub: '크리에이터의 가장 큰 적은 편집 시간',
      cta: '',
      out: 'aicut_blog_youtuber_card1.png'
    },
    {
      tpl: 'cardDark', badge: '📱 숏폼 전략',
      main: '쇼츠·릴스·틱톡\n<em>업로드 빈도</em>가\n채널 성장의 핵심',
      sub: '꾸준한 업로드, 편집이 발목 잡지 않게',
      cta: '',
      out: 'aicut_blog_youtuber_card2.png'
    },
    {
      tpl: 'card', badge: '🤖 AI 시대',
      main: 'AI 편집 툴보다\n<em>전담 에디터</em>가\n나은 이유',
      sub: '자동 편집은 한계, 사람의 감각이 필요하다',
      cta: '',
      out: 'aicut_blog_youtuber_card3.png'
    },
    {
      tpl: 'ctaCard', badge: '✨ 에이컷',
      main: '숏폼 편집\n<em>월 정기 납품</em>\n지금 시작하세요',
      sub: '바쁜 크리에이터를 위한 최적의 선택',
      cta: '',
      out: 'aicut_blog_youtuber_cta.png'
    }
  ];

  for (const img of IMAGES) {
    console.log(`📸 ${img.out}...`);
    try {
      const r = await makeTemplateImage(img.tpl, img.badge, img.main, img.sub, img.cta, img.out);
      console.log(`   ✅ ${r.file} (${r.sizeKB}KB)`);
    } catch (e) {
      console.error(`   ❌ ${e.message}`);
    }
  }
  console.log('\n🎉 완료!');
}

main().catch(e => console.error('❌', e.message));
