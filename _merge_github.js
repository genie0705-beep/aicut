const fs = require('fs');
const path = require('path');

let html = fs.readFileSync('C:/Users/paul/.openclaw/workspace/public/index.html', 'utf8');

// 1. Replace description + add keywords
html = html.replace(
  '<meta name="description" content="롱폼 영상 편집 월 정기 아웃소싱. 전담 에디터 배정, D+3 납품, 재계약률 92%">\n<meta name="keywords" content="영상편집,숏폼편집,영상편집외주,릴스편집,유튜브편집">',
  '<meta name="description" content="숏폼 영상 편집 월 정기 아웃소싱. 전담 에디터 배정, D+1 납품, 재계약률 92%. 영상 편집 아웃소싱은 에이컷">\n<meta name="keywords" content="숏폼 영상편집, 릴스 편집, 영상편집 아웃소싱, 영상편집 외주, 숏폼 마케팅, 유튜브 쇼츠 편집, 틱톡 편집, 월정액 영상편집, 에이컷, AICUT, 영상편집 파트너">'
);

// 2. Replace og:title and og:description
html = html.replace(
  '<meta property="og:title" content="에이컷 - 기업·브랜드 전용 월정기 영상 편집 파트너">\n<meta property="og:description" content="롱폼 영상 편집 월 정기 아웃소싱. 전담 에디터 배정, D+3 납품, 재계약률 92%. 에이컷(AICUT)">',
  '<meta property="og:title" content="에이컷 AICUT — 채용 없이 매월 납품하는 영상편집 파트너">\n<meta property="og:description" content="숏폼 영상 편집 월 정기 아웃소싱. 전담 에디터 배정, D+1 납품, 재계약률 92%">'
);

// 3. Replace og:image
html = html.replace(
  '<meta property="og:image" content="https://genie0705-beep.github.io/aicut/og-image.png">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">',
  '<meta property="og:image" content="https://aicut.co.kr/images/og_image.png">\n<meta property="og:image:width" content="500">\n<meta property="og:image:height" content="300">'
);

// 4. Replace twitter block
html = html.replace(
  '<meta name="twitter:title" content="에이컷 - 기업·브랜드 전용 월정기 영상 편집 파트너">\n<meta name="twitter:description" content="롱폼 영상 편집 월 정기 아웃소싱. 전담 에디터 배정, D+3 납품, 재계약률 92%">\n<meta name="twitter:image" content="https://genie0705-beep.github.io/aicut/og-image.png">\n<meta name="twitter:site" content="@aicut_official">',
  '<meta name="twitter:card" content="summary_large_image">'
);

// 5. Replace video/image paths
const replaceMap = {
  'src="https://genie0705-beep.github.io/aicut/aicut_p.mp4"': 'src="./aicut/aicut_p.mp4"',
  'src="https://genie0705-beep.github.io/aicut/step1.png"': 'src="./aicut/step1.png"',
  'src="https://genie0705-beep.github.io/aicut/step2.png"': 'src="./aicut/step2.png"',
  'src="https://genie0705-beep.github.io/aicut/step3.png"': 'src="./aicut/step3.png"',
  'src="https://genie0705-beep.github.io/aicut/step4.png"': 'src="./aicut/step4.png"',
  'src="https://genie0705-beep.github.io/aicut/step5.png"': 'src="./aicut/step5.png"',
  'src="https://genie0705-beep.github.io/aicut/og-image.png"': 'src="./aicut/og-image.png"',
  'src="https://genie0705-beep.github.io/aicut/12358562-hd_1920_1080_30fps.mp4"': 'src="./aicut/12358562-hd_1920_1080_30fps.mp4"'
};

for (const [oldStr, newStr] of Object.entries(replaceMap)) {
  while (html.includes(oldStr)) {
    html = html.replace(oldStr, newStr);
  }
}

fs.writeFileSync('C:/Users/paul/.openclaw/workspace/public/index.html', html, 'utf8');

// Verify
const remainingGenie = (html.match(/genie0705-beep/g) || []).length;
const remainingAicutPaths = (html.match(/src="\.\/aicut\//g) || []).length;
const newOgTitle = html.includes('에이컷 AICUT — 채용 없이 매월 납품하는 영상편집 파트너');
const newOgImage = html.includes('aicut.co.kr/images/og_image.png');

console.log('Remaining genie0705-beep references:', remainingGenie);
console.log('New ./aicut/ paths:', remainingAicutPaths);
console.log('New OG title:', newOgTitle);
console.log('New OG image:', newOgImage);
console.log('DONE');
